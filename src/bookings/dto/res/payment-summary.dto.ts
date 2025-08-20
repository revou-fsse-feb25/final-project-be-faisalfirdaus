// src/bookings/dto/res/payment-summary.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaymentSummaryDto {
  @ApiProperty() amount_cents!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() status!: 'Delayed' | 'Success' | 'Failed';
  @ApiProperty({ required: false }) payment_time_iso?: string;
  @ApiProperty({ required: false }) method?: string;
}
