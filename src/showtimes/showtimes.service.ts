// src/showtimes/showtimes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ShowtimeDetailDto } from './dto/res/showtime-detail.dto';
import { ShowtimeSeatAvailabilityDto } from './dto/res/showtime-seat-availability.dto';

// ---------- Domain types (camelCased versions of your DB schema) ----------
type MovieStatus = 'COMING_SOON' | 'NOW_SHOWING' | 'ARCHIVED';
type StudioType = 'Regular' | 'IMAX' | 'Premier';
type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Claimed'
  | 'Cancelled'
  | 'Expired';

type Movie = {
  movieId: number;
  title: string;
  description?: string | null;
  durationMinutes: number;
  posterUrl?: string | null;
  status: MovieStatus;
  isActive: boolean;
};

type Theater = {
  theaterId: number;
  name: string;
  address: string;
  city: string;
  phone: string;
};

type Studio = {
  studioId: number;
  theaterId: number;
  studioName: string;
  totalSeats: number;
  studioType: StudioType;
};

type Seat = {
  seatId: number;
  studioId: number;
  rowLetter: string; // "A", "B", ...
  seatNumber: number; // 1..N
  isBlocked: boolean; // static block (pillar, broken seat, etc.)
};

type Showtime = {
  showtimeId: number;
  movieId: number;
  studioId: number;
  showDatetime: Date; // UTC
  price: number; // int
  isActive: boolean;
};

type Booking = {
  id: number;
  userId: number;
  showtimeId: number;
  bookingDatetime: Date;
  bookingStatus: BookingStatus;
  holdExpiresAt?: Date | null; // only meaningful for Pending
  totalAmount: number;
  bookingReference: string;
};

type BookingSeat = {
  bookingSeatId: number;
  bookingId: number;
  seatId: number;
  showtimeId: number;
  priceCents: number;
};

@Injectable()
export class ShowtimesService {
  // =======================
  // Dummy Data
  // =======================
  private readonly movies: Movie[] = [
    {
      movieId: 1,
      title: 'The Electric Odyssey',
      durationMinutes: 128,
      posterUrl: '',
      status: 'NOW_SHOWING',
      isActive: true,
    },
    {
      movieId: 2,
      title: 'Garden of Echoes',
      durationMinutes: 102,
      posterUrl: '',
      status: 'COMING_SOON',
      isActive: true,
    },
  ];

  private readonly theaters: Theater[] = [
    {
      theaterId: 100,
      name: 'Jakarta Central Cinema',
      address: 'Jl. Merdeka 1',
      city: 'Jakarta',
      phone: '021-1111',
    },
    {
      theaterId: 200,
      name: 'Bandung Premiere',
      address: 'Jl. Braga 10',
      city: 'Bandung',
      phone: '022-2222',
    },
  ];

  private readonly studios: Studio[] = [
    {
      studioId: 1001,
      theaterId: 100,
      studioName: 'Studio 1',
      totalSeats: 150,
      studioType: 'Regular',
    },
    {
      studioId: 1002,
      theaterId: 100,
      studioName: 'IMAX 1',
      totalSeats: 220,
      studioType: 'IMAX',
    },
    {
      studioId: 2001,
      theaterId: 200,
      studioName: 'Premier A',
      totalSeats: 80,
      studioType: 'Premier',
    },
  ];

  private readonly seats: Seat[] = this.buildSeatLayouts();

