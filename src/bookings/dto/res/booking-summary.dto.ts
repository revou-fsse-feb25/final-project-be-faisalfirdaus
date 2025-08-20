// src/bookings/dto/res/booking-summary.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../dto/req/list-bookings-query.dto';

export class BookingSummaryDto {
  @ApiProperty() bookingId!: string;
  @ApiProperty() booking_reference!: string;
  @ApiProperty({ enum: BookingStatus }) booking_status!: BookingStatus;
  @ApiProperty() showtimeId!: string;
  @ApiProperty() movieTitle!: string;
  @ApiProperty() theaterName!: string;
  @ApiProperty() studioName!: string;
  @ApiProperty() total_amount!: number;
  @ApiProperty() booking_datetime_iso!: string;
}
