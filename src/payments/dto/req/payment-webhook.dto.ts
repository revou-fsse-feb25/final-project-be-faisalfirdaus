import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export enum GatewayPaymentStatus {
  Success = 'Success',
  Failed = 'Failed',
}

export class PaymentWebhookDto {
  @IsString()
  gatewayRef: string; // Transaction ID from payment gateway

  @IsNumber()
  bookingId: number;

  @IsEnum(GatewayPaymentStatus)
  status: GatewayPaymentStatus;

  @IsOptional()
  @IsNumber()
  paymentId?: number;
}
