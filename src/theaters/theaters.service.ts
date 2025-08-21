import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StudioType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TheatersListQueryDto } from './dto/req/theaters-list-query.dto';
import { TheaterListItemDto } from './dto/res/theater-list-item.dto';
import { TheaterDetailDto } from './dto/res/theater-detail.dto';
import { StudioDetailDto } from './dto/res/studio-detail.dto';
import { SeatLayoutItemDto } from './dto/res/seat-layout-item.dto';
import {
  CreateTheaterDto,
  UpdateTheaterDto,
} from './dto/req/create-theater.dto';
import { CreateStudioDto, UpdateStudioDto } from './dto/req/create-studio.dto';
import { BlockSeatsDto } from './dto/req/block-seats.dto';

const CI = Prisma.QueryMode.insensitive;

@Injectable()
export class TheatersService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------------- Public READ endpoints -------------------------- */

  /**
   * GET /theaters
   */
  async listTheaters(
    query: TheatersListQueryDto,
  ): Promise<TheaterListItemDto[]> {
    const where: Prisma.TheaterWhereInput = {
      ...(query.city ? { city: { equals: query.city, mode: CI } } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: CI } },
              { address: { contains: query.q, mode: CI } },
            ],
          }
        : {}),
    };

    const theaters = await this.prisma.theater.findMany({
      where,
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
      select: {
        theater_id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
      },
    });

    return theaters.map((t) => ({
      theater_id: t.theater_id,
      name: t.name,
      address: t.address,
      city: t.city,
      phone: t.phone,
    }));
  }

  /**
   * GET /theaters/:theaterId
   */
  async getTheaterById(theaterId: number): Promise<TheaterDetailDto> {
    const theater = await this.prisma.theater.findUnique({
      where: { theater_id: theaterId },
      include: {
        studios: { select: { studio_id: true }, orderBy: { studio_id: 'asc' } },
      },
    });
    if (!theater) throw new NotFoundException('Theater not found');

    return {
      theater_id: theater.theater_id,
      name: theater.name,
      address: theater.address,
      city: theater.city,
      phone: theater.phone,
      studio_ids: theater.studios.map((s) => s.studio_id),
    };
  }

  /**
   * GET /studios/:studioId
   */
  async getStudioById(studioId: number): Promise<StudioDetailDto> {
    const studio = await this.prisma.studio.findUnique({
      where: { studio_id: studioId },
      select: {
        studio_id: true,
        theater_id: true,
        studio_name: true,
        total_seats: true,
        studio_type: true,
      },
    });
    if (!studio) throw new NotFoundException('Studio not found');

    return {
      studio_id: studio.studio_id,
      theater_id: studio.theater_id,
      studio_name: studio.studio_name,
      total_seats: studio.total_seats,
      studio_type:
        studio.studio_type as unknown as StudioDetailDto['studio_type'],
    };
  }

  /**
   * GET /studios/:studioId/seats
   * Static seat layout (no availability), ordered by row then number.
   */
  async getStudioSeatLayout(studioId: number): Promise<SeatLayoutItemDto[]> {
    // Ensure studio exists (clear 404 instead of empty list)
    const exists = await this.prisma.studio.findUnique({
      where: { studio_id: studioId },
      select: { studio_id: true },
    });
    if (!exists) throw new NotFoundException('Studio not found');

    const seats = await this.prisma.seat.findMany({
      where: { studio_id: studioId },
      orderBy: [{ row_letter: 'asc' }, { seat_number: 'asc' }],
      select: {
        seat_id: true,
        row_letter: true,
        seat_number: true,
        is_blocked: true,
      },
    });

    return seats.map((s) => ({
      seat_id: s.seat_id,
      row_letter: s.row_letter,
      seat_number: s.seat_number,
      is_blocked: s.is_blocked,
    }));
  }

  /* --------------------------- Admin: Theaters CRUD -------------------------- */

  /**
   * POST /theaters
   */
  async createTheater(body: CreateTheaterDto): Promise<TheaterDetailDto> {
    const created = await this.prisma.theater.create({
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        phone: body.phone,
      },
      include: { studios: { select: { studio_id: true } } },
    });

    return {
      theater_id: created.theater_id,
      name: created.name,
      address: created.address,
      city: created.city,
      phone: created.phone,
      studio_ids: created.studios.map((s) => s.studio_id),
    };
  }

  /**
   * PATCH /theaters/:theaterId
   */
  async updateTheater(
    theaterId: number,
    body: UpdateTheaterDto,
  ): Promise<TheaterDetailDto> {
    // Ensure exists
    const existing = await this.prisma.theater.findUnique({
      where: { theater_id: theaterId },
      select: { theater_id: true },
    });
    if (!existing) throw new NotFoundException('Theater not found');

    const updated = await this.prisma.theater.update({
      where: { theater_id: theaterId },
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        phone: body.phone,
      },
      include: { studios: { select: { studio_id: true } } },
    });

    return {
      theater_id: updated.theater_id,
      name: updated.name,
      address: updated.address,
      city: updated.city,
      phone: updated.phone,
      studio_ids: updated.studios.map((s) => s.studio_id),
    };
  }

  /**
   * DELETE /theaters/:theaterId
   * Safety: refuse delete if theater has studios.
   */
  async deleteTheater(theaterId: number): Promise<{ deleted: boolean }> {
    const countStudios = await this.prisma.studio.count({
      where: { theater_id: theaterId },
    });
    if (countStudios > 0) {
      throw new BadRequestException('THEATER_HAS_STUDIOS');
    }

    try {
      await this.prisma.theater.delete({ where: { theater_id: theaterId } });
      return { deleted: true };
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException('Theater not found');
      throw e;
    }
  }

  /* ---------------------- Admin: Studios CRUD & blocking --------------------- */

  /**
   * POST /theaters/:theaterId/studios
   */
  async createStudio(
    theaterId: number,
    body: CreateStudioDto,
  ): Promise<StudioDetailDto> {
    // Ensure theater exists
    const theater = await this.prisma.theater.findUnique({
      where: { theater_id: theaterId },
      select: { theater_id: true },
    });
    if (!theater) throw new NotFoundException('Theater not found');

    const created = await this.prisma.studio.create({
      data: {
        theater_id: theaterId,
        studio_name: body.studio_name,
        total_seats: body.total_seats,
        studio_type: body.studio_type as StudioType,
      },
      select: {
        studio_id: true,
        theater_id: true,
        studio_name: true,
        total_seats: true,
        studio_type: true,
      },
    });

    return {
      studio_id: created.studio_id,
      theater_id: created.theater_id,
      studio_name: created.studio_name,
      total_seats: created.total_seats,
      studio_type:
        created.studio_type as unknown as StudioDetailDto['studio_type'],
    };
  }

  /**
   * PATCH /studios/:studioId
   */
  async updateStudio(
    studioId: number,
    body: UpdateStudioDto,
  ): Promise<StudioDetailDto> {
    const exists = await this.prisma.studio.findUnique({
      where: { studio_id: studioId },
      select: { studio_id: true },
    });
    if (!exists) throw new NotFoundException('Studio not found');

    const updated = await this.prisma.studio.update({
      where: { studio_id: studioId },
      data: {
        studio_name: body.studio_name,
        total_seats: body.total_seats,
        studio_type: body.studio_type as StudioType,
      },
      select: {
        studio_id: true,
        theater_id: true,
        studio_name: true,
        total_seats: true,
        studio_type: true,
      },
    });

    return {
      studio_id: updated.studio_id,
      theater_id: updated.theater_id,
      studio_name: updated.studio_name,
      total_seats: updated.total_seats,
      studio_type:
        updated.studio_type as unknown as StudioDetailDto['studio_type'],
    };
  }

  /**
   * DELETE /studios/:studioId
   * Safety:
   *  - refuse delete if studio has showtimes
   *  - if safe, remove seats then the studio in one transaction
   */
  async deleteStudio(studioId: number): Promise<{ deleted: boolean }> {
    const showtimeCount = await this.prisma.showtime.count({
      where: { studio_id: studioId },
    });
    if (showtimeCount > 0) {
      throw new BadRequestException('STUDIO_HAS_SHOWTIMES');
    }

    const exists = await this.prisma.studio.findUnique({
      where: { studio_id: studioId },
      select: { studio_id: true },
    });
    if (!exists) throw new NotFoundException('Studio not found');

    await this.prisma.$transaction([
      this.prisma.seat.deleteMany({ where: { studio_id: studioId } }),
      this.prisma.studio.delete({ where: { studio_id: studioId } }),
    ]);

    return { deleted: true };
  }

  /**
   * POST /studios/:studioId/seats/block
   * Bulk block/unblock by row + numbers.
   */
  async blockSeats(
    studioId: number,
    body: BlockSeatsDto,
  ): Promise<{ updated: number }> {
    // Normalize rows to uppercase and dedupe targets
    const targets = new Map<string, true>();
    for (const b of body.blocks) {
      const row = (b.row || '').toUpperCase().trim();
      if (!row) continue;
      for (const n of b.numbers) {
        if (Number.isFinite(n) && n > 0) {
          targets.set(`${row}:${n}`, true);
        }
      }
    }
    if (targets.size === 0) return { updated: 0 };

    // Ensure studio exists
    const studio = await this.prisma.studio.findUnique({
      where: { studio_id: studioId },
      select: { studio_id: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');

    // Build OR filter for existing seats
    const orClauses: Prisma.SeatWhereInput[] = Array.from(targets.keys()).map(
      (key) => {
        const [row, num] = key.split(':');
        return {
          studio_id: studioId,
          row_letter: row,
          seat_number: Number(num),
        };
      },
    );

    const { count } = await this.prisma.seat.updateMany({
      where: { OR: orClauses },
      data: { is_blocked: body.isBlocked },
    });

    return { updated: count };
  }
}
