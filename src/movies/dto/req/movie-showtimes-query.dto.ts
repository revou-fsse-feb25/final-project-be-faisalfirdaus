// src/movies/dto/req/movie-showtimes-query.dto.ts
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MovieShowtimesQueryDto {
  @IsDateString()
  date!: string; // required, format YYYY-MM-DD

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  theaterId?: string;
}
