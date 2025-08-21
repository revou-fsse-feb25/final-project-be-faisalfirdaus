import { ApiProperty } from '@nestjs/swagger';

export class PaymentListItemDto {
  @ApiProperty() payment_id: number;
  @ApiProperty() amount: number;
  @ApiProperty() payment_time: string;
  @ApiProperty({ enum: ['Delayed', 'Success', 'Failed'] }) status: string;
}
