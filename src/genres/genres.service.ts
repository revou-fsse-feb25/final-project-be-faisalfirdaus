import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateGenreDto,
  GenreResponseDto,
  UpdateGenreDto,
} from './dto/genre.dto';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  /* --------------------------------- READ ---------------------------------- */

  async listGenres(): Promise<GenreResponseDto[]> {
    const rows = await this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      select: { genre_id: true, name: true },
    });

    return rows.map((g) => ({
      genre_id: g.genre_id,
      name: g.name,
    }));
  }

  /* -------------------------------- CREATE --------------------------------- */

  async createGenre(body: CreateGenreDto): Promise<GenreResponseDto> {
    const name = body.name.trim();
    if (!name) throw new BadRequestException('NAME_REQUIRED');

    // Prevent case-insensitive duplicates
    const exists = await this.prisma.genre.findFirst({
      where: { name: { equals: name, mode: Prisma.QueryMode.insensitive } },
      select: { genre_id: true },
    });
    if (exists) throw new BadRequestException('GENRE_ALREADY_EXISTS');

    const created = await this.prisma.genre.create({
      data: { name },
      select: { genre_id: true, name: true },
    });

    return { genre_id: created.genre_id, name: created.name };
  }

  /* -------------------------------- UPDATE --------------------------------- */

  async updateGenre(
    genreId: number,
    body: UpdateGenreDto,
  ): Promise<GenreResponseDto> {
    const existing = await this.prisma.genre.findUnique({
      where: { genre_id: genreId },
      select: { genre_id: true },
    });
    if (!existing) throw new NotFoundException('GENRE_NOT_FOUND');

    const nextName = body.name?.trim();
    if (nextName) {
      const dup = await this.prisma.genre.findFirst({
        where: {
          name: { equals: nextName, mode: Prisma.QueryMode.insensitive },
          NOT: { genre_id: genreId },
        },
        select: { genre_id: true },
      });
      if (dup) throw new BadRequestException('GENRE_ALREADY_EXISTS');
    }

    const updated = await this.prisma.genre.update({
      where: { genre_id: genreId },
      data: { name: nextName ?? undefined },
      select: { genre_id: true, name: true },
    });

    return { genre_id: updated.genre_id, name: updated.name };
  }

  /* -------------------------------- DELETE --------------------------------- */

  async deleteGenre(genreId: number): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.genre.findUnique({
      where: { genre_id: genreId },
      select: { genre_id: true },
    });
    if (!existing) throw new NotFoundException('GENRE_NOT_FOUND');

    // Block delete if genre is linked to any movie
    const inUse = await this.prisma.movieGenre.count({
      where: { genre_id: genreId },
    });
    if (inUse > 0) {
      throw new BadRequestException('GENRE_IN_USE');
    }

    await this.prisma.genre.delete({ where: { genre_id: genreId } });
    return { deleted: true };
  }
}
