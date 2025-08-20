// src/bookings/bookings.service.ts
import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  ListBookingsQueryDto,
} from './dto/req/list-bookings-query.dto';
import { BookingDetailDto } from './dto/res/booking-detail.dto';
import { BookingSummaryDto } from './dto/res/booking-summary.dto';
import { BookingSeatDto } from './dto/res/booking-seat.dto';
import { PaymentSummaryDto } from './dto/res/payment-summary.dto';

type StudioType = 'Regular' | 'IMAX' | 'Premier';
type MovieStatus = 'COMING_SOON' | 'NOW_SHOWING' | 'ARCHIVED';
type PaymentStatus = 'Delayed' | 'Success' | 'Failed';

type Movie = {
  movieId: number;
  title: string;
  status: MovieStatus;
  durationMinutes: number;
};

type Theater = {
  theaterId: number;
  name: string;
  city: string;
};

type Studio = {
  studioId: number;
  theaterId: number;
  studioName: string;
  studioType: StudioType;
  totalSeats: number;
};

type Seat = {
  seatId: number;
  studioId: number;
  rowLetter: string;
  seatNumber: number;
  isBlocked: boolean;
};

type Showtime = {
  showtimeId: number;
  movieId: number;
  studioId: number;
  showDatetime: Date; // UTC
  price: number; // cents or basic int as per your schema (we treat as cents)
  isActive: boolean;
};

type Booking = {
  id: number;
  userId: number;
  showtimeId: number;
  bookingDatetime: Date;
  bookingStatus: BookingStatus;
  holdExpiresAt: Date | null;
  totalAmount: number; // cents
  bookingReference: string; // unique
};

type BookingSeat = {
  bookingSeatId: number;
  bookingId: number;
  seatId: number;
  showtimeId: number;
  priceCents: number;
  rowLetter: string;
  seatNumber: number;
};

type Payment = {
  paymentId: number;
  bookingId: number;
  amountCents: number;
  currency: 'IDR' | 'USD';
  paymentMethod: string;
  paymentTime?: Date;
  status: PaymentStatus;
};

@Injectable()
export class BookingsService {
  constructor() {}

  // ========= Config =========
  private readonly HOLD_MINUTES = 10;

  // ========= Dummy Data (in-memory) =========
  private movies: Movie[] = [
    {
      movieId: 1,
      title: 'The Electric Odyssey',
      status: 'NOW_SHOWING',
      durationMinutes: 128,
    },
    {
      movieId: 2,
      title: 'Garden of Echoes',
      status: 'COMING_SOON',
      durationMinutes: 102,
    },
  ];
  private theaters: Theater[] = [
    { theaterId: 100, name: 'Jakarta Central Cinema', city: 'Jakarta' },
    { theaterId: 200, name: 'Bandung Premiere', city: 'Bandung' },
  ];
  private studios: Studio[] = [
    {
      studioId: 1001,
      theaterId: 100,
      studioName: 'Studio 1',
      studioType: 'Regular',
      totalSeats: 150,
    },
    {
      studioId: 1002,
      theaterId: 100,
      studioName: 'IMAX 1',
      studioType: 'IMAX',
      totalSeats: 220,
    },
    {
      studioId: 2001,
      theaterId: 200,
      studioName: 'Premier A',
      studioType: 'Premier',
      totalSeats: 80,
    },
  ];
  private seats: Seat[] = this.buildSeatLayouts();
  private showtimes: Showtime[] = [
    {
      showtimeId: 50001,
      movieId: 1,
      studioId: 1001,
      showDatetime: new Date('2025-08-19T10:00:00Z'),
      price: 50000,
      isActive: true,
    },
    {
      showtimeId: 50002,
      movieId: 1,
      studioId: 1002,
      showDatetime: new Date('2025-08-19T13:30:00Z'),
      price: 80000,
      isActive: true,
    },
    {
      showtimeId: 60001,
      movieId: 1,
      studioId: 2001,
      showDatetime: new Date('2025-08-19T12:15:00Z'),
      price: 70000,
      isActive: true,
    },
  ];

  private bookings: Booking[] = [];
  private bookingSeats: BookingSeat[] = [];
  private payments: Payment[] = [];

