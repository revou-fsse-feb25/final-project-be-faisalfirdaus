import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/req/create-payment.dto';
import { PaymentStatus, BookingStatus } from '@prisma/client';
import { PaymentResponseDto } from './dto/res/payment-response.dto';
import {
  GatewayPaymentStatus,
  PaymentWebhookDto,
} from './dto/req/payment-webhook.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPaymentIntent(
    bookingId: number,
    userId: number,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user_id !== userId)
      throw new ForbiddenException('Not your booking');

    if (booking.booking_status !== BookingStatus.Pending)
      throw new BadRequestException('Booking is not pending');

    if (booking.hold_expires_at && booking.hold_expires_at < new Date())
      throw new BadRequestException('Booking expired');

    if (dto.amount !== booking.total_amount)
      throw new BadRequestException('Invalid amount');

    const payment = await this.prisma.payment.create({
      data: {
        booking_id: bookingId,
        amount: dto.amount,
        payment_time: new Date(),
        status: PaymentStatus.Delayed,
      },
    });

    return {
      payment_id: payment.payment_id,
      booking_id: payment.booking_id,
      amount: payment.amount,
      payment_time: payment.payment_time,
      status: payment.status,
      client_secret: 'mock-client-secret',
      redirect_url: 'https://mock-gateway/checkout',
    };
  }

  async handleWebhook(dto: PaymentWebhookDto, signature: string) {
    // TODO: verify signature with your payment gateway SDK
    if (!signature) throw new ForbiddenException('Missing signature');

    const updated = await this.prisma.payment.updateMany({
      where: {
        booking_id: dto.bookingId,
      },
      data: {
        status:
          dto.status === GatewayPaymentStatus.Success
            ? PaymentStatus.Success
            : PaymentStatus.Failed,
      },
    });

    if (dto.status === GatewayPaymentStatus.Success && updated.count > 0) {
      await this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: { booking_status: BookingStatus.Confirmed },
      });
    }

    return { received: true };
  }

  async listPayments(
    bookingId: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<PaymentResponseDto[]> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (!isAdmin && booking.user_id !== userId)
      throw new ForbiddenException('Not your booking');

    const payments = await this.prisma.payment.findMany({
      where: { booking_id: bookingId },
    });

    return payments.map((p) => ({
      payment_id: p.payment_id,
      booking_id: p.booking_id,
      amount: p.amount,
      payment_time: p.payment_time,
      status: p.status,
    }));
  }
}
