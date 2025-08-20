// src/movies/movies.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesListQueryDto } from './dto/req/movies-list-query.dto';
import { MovieShowtimeDatesQueryDto } from './dto/req/movie-showtime-dates-query.dto';
import { MovieShowtimesQueryDto } from './dto/req/movie-showtimes-query.dto';
import { MoviesListResponseDto } from './dto/res/movies-list-response.dto';
import { MovieDetailResponseDto } from './dto/res/movie-detail-response.dto';
import { MovieShowtimeDatesResponseDto } from './dto/res/movie-showtime-dates-response.dto';
import { MovieShowtimesResponseDto } from './dto/res/movie-showtimes-response.dto';

@Controller('movies')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  // Return List movies with poster, runtime, status.
  @Get()
  async listMovies(
    @Query() query: MoviesListQueryDto,
  ): Promise<MoviesListResponseDto> {
    // Service returns { items, nextCursor } with poster, runtime, status included
    return this.moviesService.listMovies(query);
  }

  // Return Movie detail (genres included).
  @Get(':movieId')
  async getMovieDetail(
    @Param('movieId') movieId: string,
  ): Promise<MovieDetailResponseDto> {
    return this.moviesService.getMovieDetail(movieId);
  }

  // Return showtime dates for a movie.
  @Get(':movieId/showtimes/dates')
  async getShowtimeDates(
    @Param('movieId') movieId: string,
    @Query() query: MovieShowtimeDatesQueryDto,
  ): Promise<MovieShowtimeDatesResponseDto[]> {
    // Calendar availability: { date, count } per day
    return this.moviesService.getShowtimeDates(movieId, query);
  }

  // Return showtimes for a movie on a specific date.
  @Get(':movieId/showtimes')
  async getShowtimes(
    @Param('movieId') movieId: string,
    @Query() query: MovieShowtimesQueryDto,
  ): Promise<MovieShowtimesResponseDto[]> {
    /**
     * Business rule (implemented in service):
     * - Format timeHHmm from show_datetime in the theater’s timezone
     * - price comes from showtimes.price
     * - Group by theater with entries[] = { showtimeId, timeHHmm, studioName, studioType, price }
     */
    return this.moviesService.getShowtimesForDate(movieId, query);
  }
}
