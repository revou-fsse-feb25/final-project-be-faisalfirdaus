// src/movies/dto/req/movies-list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
export enum MovieStatusDto {
  COMING_SOON = 'COMING_SOON',
  NOW_SHOWING = 'NOW_SHOWING',
  ARCHIVED = 'ARCHIVED',
}

export class MoviesListQueryDto {
  @ApiPropertyOptional({ enum: MovieStatusDto })
  @IsOptional()
  @IsEnum(MovieStatusDto)
  status?: MovieStatusDto;

  @ApiPropertyOptional() @IsOptional() @IsBooleanString() isActive?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  genreId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}
