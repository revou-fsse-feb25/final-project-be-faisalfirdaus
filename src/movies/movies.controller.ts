import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { MoviesListQueryDto } from './dto/req/movies-list-query.dto';
import { MovieShowtimeDatesQueryDto } from './dto/req/movie-showtime-dates-query.dto';
import { MovieShowtimesQueryDto } from './dto/req/movie-showtimes-query.dto';
import { MoviesListResponseDto } from './dto/res/movies-list-response.dto';
import { MovieDetailResponseDto } from './dto/res/movie-detail-response.dto';
import { MovieShowtimeDatesResponseDto } from './dto/res/movie-showtime-dates-response.dto';
import { MovieShowtimesResponseDto } from './dto/res/movie-showtimes-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { CreateMovieDto, UpdateMovieDto } from './dto/req/create-movie.dto';

@ApiTags('movies')
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

  @Get()
  @ApiOkResponse({ type: MoviesListResponseDto })
  listMovies(
    @Query() query: MoviesListQueryDto,
  ): Promise<MoviesListResponseDto> {
    return this.moviesService.listMovies(query);
  }

  @Get(':movieId')
  @ApiOkResponse({ type: MovieDetailResponseDto })
  getMovieDetail(
    @Param('movieId') movieId: string,
  ): Promise<MovieDetailResponseDto> {
    return this.moviesService.getMovieDetail(movieId);
  }

  @Get(':movieId/showtimes/dates')
  @ApiOkResponse({ type: MovieShowtimeDatesResponseDto, isArray: true })
  getShowtimeDates(
    @Param('movieId') movieId: string,
    @Query() query: MovieShowtimeDatesQueryDto,
  ): Promise<MovieShowtimeDatesResponseDto[]> {
    return this.moviesService.getShowtimeDates(movieId, query);
  }

  @Get(':movieId/showtimes')
  @ApiOkResponse({ type: MovieShowtimesResponseDto, isArray: true })
  getShowtimes(
    @Param('movieId') movieId: string,
    @Query() query: MovieShowtimesQueryDto,
  ): Promise<MovieShowtimesResponseDto[]> {
    return this.moviesService.getShowtimesForDate(movieId, query);
  }

  // Admin Required Routes
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiOkResponse({ type: MovieDetailResponseDto })
  createMovie(@Body() body: CreateMovieDto): Promise<MovieDetailResponseDto> {
    return this.moviesService.createMovie(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':movieId')
  @ApiOkResponse({ type: MovieDetailResponseDto })
  updateMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Body() body: UpdateMovieDto,
  ): Promise<MovieDetailResponseDto> {
    return this.moviesService.updateMovie(movieId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':movieId')
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  deleteMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
  ): Promise<{ deleted: boolean }> {
    return this.moviesService.deleteMovie(movieId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':movieId/genres/:genreId')
  @ApiOkResponse({ schema: { example: { added: true } } })
  addGenreToMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Param('genreId', ParseIntPipe) genreId: number,
  ): Promise<{ added: boolean }> {
    return this.moviesService.addGenre(movieId, genreId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':movieId/genres/:genreId')
  @ApiOkResponse({ schema: { example: { removed: true } } })
  removeGenreFromMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Param('genreId', ParseIntPipe) genreId: number,
  ): Promise<{ removed: boolean }> {
    return this.moviesService.removeGenre(movieId, genreId);
  }
}
