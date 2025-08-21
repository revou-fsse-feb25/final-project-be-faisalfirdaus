import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, BookingStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookingDto } from './dto/req/create-booking.dto';
import { BookingCancelDto } from './dto/req/booking-cancel.dto';
import { MyBookingsQueryDto } from './dto/req/my-bookings-query.dto';
import { BookingDetailDto } from './dto/res/booking-detail.dto';
import { User } from 'src/users/entities/user.entity';
import { AdminBookingsQueryDto } from './dto/req/admin-bookings-query.dto';
import { UsersBookingsQueryDto } from './dto/req/users-bookings-query.dto';

const HOLD_MINUTES = 10;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /bookings
   * Create a "Pending" booking hold if seats are available.
   */
  async createBookingHold(
    user: User,
    body: CreateBookingDto,
  ): Promise<BookingDetailDto> {
    if (!body.seats?.length) {
      throw new BadRequestException('NO_SEATS_SELECTED');
    }

    // Load showtime
    const showtime = await this.prisma.showtime.findUnique({
      where: { showtime_id: body.showtimeId },
      select: {
        showtime_id: true,
        studio_id: true,
        price: true,
        is_active: true,
      },
    });
    if (!showtime || !showtime.is_active) {
      throw new BadRequestException('SHOWTIME_UNAVAILABLE');
    }

    // Validate seats belong to the showtime's studio & not blocked
    const seats = await this.prisma.seat.findMany({
      where: { seat_id: { in: body.seats } },
      select: {
        seat_id: true,
        studio_id: true,
        row_letter: true,
        seat_number: true,
        is_blocked: true,
      },
    });
    if (seats.length !== body.seats.length) {
      throw new BadRequestException('INVALID_SEAT_IDS');
    }
    const invalidStudio = seats.find((s) => s.studio_id !== showtime.studio_id);
    if (invalidStudio) {
      throw new BadRequestException('SEAT_NOT_IN_SHOWTIME_STUDIO');
    }
    const blocked = seats.find((s) => s.is_blocked);
    if (blocked) {
      throw new BadRequestException('SEAT_BLOCKED');
    }

    const now = new Date();
    const holdExpiresAt = new Date(now.getTime() + HOLD_MINUTES * 60_000);

    // Check live conflicts: already BOOKED or currently HELD
    const conflicting = await this.prisma.bookingSeat.findMany({
      where: {
        showtime_id: showtime.showtime_id,
        seat_id: { in: body.seats },
        booking: {
          OR: [
            {
              booking_status: {
                in: [BookingStatus.Confirmed, BookingStatus.Claimed],
              },
            },
            {
              booking_status: BookingStatus.Pending,
              hold_expires_at: { gt: now },
            },
          ],
        },
      },
      select: {
        seat_id: true,
        booking: {
          select: {
            booking_status: true,
            hold_expires_at: true,
            booking_reference: true,
          },
        },
      },
    });
    if (conflicting.length) {
      const first = conflicting[0];
      throw new BadRequestException({
        code: 'SEAT_UNAVAILABLE',
        message:
          first.booking.booking_status === 'Pending'
            ? 'Seat is held by another user.'
            : 'Seat is already booked.',
        bookingReference: first.booking.booking_reference,
      });
    }

    const totalAmount = showtime.price * body.seats.length;

    // Create booking + booking seats atomically
    const booking = await this.prisma.$transaction(async (tx) => {
      const reference = await this.generateUniqueReference(tx);

      const created = await tx.booking.create({
        data: {
          user_id: user.id,
          showtime_id: showtime.showtime_id,
          booking_status: BookingStatus.Pending,
          hold_expires_at: holdExpiresAt,
          total_amount: totalAmount,
          booking_reference: reference,
        },
        select: { id: true, booking_reference: true },
      });

      await tx.bookingSeat.createMany({
        data: body.seats.map((sid) => ({
          booking_id: created.id,
          seat_id: sid,
          showtime_id: showtime.showtime_id,
          price: showtime.price,
        })),
      });

      return tx.booking.findUnique({
        where: { id: created.id },
        include: {
          bookingSeats: {
            include: {
              seat: {
                select: {
                  seat_id: true,
                  row_letter: true,
                  seat_number: true,
                },
              },
            },
          },
          payments: true,
        },
      });
    });

    return this.mapBookingToDto(booking!);
  }

  /**
   * GET /bookings/:bookingReference
   * User can only access own bookings unless ADMIN.
   */
  async getBookingByReference(
    user: User,
    bookingReference: string,
  ): Promise<BookingDetailDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { booking_reference: bookingReference },
      include: {
        bookingSeats: { include: { seat: true } },
        payments: true,
      },
    });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');

    if (booking.user_id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    return this.mapBookingToDto(booking);
  }

  /**
   * GET /me/bookings
   */
  async listMyBookings(
    user: User,
    query: MyBookingsQueryDto,
  ): Promise<BookingDetailDto[]> {
    const where: Prisma.BookingWhereInput = {
      user_id: user.id,
      ...(query.status ? { booking_status: query.status as any } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            booking_datetime: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: endOfDayUTC(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const rows = await this.prisma.booking.findMany({
      where,
      orderBy: { booking_datetime: 'desc' },
      include: {
        bookingSeats: { include: { seat: true } },
        payments: true,
      },
    });

    return rows.map((b) => this.mapBookingToDto(b));
  }

  /**
   * POST /bookings/:bookingReference/cancel
   * Allowed for owner or ADMIN, only when Pending.
   */
  async cancelBooking(
    user: User,
    bookingReference: string,
    _body: BookingCancelDto,
  ): Promise<{ cancelled: boolean }> {
    const booking = await this.prisma.booking.findUnique({
      where: { booking_reference: bookingReference },
      select: { id: true, user_id: true, booking_status: true },
    });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    if (booking.user_id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    if (booking.booking_status !== BookingStatus.Pending) {
      throw new BadRequestException('ONLY_PENDING_CAN_BE_CANCELLED');
    }

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { booking_status: BookingStatus.Cancelled, hold_expires_at: null },
    });

    return { cancelled: true };
  }

  /**
   * POST /bookings/:bookingReference/claim (ADMIN)
   * Mark a confirmed booking as claimed (used).
   */
  async claimBooking(bookingReference: string): Promise<{ claimed: boolean }> {
    const booking = await this.prisma.booking.findUnique({
      where: { booking_reference: bookingReference },
      select: { id: true, booking_status: true },
    });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');

    if (booking.booking_status !== BookingStatus.Confirmed) {
      throw new BadRequestException('ONLY_CONFIRMED_CAN_BE_CLAIMED');
    }

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { booking_status: BookingStatus.Claimed },
    });

    return { claimed: true };
  }

  /* ----------------------------- ADMIN LISTING ------------------------------ */

  /** ADMIN: list all bookings with filters + cursor pagination */
  async listAllBookings(
    query: AdminBookingsQueryDto,
  ): Promise<BookingDetailDto[]> {
    const where: Prisma.BookingWhereInput = {
      ...(query.userId ? { user_id: query.userId } : {}),
      ...(query.showtimeId ? { showtime_id: query.showtimeId } : {}),
      ...(query.status ? { booking_status: query.status as any } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            booking_datetime: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: endOfDayUTC(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const take = Math.min(query.limit ?? 20, 100);
    const cursorId = query.cursor ? Number(query.cursor) : undefined;

    const rows = await this.prisma.booking.findMany({
      where,
      orderBy: { id: 'desc' },
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      take,
      include: {
        bookingSeats: { include: { seat: true } },
        payments: true,
      },
    });

    return rows.map((b) => this.mapBookingToDto(b));
  }

  /** ADMIN: list bookings for a specific user */
  async listUserBookings(
    userId: number,
    query: UsersBookingsQueryDto,
  ): Promise<BookingDetailDto[]> {
    const where: Prisma.BookingWhereInput = {
      user_id: userId,
      ...(query.status ? { booking_status: query.status as any } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            booking_datetime: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: endOfDayUTC(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const rows = await this.prisma.booking.findMany({
      where,
      orderBy: { booking_datetime: 'desc' },
      include: {
        bookingSeats: { include: { seat: true } },
        payments: true,
      },
    });

    return rows.map((b) => this.mapBookingToDto(b));
  }

  /* --------------------------------- helpers -------------------------------- */

  private async generateUniqueReference(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    // BK-<base36 timestamp>-<random>
    for (let i = 0; i < 5; i++) {
      const ref = `BK-${Date.now()
        .toString(36)
        .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const exists = await tx.booking.findUnique({
        where: { booking_reference: ref },
        select: { id: true },
      });
      if (!exists) return ref;
    }
    throw new BadRequestException('REFERENCE_GENERATION_FAILED');
  }

  private mapBookingToDto(b: {
    id: number;
    booking_reference: string;
    booking_status: BookingStatus;
    showtime_id: number;
    user_id: number;
    total_amount: number;
    hold_expires_at: Date | null;
    bookingSeats: {
      booking_seat_id: number;
      seat_id: number;
      price: number;
      seat: { seat_id: number; row_letter: string; seat_number: number };
    }[];
    payments: {
      payment_id: number;
      amount: number;
      payment_time: Date;
      status: PaymentStatus;
    }[];
  }): BookingDetailDto {
    return {
      booking_reference: b.booking_reference,
      booking_status: b.booking_status,
      showtime_id: b.showtime_id,
      user_id: b.user_id,
      total_amount: b.total_amount,
      hold_expires_at: b.hold_expires_at
        ? b.hold_expires_at.toISOString()
        : undefined,
      seats: b.bookingSeats.map((s) => ({
        booking_seat_id: s.booking_seat_id,
        seat_id: s.seat.seat_id,
        row: s.seat.row_letter,
        number: s.seat.seat_number,
        price: s.price,
      })),
      payments: b.payments.map((p) => ({
        payment_id: p.payment_id,
        amount: p.amount,
        payment_time: p.payment_time.toISOString(),
        status: p.status,
      })),
    };
  }
}

function endOfDayUTC(dateStr: string): Date {
  const d = new Date(dateStr);
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}
