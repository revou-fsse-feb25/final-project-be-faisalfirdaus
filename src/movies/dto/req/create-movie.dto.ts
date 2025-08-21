// src/movies/dto/req/create-movie.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MovieStatusDto } from './movies-list-query.dto';

export class CreateMovieDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() @MaxLength(5000) description: string;
  @ApiProperty() @IsInt() @Min(1) duration_minutes: number;
  @ApiProperty() @IsString() poster_url: string;
  @ApiProperty({ enum: MovieStatusDto })
  @IsEnum(MovieStatusDto)
  status: MovieStatusDto;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean = true;
  @ApiPropertyOptional({ type: Number, isArray: true })
  @IsOptional()
  genreIds?: number[];
}

export class UpdateMovieDto extends CreateMovieDto {}
