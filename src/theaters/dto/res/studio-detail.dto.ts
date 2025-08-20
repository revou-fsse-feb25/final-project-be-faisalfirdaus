// src/theaters/dto/res/studio-detail.dto.ts
// import { ApiProperty } from '@nestjs/swagger';

export class StudioDetailDto {
  studioId!: string;
  theaterId!: string;
  theaterName!: string;
  city!: string;
  studioName!: string;
  studioType!: 'Regular' | 'IMAX' | 'Premier';
  totalSeats!: number;
}
