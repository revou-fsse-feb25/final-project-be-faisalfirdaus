// src/movies/dto/res/movie-showtimes-response.dto.ts

export class MovieShowtimeEntryDto {
  showtimeId!: string;
  timeHHmm!: string;
  studioName!: string;
  studioType!: string; // 'Regular' | 'IMAX' | 'Premier'
  price!: number;
}

export class MovieShowtimesResponseDto {
  theaterId!: string;
  theaterName!: string;
  entries!: MovieShowtimeEntryDto[];
}
