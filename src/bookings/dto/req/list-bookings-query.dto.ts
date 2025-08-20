// src/bookings/dto/req/list-bookings-query.dto.ts
import { IsEnum, IsOptional } from 'class-validator';

export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Claimed = 'Claimed',
  Cancelled = 'Cancelled',
  Expired = 'Expired',
}

export class ListBookingsQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
