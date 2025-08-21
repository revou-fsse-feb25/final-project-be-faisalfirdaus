import { ApiProperty } from '@nestjs/swagger';

class BookingSeatDto {
  @ApiProperty() booking_seat_id: number;
  @ApiProperty() seat_id: number;
  @ApiProperty() row: string;
  @ApiProperty() number: number;
  @ApiProperty() price: number;
}
class PaymentDto {
  @ApiProperty() payment_id: number;
  @ApiProperty() amount: number;
  @ApiProperty() payment_time: string;
  @ApiProperty({ enum: ['Delayed', 'Success', 'Failed'] }) status: string;
}
export class BookingDetailDto {
  @ApiProperty() booking_reference: string;
  @ApiProperty({
    enum: ['Pending', 'Confirmed', 'Claimed', 'Cancelled', 'Expired'],
  })
  booking_status: string;
  @ApiProperty() showtime_id: number;
  @ApiProperty() user_id: number;
  @ApiProperty() total_amount: number;
  @ApiProperty({ required: false }) hold_expires_at?: string;
  @ApiProperty({ type: BookingSeatDto, isArray: true }) seats: BookingSeatDto[];
  @ApiProperty({ type: PaymentDto, isArray: true }) payments: PaymentDto[];
}