  private readonly showtimes: Showtime[] = [
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
      isActive: false,
    }, // inactive sample
  ];

  // Bookings + booked/held seats (live availability)
  private readonly bookings: Booking[] = [
    // Confirmed booking (always occupies seats)
    {
      id: 9001,
      userId: 42,
      showtimeId: 50001,
      bookingDatetime: new Date('2025-08-18T03:00:00Z'),
      bookingStatus: 'Confirmed',
      totalAmount: 100000,
      bookingReference: 'ABC123',
    },
    // Pending (hold) — only occupies if not expired yet
    {
      id: 9002,
      userId: 77,
      showtimeId: 50001,
      bookingDatetime: new Date('2025-08-19T02:00:00Z'),
      bookingStatus: 'Pending',
      holdExpiresAt: new Date('2025-08-19T09:59:59Z'),
      totalAmount: 50000,
      bookingReference: 'HOLD001',
    },
    // Cancelled — should NOT occupy seats
    {
      id: 9003,
      userId: 55,
      showtimeId: 50001,
      bookingDatetime: new Date('2025-08-19T02:30:00Z'),
      bookingStatus: 'Cancelled',
      totalAmount: 50000,
      bookingReference: 'CANCEL01',
    },
  ];

  private readonly bookingSeats: BookingSeat[] = [
    // Confirmed seats (occupied)
    {
      bookingSeatId: 1,
      bookingId: 9001,
      seatId: this.findSeatId(1001, 'D', 5),
      showtimeId: 50001,
      priceCents: 50000,
    },
    {
      bookingSeatId: 2,
      bookingId: 9001,
      seatId: this.findSeatId(1001, 'D', 6),
      showtimeId: 50001,
      priceCents: 50000,
    },
    // Pending seats (occupied if not expired)
    {
      bookingSeatId: 3,
      bookingId: 9002,
      seatId: this.findSeatId(1001, 'E', 8),
      showtimeId: 50001,
      priceCents: 50000,
    },
    // Cancelled seats (should NOT occupy)
    {
      bookingSeatId: 4,
      bookingId: 9003,
      seatId: this.findSeatId(1001, 'E', 9),
      showtimeId: 50001,
      priceCents: 50000,
    },
  ];

  // Quick lookup maps
  private moviesById = new Map(this.movies.map((m) => [m.movieId, m]));
  private theatersById = new Map(this.theaters.map((t) => [t.theaterId, t]));
  private studiosById = new Map(this.studios.map((s) => [s.studioId, s]));
  private seatsByStudio = new Map<number, Seat[]>(
    this.studios.map((s) => [
      s.studioId,
      this.seats.filter((seat) => seat.studioId === s.studioId),
    ]),
  );

  // =======================
  // Public API
  // =======================

  async getShowtimeDetail(showtimeId: number): Promise<ShowtimeDetailDto> {
    const st = this.showtimes.find((x) => x.showtimeId === showtimeId);
    if (!st) throw new NotFoundException('Showtime not found');

    const movie = this.moviesById.get(st.movieId);
    const studio = this.studiosById.get(st.studioId);
    if (!movie || !studio)
      throw new NotFoundException('Related movie/studio not found');

    const theater = this.theatersById.get(studio.theaterId);
    if (!theater) throw new NotFoundException('Theater not found');

    return {
      showtimeId: String(st.showtimeId),
      movieId: String(movie.movieId),
      movieTitle: movie.title,
      theaterId: String(theater.theaterId),
      theaterName: theater.name,
      city: theater.city,
      studioId: String(studio.studioId),
      studioName: studio.studioName,
      studioType: studio.studioType,
      showDatetimeISO: st.showDatetime.toISOString(), // keep UTC ISO
      price: st.price,
      is_active: st.isActive,
    };
  }

  /**
   * Merge static layout with live holds/bookings:
   * - Seat is NOT available if:
   *   - it's statically blocked, OR
   *   - it appears in a booking for this showtime with status:
   *       Confirmed / Claimed (always occupy), OR
   *       Pending AND hold_expires_at > now
   *   - Cancelled / Expired never occupy
   */
  async getShowtimeSeatAvailability(
    showtimeId: number,
  ): Promise<ShowtimeSeatAvailabilityDto[]> {
    const st = this.showtimes.find((x) => x.showtimeId === showtimeId);
    if (!st) throw new NotFoundException('Showtime not found');

    const studio = this.studiosById.get(st.studioId);
    if (!studio) throw new NotFoundException('Studio not found');

    const seats = this.seatsByStudio.get(studio.studioId) ?? [];
    const now = new Date();

    const reservedSeatIds = this.computeReservedSeatIds(showtimeId, now);

    const rows: ShowtimeSeatAvailabilityDto[] = seats.map((seat) => ({
      seat_id: String(seat.seatId),
      row_letter: seat.rowLetter,
      seat_number: seat.seatNumber,
      is_blocked: seat.isBlocked,
      is_available: !seat.isBlocked && !reservedSeatIds.has(seat.seatId),
    }));

    // Sort by row then seat number for deterministic layout
    rows.sort((a, b) =>
      a.row_letter === b.row_letter
        ? a.seat_number - b.seat_number
        : a.row_letter.localeCompare(b.row_letter),
    );

    return rows;
  }

  // =======================
  // Helpers
  // =======================

  /** Build rectangular layouts per studio with a few blocked seats to simulate real-world quirks. */
  private buildSeatLayouts(): Seat[] {
    let id = 1;
    const out: Seat[] = [];

    const makeRows = (count: number) =>
      Array.from({ length: count }, (_, i) =>
        String.fromCharCode('A'.charCodeAt(0) + i),
      );

    const addLayout = (
      studio: Studio,
      rows: number,
      cols: number,
      blocked: Array<{ r: string; c: number }>,
    ) => {
      const letters = makeRows(rows);
      for (const r of letters) {
        for (let c = 1; c <= cols; c++) {
          const isBlocked = blocked.some((b) => b.r === r && b.c === c);
          out.push({
            seatId: id++,
            studioId: studio.studioId,
            rowLetter: r,
            seatNumber: c,
            isBlocked,
          });
        }
      }
    };

    for (const s of this.studios) {
      if (s.studioType === 'Regular') {
        addLayout(s, 10, 15, [
          { r: 'E', c: 8 },
          { r: 'F', c: 8 },
        ]);
      } else if (s.studioType === 'IMAX') {
        addLayout(s, 12, 20, [
          { r: 'G', c: 10 },
          { r: 'H', c: 10 },
        ]);
      } else {
        // Premier
        addLayout(s, 6, 12, [
          { r: 'C', c: 6 },
          { r: 'C', c: 7 },
        ]);
      }
    }
    return out;
  }

  /** Convenience: find a specific seat id by (studioId,row,number) in the generated layout. */
  private findSeatId(studioId: number, row: string, num: number): number {
    // This is safe here because buildSeatLayouts runs before this is called in dummy data init order.
    const seat = this.seats?.find(
      (s) =>
        s.studioId === studioId && s.rowLetter === row && s.seatNumber === num,
    );
    if (!seat)
      throw new Error(
        `Dummy seat not found for studio=${studioId} ${row}${num}`,
      );
    return seat.seatId;
  }

  /** Compute seats occupied for this showtime at "now". */
  private computeReservedSeatIds(showtimeId: number, now: Date): Set<number> {
    const relevantBookings = this.bookings.filter(
      (b) => b.showtimeId === showtimeId,
    );
    const byId = new Map(relevantBookings.map((b) => [b.id, b]));

    const seatsForShowtime = this.bookingSeats.filter(
      (bs) => bs.showtimeId === showtimeId,
    );
    const taken = new Set<number>();

    for (const bs of seatsForShowtime) {
      const booking = byId.get(bs.bookingId);
      if (!booking) continue;

      const status = booking.bookingStatus;
      const occupies =
        status === 'Confirmed' ||
        status === 'Claimed' ||
        (status === 'Pending' &&
          booking.holdExpiresAt &&
          booking.holdExpiresAt > now);

      if (occupies) taken.add(bs.seatId);
    }
    return taken;
  }
}
