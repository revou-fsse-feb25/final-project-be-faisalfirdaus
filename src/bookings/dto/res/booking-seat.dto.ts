// src/bookings/dto/res/booking-seat.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BookingSeatDto {
  @ApiProperty() seat_id!: string;
  @ApiProperty() row_letter!: string;
  @ApiProperty() seat_number!: number;
  @ApiProperty() price_cents!: number;
}
