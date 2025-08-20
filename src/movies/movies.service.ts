// src/movies/movies.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';

import {
  MoviesListQueryDto,
  MovieStatus,
} from './dto/req/movies-list-query.dto';
import { MovieShowtimeDatesQueryDto } from './dto/req/movie-showtime-dates-query.dto';
import { MovieShowtimesQueryDto } from './dto/req/movie-showtimes-query.dto';
import {
  MovieListItemDto,
  MoviesListResponseDto,
} from './dto/res/movies-list-response.dto';
import { MovieDetailResponseDto } from './dto/res/movie-detail-response.dto';
import { MovieShowtimeDatesResponseDto } from './dto/res/movie-showtime-dates-response.dto';
import {
  MovieShowtimeEntryDto,
  MovieShowtimesResponseDto,
} from './dto/res/movie-showtimes-response.dto';

type Role = 'USER' | 'ADMIN';
type StudioType = 'Regular' | 'IMAX' | 'Premier';

type Movie = {
  movieId: number;
  title: string;
  description?: string | null;
  durationMinutes: number;
  posterUrl?: string | null;
  status: MovieStatus;
  isActive: boolean;
};

type Genre = { genreId: number; name: string };

type MovieGenre = { movieId: number; genreId: number };

type Theater = {
  theaterId: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  // NOTE: schema has no timezone; add here if you want per-theater TZ later
};

type Studio = {
  studioId: number;
  theaterId: number;
  studioName: string;
  totalSeats: number;
  studioType: StudioType;
};

type Showtime = {
  showtimeId: number;
  movieId: number;
  studioId: number;
  showDatetime: Date; // stored as UTC Date
  price: number; // integer
  isActive: boolean;
};

@Injectable()
export class MoviesService {
  // ===== Dummy data =====
  // tweak/add freely
  private readonly movies: Movie[] = [
    {
      movieId: 1,
      title: 'The Electric Odyssey',
      description: 'A sci-fi road trip across a near-future archipelago.',
      durationMinutes: 128,
      posterUrl: 'https://example.com/posters/odyssey.jpg',
      status: MovieStatus.NOW_SHOWING,
      isActive: true,
    },
    {
      movieId: 2,
      title: 'Garden of Echoes',
      description: 'A quiet drama about memory and time.',
      durationMinutes: 102,
      posterUrl: 'https://example.com/posters/echoes.jpg',
      status: MovieStatus.COMING_SOON,
      isActive: true,
    },
    {
      movieId: 3,
      title: 'Retired Title',
      description: 'Old archive.',
      durationMinutes: 90,
      posterUrl: null,
      status: MovieStatus.ARCHIVED,
      isActive: false,
    },
  ];

  private readonly genres: Genre[] = [
    { genreId: 10, name: 'Sci-Fi' },
    { genreId: 20, name: 'Drama' },
  ];

