// src/bookings/dto/req/create-booking.dto.ts
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  showtimeId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  seatIds!: number[];
}
