// src/movies/dto/req/movie-showtime-dates-query.dto.ts
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MovieShowtimeDatesQueryDto {
  @IsOptional()
  @IsDateString()
  start?: string; // YYYY-MM-DD

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number = 28;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  theaterId?: string;
}
