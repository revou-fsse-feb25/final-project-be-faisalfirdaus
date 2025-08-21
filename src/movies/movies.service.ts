import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MoviesListQueryDto } from './dto/req/movies-list-query.dto';
import { MovieShowtimeDatesQueryDto } from './dto/req/movie-showtime-dates-query.dto';
import { MovieShowtimesQueryDto } from './dto/req/movie-showtimes-query.dto';
import { MoviesListResponseDto } from './dto/res/movies-list-response.dto';
import { MovieDetailResponseDto } from './dto/res/movie-detail-response.dto';
import { MovieShowtimeDatesResponseDto } from './dto/res/movie-showtime-dates-response.dto';
import { MovieShowtimesResponseDto } from './dto/res/movie-showtimes-response.dto';
import { CreateMovieDto, UpdateMovieDto } from './dto/req/create-movie.dto';
import { PrismaService } from 'src/prisma/prisma.service';

// If you have a dedicated PrismaService that extends PrismaClient, inject that instead.
@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /movies
   * Filters: status, isActive, q (title contains), genreId
   * Pagination: cursor (movie_id), limit (default 20, max 100 via DTO)
   */
  async listMovies(query: MoviesListQueryDto): Promise<MoviesListResponseDto> {
    const take = Math.min(query.limit ?? 20, 100);
    const cursorId = query.cursor ? Number(query.cursor) : undefined;
    if (query.cursor && Number.isNaN(cursorId)) {
      throw new BadRequestException('Invalid cursor');
    }

    const where: Prisma.MovieWhereInput = {
      ...(query.status ? { status: query.status as any } : {}),
      ...(typeof query.isActive !== 'undefined'
        ? { is_active: query.isActive === 'true' }
        : {}),
      ...(query.q ? { title: { contains: query.q, mode: 'insensitive' } } : {}),
      ...(query.genreId
        ? { genres: { some: { genre_id: Number(query.genreId) } } }
        : {}),
    };

    const items = await this.prisma.movie.findMany({
      where,
      orderBy: { movie_id: 'asc' },
      ...(cursorId ? { cursor: { movie_id: cursorId }, skip: 1 } : {}),
      take: take + 1, // fetch one extra to determine nextCursor
      select: {
        movie_id: true,
        title: true,
        poster_url: true,
        duration_minutes: true,
        status: true,
        is_active: true,
      },
    });

    let nextCursor: string | undefined;
    if (items.length > take) {
      const next = items.pop()!; // remove the extra
      nextCursor = String(next.movie_id);
    }

    return {
      items: items.map((m) => ({
        movie_id: m.movie_id,
        title: m.title,
        poster_url: m.poster_url,
        duration_minutes: m.duration_minutes,
        status: m.status as any,
        is_active: m.is_active,
      })),
      nextCursor,
    };
  }

  /**
   * GET /movies/:movieId
   * Returns full movie detail + genres as string[]
   */
  async getMovieDetail(movieId: string): Promise<MovieDetailResponseDto> {
    const id = Number(movieId);
    if (Number.isNaN(id)) throw new BadRequestException('Invalid movieId');

    const movie = await this.prisma.movie.findUnique({
      where: { movie_id: id },
      include: {
        genres: {
          include: { genre: true },
          orderBy: { genre_id: 'asc' },
        },
      },
    });

    if (!movie) throw new NotFoundException('Movie not found');

    return {
      movie_id: movie.movie_id,
      title: movie.title,
      description: movie.description,
      duration_minutes: movie.duration_minutes,
      poster_url: movie.poster_url,
      status: movie.status as any,
      is_active: movie.is_active,
      genres: movie.genres.map((mg) => mg.genre.name),
    };
  }

  /**
   * GET /movies/:movieId/showtimes/dates
   * Returns array of { date: 'YYYY-MM-DD', count }
   */
  async getShowtimeDates(
    movieId: string,
    query: MovieShowtimeDatesQueryDto,
  ): Promise<MovieShowtimeDatesResponseDto[]> {
    const id = Number(movieId);
    if (Number.isNaN(id)) throw new BadRequestException('Invalid movieId');

    const start = new Date(query.startDate + 'T00:00:00.000Z');
    const end = new Date(query.endDate + 'T23:59:59.999Z');
    if (start > end)
      throw new BadRequestException('startDate must be <= endDate');

    // Pull all showtimes in range then aggregate by date (UTC day bucket)
    const showtimes = await this.prisma.showtime.findMany({
      where: {
        movie_id: id,
        is_active: true,
        show_datetime: {
          gte: start,
          lte: end,
        },
      },
      select: { showtime_id: true, show_datetime: true },
      orderBy: { show_datetime: 'asc' },
    });

    const counts = new Map<string, number>();
    for (const st of showtimes) {
      const d = toYMD(st.show_datetime);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }

    // Fill missing days with 0 if you prefer. Here we return only dates with showtimes.
    const result: MovieShowtimeDatesResponseDto[] = [];
    for (const [date, count] of counts.entries()) {
      result.push({ date, count });
    }
    // sort ascending by date
    result.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return result;
  }

  /**
   * GET /movies/:movieId/showtimes?date=YYYY-MM-DD
   * Returns list grouped by theater:
   *   { theater_id, theater_name, entries: [{ showtimeId, timeHHmm, studioName, studioType, price }] }
   */
  async getShowtimesForDate(
    movieId: string,
    query: MovieShowtimesQueryDto,
  ): Promise<MovieShowtimesResponseDto[]> {
    const id = Number(movieId);
    if (Number.isNaN(id)) throw new BadRequestException('Invalid movieId');

    const dayStart = new Date(query.date + 'T00:00:00.000Z');
    const dayEnd = new Date(query.date + 'T23:59:59.999Z');

    const showtimes = await this.prisma.showtime.findMany({
      where: {
        movie_id: id,
        is_active: true,
        show_datetime: { gte: dayStart, lte: dayEnd },
      },
      orderBy: [{ show_datetime: 'asc' }, { showtime_id: 'asc' }],
      select: {
        showtime_id: true,
        show_datetime: true,
        price: true,
        studio: {
          select: {
            studio_id: true,
            studio_name: true,
            studio_type: true,
            theater: {
              select: {
                theater_id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Group by theater
    type Group = {
      theater_id: number;
      theater_name: string;
      entries: {
        showtimeId: number;
        timeHHmm: string;
        studioName: string;
        studioType: string;
        price: number;
      }[];
    };

    const map = new Map<number, Group>();

    for (const st of showtimes) {
      const tId = st.studio.theater.theater_id;
      if (!map.has(tId)) {
        map.set(tId, {
          theater_id: tId,
          theater_name: st.studio.theater.name,
          entries: [],
        });
      }
      map.get(tId)!.entries.push({
        showtimeId: st.showtime_id,
        timeHHmm: formatHHmm(st.show_datetime),
        studioName: st.studio.studio_name,
        studioType: st.studio.studio_type as any,
        price: st.price,
      });
    }

    // Convert to array and sort by theater_name for stable output
    const result = Array.from(map.values()).sort((a, b) =>
      a.theater_name.localeCompare(b.theater_name),
    );
    return result;
  }

  /**
   * POST /movies
   * Creates movie; optionally attaches genres (by ids)
   */
  async createMovie(body: CreateMovieDto): Promise<MovieDetailResponseDto> {
    // optional genre connect
    const genreConnects =
      body.genreIds?.map((gid) => ({
        genre: { connect: { genre_id: gid } },
      })) ?? [];

    const created = await this.prisma.movie.create({
      data: {
        title: body.title,
        description: body.description,
        duration_minutes: body.duration_minutes,
        poster_url: body.poster_url,
        status: body.status as any,
        is_active: body.is_active ?? true,
        genres: { create: genreConnects },
      },
      include: { genres: { include: { genre: true } } },
    });

    return {
      movie_id: created.movie_id,
      title: created.title,
      description: created.description,
      duration_minutes: created.duration_minutes,
      poster_url: created.poster_url,
      status: created.status as any,
      is_active: created.is_active,
      genres: created.genres.map((g) => g.genre.name),
    };
  }

  /**
   * PATCH /movies/:movieId
   * Updates movie fields; if genreIds provided, replace associations atomically
   */
  async updateMovie(
    movieId: number,
    body: UpdateMovieDto,
  ): Promise<MovieDetailResponseDto> {
    // Ensure exists
    const existing = await this.prisma.movie.findUnique({
      where: { movie_id: movieId },
      select: { movie_id: true },
    });
    if (!existing) throw new NotFoundException('Movie not found');

    const result = await this.prisma.$transaction(async (tx) => {
      // update core fields
      const updated = await tx.movie.update({
        where: { movie_id: movieId },
        data: {
          title: body.title,
          description: body.description,
          duration_minutes: body.duration_minutes,
          poster_url: body.poster_url,
          status: body.status as any,
          is_active:
            typeof body.is_active === 'boolean' ? body.is_active : undefined,
        },
      });

      // replace genres if provided
      if (Array.isArray(body.genreIds)) {
        // delete current links
        await tx.movieGenre.deleteMany({ where: { movie_id: movieId } });
        // add new links
        if (body.genreIds.length) {
          await tx.movieGenre.createMany({
            data: body.genreIds.map((gid) => ({
              movie_id: movieId,
              genre_id: gid,
            })),
            skipDuplicates: true,
          });
        }
      }

      const full = await tx.movie.findUnique({
        where: { movie_id: movieId },
        include: { genres: { include: { genre: true } } },
      });

      return full!;
    });

    return {
      movie_id: result.movie_id,
      title: result.title,
      description: result.description,
      duration_minutes: result.duration_minutes,
      poster_url: result.poster_url,
      status: result.status as any,
      is_active: result.is_active,
      genres: result.genres.map((g) => g.genre.name),
    };
  }

  /**
   * DELETE /movies/:movieId
   * Soft-delete semantics to avoid FK issues: set is_active=false and status=ARCHIVED
   */
  async deleteMovie(movieId: number): Promise<{ deleted: boolean }> {
    const movie = await this.prisma.movie.findUnique({
      where: { movie_id: movieId },
    });
    if (!movie) throw new NotFoundException('Movie not found');

    await this.prisma.movie.update({
      where: { movie_id: movieId },
      data: { is_active: false, status: 'ARCHIVED' as any },
    });
    return { deleted: true };
  }

  /**
   * POST /movies/:movieId/genres/:genreId
   * Attach a genre (upsert on junction)
   */
  async addGenre(
    movieId: number,
    genreId: number,
  ): Promise<{ added: boolean }> {
    // ensure both exist
    const [movie, genre] = await Promise.all([
      this.prisma.movie.findUnique({
        where: { movie_id: movieId },
        select: { movie_id: true },
      }),
      this.prisma.genre.findUnique({
        where: { genre_id: genreId },
        select: { genre_id: true },
      }),
    ]);
    if (!movie) throw new NotFoundException('Movie not found');
    if (!genre) throw new NotFoundException('Genre not found');

    await this.prisma.movieGenre.upsert({
      where: { movie_id_genre_id: { movie_id: movieId, genre_id: genreId } },
      update: {},
      create: { movie_id: movieId, genre_id: genreId },
    });

    return { added: true };
  }

  /**
   * DELETE /movies/:movieId/genres/:genreId
   * Detach a genre
   */
  async removeGenre(
    movieId: number,
    genreId: number,
  ): Promise<{ removed: boolean }> {
    await this.prisma.movieGenre
      .delete({
        where: { movie_id_genre_id: { movie_id: movieId, genre_id: genreId } },
      })
      .catch((e) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2025'
        ) {
          // not found
          throw new NotFoundException('Relation not found');
        }
        throw e;
      });

    return { removed: true };
  }
}

/* ------------------------- helpers ------------------------- */

/** Format a Date to 'YYYY-MM-DD' in UTC */
function toYMD(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Format time to HHmm (24h) using the runtime locale; falls back to UTC */
function formatHHmm(date: Date): string {
  try {
    // Use Intl to format 24h then strip colon
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC', // adjust to your theater timezone logic if needed
    })
      .format(date)
      .replace(':', '');
    return parts;
  } catch {
    // Fallback: build from UTC components
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hh}${mm}`;
  }
}
