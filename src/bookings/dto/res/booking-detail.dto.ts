// src/bookings/dto/res/booking-detail.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../dto/req/list-bookings-query.dto';
import { BookingSeatDto } from './booking-seat.dto';
import { PaymentSummaryDto } from './payment-summary.dto';

export class BookingDetailDto {
  @ApiProperty() bookingId!: string;
  @ApiProperty() booking_reference!: string;
  @ApiProperty({ enum: BookingStatus }) booking_status!: BookingStatus;
  @ApiProperty() hold_expires_at!: string | null;

  @ApiProperty() userId!: string;
  @ApiProperty() showtimeId!: string;

  // denormalized snapshot fields
  @ApiProperty() movieTitle!: string;
  @ApiProperty() theaterName!: string;
  @ApiProperty() studioName!: string;

  @ApiProperty({ type: [BookingSeatDto] }) seats!: BookingSeatDto[];
  @ApiProperty() total_amount!: number;

  @ApiProperty({ type: PaymentSummaryDto, required: false })
  payment?: PaymentSummaryDto;
}
