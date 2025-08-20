// src/movies/dto/res/movie-showtime-dates-response.dto.ts
// import { ApiProperty } from '@nestjs/swagger';

export class MovieShowtimeDatesResponseDto {
  //   @ApiProperty({ example: '2025-08-19' })
  date!: string;

  //   @ApiProperty({ example: 12 })
  count!: number;
}
