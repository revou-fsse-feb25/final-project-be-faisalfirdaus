// src/theaters/dto/res/theater-list-item.dto.ts
// import { ApiProperty } from '@nestjs/swagger';

export class TheaterListItemDto {
  theaterId!: string;
  name!: string;
  address!: string;
  city!: string;
  phone!: string;
}