  // Idempotency storage: scoped per user
  // key: `${userId}:${idempotencyKey}` -> bookingId
  private idempotencyIndex = new Map<string, number>();

  // auto-increment counters
  private bookingIdSeq = 10000;
  private bookingSeatIdSeq = 1;
  private paymentIdSeq = 1;

  // quick maps
  private moviesById = new Map(this.movies.map((m) => [m.movieId, m]));
  private theatersById = new Map(this.theaters.map((t) => [t.theaterId, t]));
  private studiosById = new Map(this.studios.map((s) => [s.studioId, s]));
  private seatsByStudio = new Map<number, Seat[]>(
    this.studios.map((s) => [
      s.studioId,
      this.seats.filter((seat) => seat.studioId === s.studioId),
    ]),
  );
  private showtimesById = new Map(
    this.showtimes.map((st) => [st.showtimeId, st]),
  );

  // ========= Public API =========

  /**
   * POST /v1/bookings
   */
  async createPendingBooking(args: {
    userId: number;
    showtimeId: number;
    seatIds: number[];
    idempotencyKey?: string;
  }): Promise<BookingDetailDto> {
    const { userId, showtimeId } = args;
    const seatIds = Array.from(new Set(args.seatIds || []));

    if (!seatIds.length) {
      throw new BadRequestException('seatIds must contain at least one seat');
    }

    const st = this.showtimesById.get(showtimeId);
    if (!st || !st.isActive)
      throw new NotFoundException('Showtime not found or inactive');

    const studio = this.studiosById.get(st.studioId)!;
    const theater = this.theatersById.get(studio.theaterId)!;
    const movie = this.moviesById.get(st.movieId)!;

    // Idempotency handling (if provided)
    if (args.idempotencyKey) {
      const key = `${userId}:${args.idempotencyKey}`;
      const existingId = this.idempotencyIndex.get(key);
      if (existingId) {
        const existing = this.getBookingDetail(userId, existingId);
        // quick check: if someone tries to reuse the same key but different payload, reject
        const bk = this.bookings.find((b) => b.id === existingId)!;
        const payloadSeatSet = new Set(seatIds);
        const seatsForExisting = this.bookingSeats
          .filter((bs) => bs.bookingId === bk.id)
          .map((bs) => bs.seatId);
        const existingSeatSet = new Set(seatsForExisting);
        const sameSeats =
          payloadSeatSet.size === existingSeatSet.size &&
          [...payloadSeatSet].every((x) => existingSeatSet.has(x));
        if (!sameSeats || bk.showtimeId !== showtimeId) {
          throw new ConflictException(
            'Idempotency-Key already used with different request payload',
          );
        }
        return existing;
      }
    }

    // Validate seats belong to this showtime's studio and are not blocked
    const studioSeats = this.seatsByStudio.get(studio.studioId) ?? [];
    const validSeatIds = new Set(studioSeats.map((s) => s.seatId));
    const blockedSeatIds = new Set(
      studioSeats.filter((s) => s.isBlocked).map((s) => s.seatId),
    );

    for (const seatId of seatIds) {
      if (!validSeatIds.has(seatId)) {
        throw new BadRequestException(
          `Seat ${seatId} does not belong to studio ${studio.studioId}`,
        );
      }
      if (blockedSeatIds.has(seatId)) {
        throw new BadRequestException(`Seat ${seatId} is blocked`);
      }
    }

    // Prevent double-booking (simulate unique (showtime_id, seat_id))
    const now = new Date();
    const reserved = this.computeReservedSeatIds(showtimeId, now);
    for (const seatId of seatIds) {
      if (reserved.has(seatId)) {
        throw new ConflictException(`Seat ${seatId} is already taken`);
      }
    }

    // Create Pending booking (hold)
    const bookingId = ++this.bookingIdSeq;
    const holdExpiresAt = new Date(now.getTime() + this.HOLD_MINUTES * 60_000);
    const bookingReference = this.generateRef();

    const seats: BookingSeat[] = [];
    for (const seatId of seatIds) {
      const seat = studioSeats.find((s) => s.seatId === seatId)!;
      seats.push({
        bookingSeatId: ++this.bookingSeatIdSeq,
        bookingId,
        seatId,
        showtimeId,
        priceCents: st.price, // copy price at time of booking
        rowLetter: seat.rowLetter,
        seatNumber: seat.seatNumber,
      });
    }

    const totalAmount = seats.reduce((sum, s) => sum + s.priceCents, 0);

    const booking: Booking = {
      id: bookingId,
      userId,
      showtimeId,
      bookingDatetime: now,
      bookingStatus: BookingStatus.Pending,
      holdExpiresAt,
      totalAmount,
      bookingReference,
    };

    this.bookings.push(booking);
    this.bookingSeats.push(...seats);

    if (args.idempotencyKey) {
      const key = `${userId}:${args.idempotencyKey}`;
      this.idempotencyIndex.set(key, bookingId);
    }

    return this.mapBookingDetail(booking);
  }