  private readonly movieGenres: MovieGenre[] = [
    { movieId: 1, genreId: 10 },
    { movieId: 2, genreId: 20 },
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

  private readonly showtimes: Showtime[] = [
    // Jakarta
    {
      showtimeId: 50001,
      movieId: 1,
      studioId: 1001,
      showDatetime: this.utc('2025-08-19T10:00:00Z'),
      price: 50000,
      isActive: true,
    },
    {
      showtimeId: 50002,
      movieId: 1,
      studioId: 1002,
      showDatetime: this.utc('2025-08-19T13:30:00Z'),
      price: 80000,
      isActive: true,
    },
    {
      showtimeId: 50003,
      movieId: 1,
      studioId: 1001,
      showDatetime: this.utc('2025-08-20T03:00:00Z'),
      price: 50000,
      isActive: true,
    },
    // Bandung
    {
      showtimeId: 60001,
      movieId: 1,
      studioId: 2001,
      showDatetime: this.utc('2025-08-19T12:15:00Z'),
      price: 70000,
      isActive: true,
    },
    // Coming soon (still can have future showtimes)
    {
      showtimeId: 70001,
      movieId: 2,
      studioId: 1001,
      showDatetime: this.utc('2025-09-10T12:00:00Z'),
      price: 60000,
      isActive: true,
    },
  ];

  // ===== Config / helpers =====

  /**
   * Fallback timezone since schema doesn’t carry per-theater TZ.
   * Change to your target TZ or extend Theater with `timezone: string`.
   */
  private readonly DEFAULT_TZ = 'Asia/Jakarta';

  private utc(iso: string): Date {
    return DateTime.fromISO(iso, { zone: 'utc' }).toJSDate();
  }

  private getGenresForMovie(movieId: number): string[] {
    const ids = new Set(
      this.movieGenres
        .filter((mg) => mg.movieId === movieId)
        .map((mg) => mg.genreId),
    );
    return this.genres.filter((g) => ids.has(g.genreId)).map((g) => g.name);
  }

  private theatersById = new Map<number, Theater>(
    this.theaters.map((t) => [t.theaterId, t]),
  );
  private studiosById = new Map<number, Studio>(
    this.studios.map((s) => [s.studioId, s]),
  );

  // ============================
  // GET /v1/movies
  // ============================
  async listMovies(query: MoviesListQueryDto): Promise<MoviesListResponseDto> {
    const limit = Math.min(query.limit ?? 25, 100);

    // Base filter: only active movies
    let filtered = this.movies.filter((m) => m.isActive);

    if (query.status) {
      filtered = filtered.filter((m) => m.status === query.status);
    }
    if (query.q?.trim()) {
      const q = query.q.trim().toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description ?? '').toLowerCase().includes(q),
      );
    }
    if (query.genreId) {
      const movieIdsWithGenre = new Set(
        this.movieGenres
          .filter((mg) => mg.genreId === query.genreId)
          .map((mg) => mg.movieId),
      );
      filtered = filtered.filter((m) => movieIdsWithGenre.has(m.movieId));
    }
    if (query.city?.trim()) {
      const city = query.city.trim().toLowerCase();
      const theaterIdsInCity = new Set(
        this.theaters
          .filter((t) => t.city.toLowerCase() === city)
          .map((t) => t.theaterId),
      );
      const studioIdsInCity = new Set(
        this.studios
          .filter((s) => theaterIdsInCity.has(s.theaterId))
          .map((s) => s.studioId),
      );
      const movieIdsWithShowtimeInCity = new Set(
        this.showtimes
          .filter((st) => st.isActive && studioIdsInCity.has(st.studioId))
          .map((st) => st.movieId),
      );
      filtered = filtered.filter((m) =>
        movieIdsWithShowtimeInCity.has(m.movieId),
      );
    }

    // Sort ascending by movieId for cursor pagination
    filtered.sort((a, b) => a.movieId - b.movieId);

    // Cursor handling (movieId > cursor)
    if (query.cursor) {
      const cur = Number(query.cursor);
      filtered = filtered.filter((m) => m.movieId > cur);
    }

    const page = filtered.slice(0, limit + 1);
    const hasNext = page.length > limit;
    const finalPage = hasNext ? page.slice(0, -1) : page;

    const items: MovieListItemDto[] = finalPage.map((m) => ({
      id: String(m.movieId),
      title: m.title,
      posterUrl: m.posterUrl ?? '',
      runtimeMinutes: m.durationMinutes,
      status: m.status,
    }));

