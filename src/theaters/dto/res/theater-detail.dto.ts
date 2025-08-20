// src/theaters/dto/res/theater-detail.dto.ts
// import { ApiProperty } from '@nestjs/swagger';

export class TheaterDetailDto {
  theaterId!: string;
  name!: string;
  address!: string;
  city!: string;
  phone!: string;

  // Optional: include basic studio list
  studios?: TheaterDetailStudioDto[];
}

export class TheaterDetailStudioDto {
  studioId!: string;
  studioName!: string;
  studioType!: 'Regular' | 'IMAX' | 'Premier';
  totalSeats!: number;
}
