// src/showtimes/dto/res/showtime-detail.dto.ts
// import { ApiProperty } from '@nestjs/swagger';

export class ShowtimeDetailDto {
  showtimeId!: string;

  movieId!: string;
  movieTitle!: string;

  theaterId!: string;
  theaterName!: string;
  city!: string;

  studioId!: string;
  studioName!: string;
  studioType!: 'Regular' | 'IMAX' | 'Premier';

  showDatetimeISO!: string; // UTC ISO string (or your preferred TZ)
  price!: number; // from showtimes.price
  is_active!: boolean; // from showtimes.is_active
}