    return {
      items,
      nextCursor: hasNext
        ? String(finalPage[finalPage.length - 1].movieId)
        : undefined,
    };
  }

  // ============================
  // GET /v1/movies/:movieId
  // ============================
  async getMovieDetail(movieId: string): Promise<MovieDetailResponseDto> {
    const id = Number(movieId);
    const movie = this.movies.find((m) => m.movieId === id && m.isActive);
    if (!movie) throw new NotFoundException('Movie not found');

    return {
      id: String(movie.movieId),
      title: movie.title,
      synopsis: movie.description ?? '',
      posterUrl: movie.posterUrl ?? '',
      runtimeMinutes: movie.durationMinutes,
      status: movie.status,
      genres: this.getGenresForMovie(movie.movieId),
    };
  }

  // ============================================
  // GET /v1/movies/:movieId/showtimes/dates
  // ============================================
  async getShowtimeDates(
    movieId: string,
    query: MovieShowtimeDatesQueryDto,
  ): Promise<MovieShowtimeDatesResponseDto[]> {
    const days = query.days ?? 28;
    if (days <= 0 || days > 62) {
      throw new BadRequestException('days must be between 1 and 62');
    }

    const startLocal = query.start
      ? DateTime.fromISO(query.start, { zone: this.DEFAULT_TZ }).startOf('day')
      : DateTime.now().setZone(this.DEFAULT_TZ).startOf('day');
    if (!startLocal.isValid) {
      throw new BadRequestException('start must be YYYY-MM-DD');
    }
    const endLocal = startLocal.plus({ days }).endOf('day');

    const id = Number(movieId);
    let rows = this.showtimes.filter((st) => st.isActive && st.movieId === id);

    // Filter by city / theaterId if provided
    if (query.city?.trim() || query.theaterId) {
      const city = query.city?.trim().toLowerCase();
      rows = rows.filter((st) => {
        const studio = this.studiosById.get(st.studioId)!;
        const theater = this.theatersById.get(studio.theaterId)!;
        if (query.theaterId && theater.theaterId !== Number(query.theaterId)) {
          return false;
        }
        if (city && theater.city.toLowerCase() !== city) {
          return false;
        }
        return true;
      });
    }

    // Count per local day in DEFAULT_TZ within [start,end]
    const counts = new Map<string, number>();
    for (const st of rows) {
      const local = DateTime.fromJSDate(st.showDatetime, {
        zone: 'utc',
      }).setZone(this.DEFAULT_TZ);
      if (local < startLocal || local > endLocal) continue;
      const d = local.toISODate();
      counts.set(d!, (counts.get(d!) ?? 0) + 1);
    }

    const out: MovieShowtimeDatesResponseDto[] = [];
    for (let i = 0; i < days; i++) {
      const d = startLocal.plus({ days: i }).toISODate();
      out.push({ date: d, count: counts.get(d) ?? 0 });
    }
    return out;
  }

  // ============================================
  // GET /v1/movies/:movieId/showtimes
  // ============================================
  async getShowtimesForDate(
    movieId: string,
    query: MovieShowtimesQueryDto,
  ): Promise<MovieShowtimesResponseDto[]> {
    if (!query.date) throw new BadRequestException('date is required');

    const dayLocal = DateTime.fromISO(query.date, { zone: this.DEFAULT_TZ });
    if (!dayLocal.isValid) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }

    const startLocal = dayLocal.startOf('day');
    const endLocal = dayLocal.endOf('day');

    const id = Number(movieId);
    let rows = this.showtimes.filter((st) => st.isActive && st.movieId === id);

    // Filter by city/theater
    if (query.city?.trim() || query.theaterId) {
      const city = query.city?.trim().toLowerCase();
      rows = rows.filter((st) => {
        const studio = this.studiosById.get(st.studioId)!;
        const theater = this.theatersById.get(studio.theaterId)!;
        if (query.theaterId && theater.theaterId !== Number(query.theaterId)) {
          return false;
        }
        if (city && theater.city.toLowerCase() !== city) {
          return false;
        }
        return true;
      });
    }

    // Keep only those whose local (DEFAULT_TZ) date equals query.date
    rows = rows.filter((st) => {
      const local = DateTime.fromJSDate(st.showDatetime, {
        zone: 'utc',
      }).setZone(this.DEFAULT_TZ);
      return local >= startLocal && local <= endLocal;
    });

    // Group by theater → { theaterId, theaterName, entries[] }
    const byTheater = new Map<
      number,
      {
        theaterId: string;
        theaterName: string;
        entries: MovieShowtimeEntryDto[];
      }
    >();

    for (const st of rows) {
      const studio = this.studiosById.get(st.studioId)!;
      const theater = this.theatersById.get(studio.theaterId)!;

      const local = DateTime.fromJSDate(st.showDatetime, {
        zone: 'utc',
      }).setZone(this.DEFAULT_TZ);
      const entry: MovieShowtimeEntryDto = {
        showtimeId: String(st.showtimeId),
        timeHHmm: local.toFormat('HH:mm'),
        studioName: studio.studioName,
        studioType: studio.studioType,
        price: st.price,
      };

      if (!byTheater.has(theater.theaterId)) {
        byTheater.set(theater.theaterId, {
          theaterId: String(theater.theaterId),
          theaterName: theater.name,
          entries: [entry],
        });
      } else {
        byTheater.get(theater.theaterId)!.entries.push(entry);
      }
    }

    // Sort entries per theater by time, and theaters by name
    const result: MovieShowtimesResponseDto[] = [];
    for (const group of byTheater.values()) {
      group.entries.sort((a, b) => (a.timeHHmm < b.timeHHmm ? -1 : 1));
      result.push(group);
    }
    result.sort((a, b) => a.theaterName.localeCompare(b.theaterName));

    return result;
  }
}