  /**
   * GET /v1/bookings
   */
  async listUserBookings(
    userId: number,
    query: ListBookingsQueryDto,
  ): Promise<BookingSummaryDto[]> {
    const rows = this.bookings
      .filter((b) => b.userId === userId)
      .filter((b) => (query.status ? b.bookingStatus === query.status : true))
      .sort((a, b) => +b.bookingDatetime - +a.bookingDatetime);

    return rows.map((b) => {
      const st = this.showtimesById.get(b.showtimeId)!;
      const studio = this.studiosById.get(st.studioId)!;
      const theater = this.theatersById.get(studio.theaterId)!;
      const movie = this.moviesById.get(st.movieId)!;

      const item: BookingSummaryDto = {
        bookingId: String(b.id),
        booking_reference: b.bookingReference,
        booking_status: b.bookingStatus,
        showtimeId: String(b.showtimeId),
        movieTitle: movie.title,
        theaterName: theater.name,
        studioName: studio.studioName,
        total_amount: b.totalAmount,
        booking_datetime_iso: b.bookingDatetime.toISOString(),
      };
      return item;
    });
  }

  /**
   * GET /v1/bookings/:bookingId
   */
  async getBookingDetail(
    userId: number,
    bookingId: number,
  ): Promise<BookingDetailDto> {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId)
      throw new ForbiddenException('Not your booking');

