// src/movies/dto/res/movies-list-response.dto.ts
// import { ApiProperty } from '@nestjs/swagger';
import { MovieStatus } from '../req/movies-list-query.dto';

export class MovieListItemDto {
  // @ApiProperty() id: string;
  // @ApiProperty() title: string;
  // @ApiProperty() posterUrl: string;
  // @ApiProperty() runtimeMinutes: number;
  // @ApiProperty({ enum: MovieStatus }) status: MovieStatus;
  id: string;
  title: string;
  posterUrl: string;
  runtimeMinutes: number;
  status: MovieStatus;
}

export class MoviesListResponseDto {
  //   @ApiProperty({ type: [MovieListItemDto] })
  items!: MovieListItemDto[];

  //   @ApiProperty({ required: false })
  nextCursor?: string;
}
