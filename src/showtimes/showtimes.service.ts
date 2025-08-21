import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShowtimesListQueryDto } from './dto/req/showtimes-list-query.dto';
import {
  CreateShowtimeDto,
  UpdateShowtimeDto,
} from './dto/req/create-showtime.dto';
import { ShowtimeDetailDto } from './dto/res/showtime-detail.dto';
import { ShowtimeSeatAvailabilityDto } from './dto/res/showtime-seat-availability.dto';

const CI = Prisma.QueryMode.insensitive;

@Injectable()
export class ShowtimesService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                                   LISTING                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /showtimes
   * Filters: movieId, theaterId, city, studioType, dateFrom, dateTo, isActive
   * Pagination: cursor (showtime_id), limit (default 20)
   */
  async listShowtimes(
    query: ShowtimesListQueryDto,
  ): Promise<{ items: any[]; nextCursor?: string | null }> {
    const take = Math.min(query?.limit ?? 20, 100);
    const cursorId = query?.cursor ? Number(query.cursor) : undefined;
    if (query?.cursor && Number.isNaN(cursorId)) {
      throw new BadRequestException('Invalid cursor');
    }

    // Build where with joins for theater/city and studioType
    const where: Prisma.ShowtimeWhereInput = {
      ...(typeof query?.movieId === 'number'
        ? { movie_id: query.movieId }
        : {}),
      ...(typeof query?.theaterId === 'number'
        ? { studio: { theater_id: query.theaterId } }
        : {}),
      ...(query?.city
        ? { studio: { theater: { city: { equals: query.city, mode: CI } } } }
        : {}),
      ...(query?.studioType
        ? { studio: { studio_type: query.studioType as any } }
        : {}),
      ...(query?.dateFrom || query?.dateTo
        ? {
            show_datetime: {
              ...(query?.dateFrom
                ? { gte: startOfDayUTC(query.dateFrom) }
                : {}),
              ...(query?.dateTo ? { lte: endOfDayUTC(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(typeof (query as any)?.isActive !== 'undefined'
        ? {
            is_active:
              (query as any).isActive === 'true' ||
              (query as any).isActive === true,
          }
        : {}),
    };

    const rows = await this.prisma.showtime.findMany({
      where,
      orderBy: { showtime_id: 'asc' },
      ...(cursorId ? { cursor: { showtime_id: cursorId }, skip: 1 } : {}),
      take: take + 1,
      select: {
        showtime_id: true,
        movie_id: true,
        studio_id: true,
        show_datetime: true,
        price: true,
        is_active: true,
      },
    });

    let nextCursor: string | null = null;
    if (rows.length > take) {
      const extra = rows.pop()!;
      nextCursor = String(extra.showtime_id);
    }

    return {
      items: rows.map((r) => ({
        showtime_id: r.showtime_id,
        movie_id: r.movie_id,
        studio_id: r.studio_id,
        show_datetime: r.show_datetime,
        price: r.price,
        is_active: r.is_active,
      })),
      nextCursor,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                   DETAIL                                   */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /showtimes/:showtimeId
   */
  async getShowtimeDetail(showtimeId: number): Promise<ShowtimeDetailDto> {
    const st = await this.prisma.showtime.findUnique({
      where: { showtime_id: showtimeId },
      select: {
        showtime_id: true,
        movie_id: true,
        studio_id: true,
        show_datetime: true,
        price: true,
        is_active: true,
        movie: { select: { title: true } },
        studio: {
          select: {
            studio_name: true,
            theater: { select: { name: true } },
          },
        },
      },
    });
    if (!st) throw new NotFoundException('Showtime not found');

    const dto: ShowtimeDetailDto = {
      showtime_id: st.showtime_id,
      movie_id: st.movie_id,
      studio_id: st.studio_id,
      show_datetime: st.show_datetime.toISOString(),
      price: st.price,
      is_active: st.is_active,
      movie_title: st.movie.title,
      theater_name: st.studio.theater.name,
      studio_name: st.studio.studio_name,
    };
    return dto;
  }

  /* -------------------------------------------------------------------------- */
  /*                              SEAT AVAILABILITY                              */
  /* -------------------------------------------------------------------------- */

  /**
   * GET /showtimes/:showtimeId/seats
   * Status per seat: BLOCKED | BOOKED | HELD | AVAILABLE
   * - BLOCKED: Seat.is_blocked = true
   * - BOOKED: seat has BookingSeat where parent Booking.status in (Confirmed, Claimed)
   * - HELD:   seat has BookingSeat with Booking.status = Pending AND hold_expires_at > now()
   */
  async getShowtimeSeatAvailability(
    showtimeId: number,
  ): Promise<ShowtimeSeatAvailabilityDto[]> {
    // Load showtime & its studio id
    const showtime = await this.prisma.showtime.findUnique({
      where: { showtime_id: showtimeId },
      select: { showtime_id: true, studio_id: true },
    });
    if (!showtime) throw new NotFoundException('Showtime not found');

    // 1) All seats in the studio (static layout)
    const seats = await this.prisma.seat.findMany({
      where: { studio_id: showtime.studio_id },
      orderBy: [{ row_letter: 'asc' }, { seat_number: 'asc' }],
      select: {
        seat_id: true,
        row_letter: true,
        seat_number: true,
        is_blocked: true,
      },
    });

    // 2) Booking seats for this showtime that are either BOOKED or HELD (not expired)
    const now = new Date();
    const bookingSeats = await this.prisma.bookingSeat.findMany({
      where: {
        showtime_id: showtimeId,
        booking: {
          OR: [
            { booking_status: { in: ['Confirmed', 'Claimed'] as any } },
            { booking_status: 'Pending' as any, hold_expires_at: { gt: now } },
          ],
        },
      },
      select: {
        seat_id: true,
        booking: { select: { booking_status: true, hold_expires_at: true } },
      },
    });

    const bookedSet = new Set<number>();
    const heldMap = new Map<number, Date>(); // seat_id -> hold_expires_at

    for (const bs of bookingSeats) {
      const status = bs.booking.booking_status;
      if (status === 'Confirmed' || status === 'Claimed') {
        bookedSet.add(bs.seat_id);
      } else if (
        status === 'Pending' &&
        bs.booking.hold_expires_at &&
        bs.booking.hold_expires_at > now
      ) {
        // Do not mark as held if already booked (booked has precedence)
        if (!bookedSet.has(bs.seat_id)) {
          heldMap.set(bs.seat_id, bs.booking.hold_expires_at);
        }
      }
    }

    // 3) Merge statuses
    const result: ShowtimeSeatAvailabilityDto[] = seats.map((s) => {
      if (s.is_blocked) {
        return {
          seat_id: s.seat_id,
          row: s.row_letter,
          number: s.seat_number,
          status: 'BLOCKED',
        };
      }
      if (bookedSet.has(s.seat_id)) {
        return {
          seat_id: s.seat_id,
          row: s.row_letter,
          number: s.seat_number,
          status: 'BOOKED',
        };
      }
      const held = heldMap.get(s.seat_id);
      if (held) {
        return {
          seat_id: s.seat_id,
          row: s.row_letter,
          number: s.seat_number,
          status: 'HELD',
          hold_expires_at: held.toISOString(),
        };
      }
      return {
        seat_id: s.seat_id,
        row: s.row_letter,
        number: s.seat_number,
        status: 'AVAILABLE',
      };
    });

    return result;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 ADMIN CRUD                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * POST /showtimes
   */
  async createShowtime(body: CreateShowtimeDto): Promise<ShowtimeDetailDto> {
    // Validate movie & studio exist
    const [movie, studio] = await Promise.all([
      this.prisma.movie.findUnique({
        where: { movie_id: body.movie_id },
        select: { movie_id: true, title: true },
      }),
      this.prisma.studio.findUnique({
        where: { studio_id: body.studio_id },
        select: {
          studio_id: true,
          studio_name: true,
          theater: { select: { name: true } },
        },
      }),
    ]);
    if (!movie) throw new NotFoundException('Movie not found');
    if (!studio) throw new NotFoundException('Studio not found');

    const created = await this.prisma.showtime.create({
      data: {
        movie_id: body.movie_id,
        studio_id: body.studio_id,
        show_datetime: new Date(body.show_datetime),
        price: body.price,
        is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
      },
      select: {
        showtime_id: true,
        movie_id: true,
        studio_id: true,
        show_datetime: true,
        price: true,
        is_active: true,
      },
    });

    return {
      showtime_id: created.showtime_id,
      movie_id: created.movie_id,
      studio_id: created.studio_id,
      show_datetime: created.show_datetime.toISOString(),
      price: created.price,
      is_active: created.is_active,
      movie_title: movie.title,
      theater_name: studio.theater.name,
      studio_name: studio.studio_name,
    };
  }

  /**
   * PATCH /showtimes/:showtimeId
   */
  async updateShowtime(
    showtimeId: number,
    body: UpdateShowtimeDto,
  ): Promise<ShowtimeDetailDto> {
    // Ensure exists
    const exists = await this.prisma.showtime.findUnique({
      where: { showtime_id: showtimeId },
      select: { showtime_id: true },
    });
    if (!exists) throw new NotFoundException('Showtime not found');

    // If moving movie_id/studio_id, validate targets exist
    if (typeof body.movie_id === 'number') {
      const m = await this.prisma.movie.findUnique({
        where: { movie_id: body.movie_id },
        select: { movie_id: true },
      });
      if (!m) throw new NotFoundException('Movie not found');
    }
    if (typeof body.studio_id === 'number') {
      const s = await this.prisma.studio.findUnique({
        where: { studio_id: body.studio_id },
        select: { studio_id: true },
      });
      if (!s) throw new NotFoundException('Studio not found');
    }

    const updated = await this.prisma.showtime.update({
      where: { showtime_id: showtimeId },
      data: {
        movie_id: body.movie_id,
        studio_id: body.studio_id,
        show_datetime: body.show_datetime
          ? new Date(body.show_datetime)
          : undefined,
        price: typeof body.price === 'number' ? body.price : undefined,
        is_active:
          typeof body.is_active === 'boolean' ? body.is_active : undefined,
      },
      select: {
        showtime_id: true,
        movie_id: true,
        studio_id: true,
        show_datetime: true,
        price: true,
        is_active: true,
        movie: { select: { title: true } },
        studio: {
          select: { studio_name: true, theater: { select: { name: true } } },
        },
      },
    });

    return {
      showtime_id: updated.showtime_id,
      movie_id: updated.movie_id,
      studio_id: updated.studio_id,
      show_datetime: updated.show_datetime.toISOString(),
      price: updated.price,
      is_active: updated.is_active,
      movie_title: updated.movie.title,
      theater_name: updated.studio.theater.name,
      studio_name: updated.studio.studio_name,
    };
  }

  /**
   * DELETE /showtimes/:showtimeId
   * If bookings exist for this showtime, we soft-disable it (is_active=false).
   * Otherwise, delete the row.
   */
  async deleteShowtime(showtimeId: number): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.showtime.findUnique({
      where: { showtime_id: showtimeId },
      select: { showtime_id: true },
    });
    if (!existing) throw new NotFoundException('Showtime not found');

    const bookings = await this.prisma.booking.count({
      where: { showtime_id: showtimeId },
    });
    if (bookings > 0) {
      await this.prisma.showtime.update({
        where: { showtime_id: showtimeId },
        data: { is_active: false },
      });
      return { deleted: true };
    }

    await this.prisma.showtime.delete({ where: { showtime_id: showtimeId } });
    return { deleted: true };
  }
}

/* --------------------------------- helpers --------------------------------- */

function startOfDayUTC(dateStr: string): Date {
  // Accepts 'YYYY-MM-DD' or ISO; normalizes to 00:00:00Z
  const d = new Date(dateStr);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function endOfDayUTC(dateStr: string): Date {
  // Normalizes to 23:59:59.999Z
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
