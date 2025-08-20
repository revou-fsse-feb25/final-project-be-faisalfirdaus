// src/showtimes/dto/res/showtime-seat-availability.dto.ts
// import { ApiProperty } from '@nestjs/swagger';

export class ShowtimeSeatAvailabilityDto {
  seat_id!: string;
  row_letter!: string;
  seat_number!: number;
  is_blocked!: boolean; // static layout flag
  is_available!: boolean; // live availability for this showtime
}