    return this.mapBookingDetail(booking);
  }

  /**
   * PATCH /v1/bookings/:bookingId/cancel
   */
  async cancelBooking(
    userId: number,
    bookingId: number,
  ): Promise<BookingDetailDto> {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId)
      throw new ForbiddenException('Not your booking');

    // Already finalized?
    if (
      booking.bookingStatus === BookingStatus.Confirmed ||
      booking.bookingStatus === BookingStatus.Claimed
    ) {
      throw new ConflictException('Cannot cancel a confirmed/claimed booking');
    }
    if (booking.bookingStatus === BookingStatus.Cancelled) {
      return this.mapBookingDetail(booking);
    }

    booking.bookingStatus = BookingStatus.Cancelled;
    booking.holdExpiresAt = null; // free immediately

    return this.mapBookingDetail(booking);
  }

  /**
   * PATCH /v1/bookings/:bookingId/confirm
   * (simulate success payment confirmation)
   */
  async confirmBooking(
    userId: number,
    bookingId: number,
  ): Promise<BookingDetailDto> {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId)
      throw new ForbiddenException('Not your booking');

    if (booking.bookingStatus === BookingStatus.Cancelled) {
      throw new ConflictException('Cannot confirm a cancelled booking');
    }
    if (booking.bookingStatus === BookingStatus.Confirmed) {
      return this.mapBookingDetail(booking);
    }

    // Extra safety: ensure seats still available (hold not expired or not taken)
    const now = new Date();
    const reservedByOthers = this.computeReservedSeatIds(
      booking.showtimeId,
      now,
      booking.id,
    );
    const seatsInThisBooking = this.bookingSeats.filter(
      (bs) => bs.bookingId === booking.id,
    );
    for (const bs of seatsInThisBooking) {
      if (reservedByOthers.has(bs.seatId)) {
        throw new ConflictException(`Seat ${bs.seatId} is no longer available`);
      }
    }

    booking.bookingStatus = BookingStatus.Confirmed;
    booking.holdExpiresAt = null;

    // Fake payment record
    const payment: Payment = {
      paymentId: this.paymentIdSeq++,
      bookingId: booking.id,
      amountCents: booking.totalAmount,
      currency: 'IDR',
      paymentMethod: 'VIRTUAL_ACCOUNT',
      paymentTime: new Date(),
      status: 'Success',
    };
    this.payments.push(payment);

    return this.mapBookingDetail(booking);
  }

  // ========= Helpers =========

  private mapBookingDetail(b: Booking): BookingDetailDto {
    const st = this.showtimesById.get(b.showtimeId)!;
    const studio = this.studiosById.get(st.studioId)!;
    const theater = this.theatersById.get(studio.theaterId)!;
    const movie = this.moviesById.get(st.movieId)!;

    const lines = this.bookingSeats.filter((bs) => bs.bookingId === b.id);
    const seats: BookingSeatDto[] = lines.map((bs) => ({
      seat_id: String(bs.seatId),
      row_letter: bs.rowLetter,
      seat_number: bs.seatNumber,
      price_cents: bs.priceCents,
    }));

    const pay = this.payments.find((p) => p.bookingId === b.id);
    const payment: PaymentSummaryDto | undefined = pay
      ? {
          amount_cents: pay.amountCents,
          currency: pay.currency,
          status: pay.status,
          payment_time_iso: pay.paymentTime?.toISOString(),
          method: pay.paymentMethod,
        }
      : undefined;

    return {
      bookingId: String(b.id),
      booking_reference: b.bookingReference,
      booking_status: b.bookingStatus,
      hold_expires_at: b.holdExpiresAt ? b.holdExpiresAt.toISOString() : null,
      userId: String(b.userId),
      showtimeId: String(b.showtimeId),
      movieTitle: movie.title,
      theaterName: theater.name,
      studioName: studio.studioName,
      seats,
      total_amount: b.totalAmount,
      payment,
    };
  }

  /** Seat IDs currently taken for a showtime (by others, or all) at `now`.
   *  Occupied if:
   *   - bookingStatus in (Confirmed, Claimed), OR
   *   - bookingStatus = Pending AND hold_expires_at > now
   *   - Cancelled/Expired DO NOT occupy
   *  If `excludeBookingId` is supplied, seats from that booking are ignored (used on confirm).
   */
  private computeReservedSeatIds(
    showtimeId: number,
    now: Date,
    excludeBookingId?: number,
  ): Set<number> {
    const activeBookings = this.bookings.filter(
      (b) =>
        b.showtimeId === showtimeId &&
        b.id !== (excludeBookingId ?? -1) &&
        (b.bookingStatus === BookingStatus.Confirmed ||
          b.bookingStatus === BookingStatus.Claimed ||
          (b.bookingStatus === BookingStatus.Pending &&
            !!b.holdExpiresAt &&
            b.holdExpiresAt > now)),
    );

    const ids = new Set<number>();
    for (const b of activeBookings) {
      for (const bs of this.bookingSeats) {
        if (bs.bookingId === b.id) ids.add(bs.seatId);
      }
    }
    return ids;
  }

  private buildSeatLayouts(): Seat[] {
    let id = 1;
    const out: Seat[] = [];
    const rowLetters = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        String.fromCharCode('A'.charCodeAt(0) + i),
      );

    const add = (
      studioId: number,
      rows: number,
      cols: number,
      blocked: Array<{ r: string; c: number }>,
    ) => {
      const letters = rowLetters(rows);
      for (const r of letters) {
        for (let c = 1; c <= cols; c++) {
          const isBlocked = blocked.some((b) => b.r === r && b.c === c);
          out.push({
            seatId: id++,
            studioId,
            rowLetter: r,
            seatNumber: c,
            isBlocked,
          });
        }
      }
    };

    // layouts for dummy studios
    add(1001, 10, 15, [
      { r: 'E', c: 8 },
      { r: 'F', c: 8 },
    ]); // Regular
    add(1002, 12, 20, [
      { r: 'G', c: 10 },
      { r: 'H', c: 10 },
    ]); // IMAX
    add(2001, 6, 12, [
      { r: 'C', c: 6 },
      { r: 'C', c: 7 },
    ]); // Premier

    return out;
  }

  private generateRef(): string {
    // Simple 8-char base36 reference (dummy)
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }
}
