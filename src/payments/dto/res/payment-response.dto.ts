import { PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  payment_id: number;
  booking_id: number;
  amount: number;
  payment_time: Date;
  status: PaymentStatus;

  // Gateway integration fields
  client_secret?: string;
  redirect_url?: string;
}
