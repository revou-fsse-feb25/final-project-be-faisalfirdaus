import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PaymentWebhookDto {
  @ApiProperty() @IsString() provider: string; // 'xendit' | 'midtrans' | 'stripe' …
  @ApiProperty() @IsString() event: string; // 'payment.succeeded', etc.
  @ApiProperty() @IsString() booking_reference: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsString() status: 'Success' | 'Failed' | 'Delayed';
  @ApiProperty({ required: false }) rawSignature?: string; // if not using headers
}
