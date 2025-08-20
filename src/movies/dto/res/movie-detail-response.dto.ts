// src/movies/dto/res/movie-detail-response.dto.ts
import { MovieStatus } from '../req/movies-list-query.dto';

export class MovieDetailResponseDto {
  id: string;
  title: string;
  synopsis: string;
  posterUrl: string;
  runtimeMinutes: number;
  status: MovieStatus;
  genres: string[];
}
