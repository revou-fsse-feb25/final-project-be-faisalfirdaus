// src/theaters/theaters.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { TheatersListQueryDto } from './dto/req/theaters-list-query.dto';
import { TheaterListItemDto } from './dto/res/theater-list-item.dto';
import {
  TheaterDetailDto,
  TheaterDetailStudioDto,
} from './dto/res/theater-detail.dto';
import { StudioDetailDto } from './dto/res/studio-detail.dto';
import { SeatLayoutItemDto } from './dto/res/seat-layout-item.dto';

type Theater = {
  theaterId: number;
  name: string;
  address: string;
  city: string;
  phone: string;
};

type StudioType = 'Regular' | 'IMAX' | 'Premier';

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
  isBlocked: boolean; // static layout block (pillar/broken seat/etc.)
};

@Injectable()
export class TheatersService {
  // ===== Dummy Data =====
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
    {
      theaterId: 300,
      name: 'Surabaya Grand Screen',
      address: 'Jl. Pemuda 88',
      city: 'Surabaya',
      phone: '031-3333',
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
    {
      studioId: 3001,
      theaterId: 300,
      studioName: 'Studio A',
      totalSeats: 120,
      studioType: 'Regular',
    },
  ];

  /**
   * Static seat layouts per studio (dummy). If you prefer, you can generate
   * the grid at runtime with a helper. Here we precompute for simplicity.
   */
  private readonly seats: Seat[] = this.makeSeatLayouts();

  // ===== Public API =====

  /**
   * GET /v1/theaters?city=Jakarta
   */
  async listTheaters(
    query: TheatersListQueryDto,
  ): Promise<TheaterListItemDto[]> {
    const city = query.city?.trim().toLowerCase();

    const items = this.theaters
      .filter((t) => !city || t.city.toLowerCase() === city)
      .map<TheaterListItemDto>((t) => ({
        theaterId: String(t.theaterId),
        name: t.name,
        address: t.address,
        city: t.city,
        phone: t.phone,
      }));

    return items;
  }

  /**
   * GET /v1/theaters/:theaterId
   * Includes studio list for the theater.
   */
  async getTheaterById(theaterId: number): Promise<TheaterDetailDto> {
    const theater = this.theaters.find((t) => t.theaterId === theaterId);
    if (!theater) throw new NotFoundException('Theater not found');

    const studios = this.studios
      .filter((s) => s.theaterId === theater.theaterId)
      .map<TheaterDetailStudioDto>((s) => ({
        studioId: String(s.studioId),
        studioName: s.studioName,
        studioType: s.studioType,
        totalSeats: s.totalSeats,
      }));

    return {
      theaterId: String(theater.theaterId),
      name: theater.name,
      address: theater.address,
      city: theater.city,
      phone: theater.phone,
      studios,
    };
  }

  /**
   * GET /v1/studios/:studioId
   */
  async getStudioById(studioId: number): Promise<StudioDetailDto> {
    const studio = this.studios.find((s) => s.studioId === studioId);
    if (!studio) throw new NotFoundException('Studio not found');

    const theater = this.theaters.find(
      (t) => t.theaterId === studio.theaterId,
    )!;

    return {
      studioId: String(studio.studioId),
      theaterId: String(theater.theaterId),
      theaterName: theater.name,
      city: theater.city,
      studioName: studio.studioName,
      studioType: studio.studioType,
      totalSeats: studio.totalSeats,
    };
  }

  /**
   * GET /v1/studios/:studioId/seats
   * Static seat map (layout only). Cacheable on client.
   */
  async getStudioSeatLayout(studioId: number): Promise<SeatLayoutItemDto[]> {
    const studio = this.studios.find((s) => s.studioId === studioId);
    if (!studio) throw new NotFoundException('Studio not found');

    const rows = this.seats
      .filter((seat) => seat.studioId === studioId)
      .map<SeatLayoutItemDto>((seat) => ({
        seat_id: String(seat.seatId),
        row_letter: seat.rowLetter,
        seat_number: seat.seatNumber,
        is_blocked: seat.isBlocked,
      }));

    // Optional: sort by row then seat number for a consistent layout
    rows.sort((a, b) =>
      a.row_letter === b.row_letter
        ? a.seat_number - b.seat_number
        : a.row_letter.localeCompare(b.row_letter),
    );

    return rows;
  }

  // ===== Helpers =====

  /**
   * Build simple rectangular seat layouts with some blocked seats to simulate pillars etc.
   * - Regular: 10 rows x 15 seats
   * - IMAX:    12 rows x 20 seats
   * - Premier:  6 rows x 12 seats
   */
  private makeSeatLayouts(): Seat[] {
    let idCounter = 1;
    const all: Seat[] = [];

    const rowLetters = (count: number) =>
      Array.from({ length: count }, (_, i) =>
        String.fromCharCode('A'.charCodeAt(0) + i),
      );

    const addLayout = (
      studio: Studio,
      rows: number,
      cols: number,
      blocked: Array<{ r: string; c: number }>,
    ) => {
      const letters = rowLetters(rows);
      for (const r of letters) {
        for (let c = 1; c <= cols; c++) {
          const isBlocked = blocked.some((b) => b.r === r && b.c === c);
          all.push({
            seatId: idCounter++,
            studioId: studio.studioId,
            rowLetter: r,
            seatNumber: c,
            isBlocked,
          });
        }
      }
    };

    // Create per-studio layouts
    for (const s of this.studios) {
      if (s.studioType === 'Regular') {
        addLayout(s, 10, 15, [
          { r: 'E', c: 8 }, // example blocked seats
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

    return all;
  }
}
