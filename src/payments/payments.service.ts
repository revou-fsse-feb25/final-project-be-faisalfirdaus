import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PaymentStatus, BookingStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/users/entities/user.entity';
import { CreatePaymentAttemptDto } from './dto/req/create-payment.dto';
import { PaymentListItemDto } from './dto/res/payment-list-item.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /bookings/:bookingReference/payments
   * Create a new payment attempt for the remaining amount.
   * Returns a redirect URL (stub) and the created paymentId.
   */
  async createPaymentAttempt(
    user: User,
    bookingReference: string,
    _body: CreatePaymentAttemptDto,
  ): Promise<{ redirectUrl: string; paymentId: number }> {
    const booking = await this.getBookingForUser(user, bookingReference);

    // Basic policy: do not accept payments for cancelled/expired
    if (
      booking.booking_status === BookingStatus.Cancelled ||
      booking.booking_status === BookingStatus.Expired
    ) {
      throw new BadRequestException('BOOKING_CLOSED');
    }

    const remaining = await this.getRemainingAmount(
      booking.id,
      booking.total_amount,
    );
    if (remaining <= 0) {
      throw new BadRequestException('ALREADY_PAID');
    }

    // Create a payment attempt (Delayed == awaiting gateway)
    const payment = await this.prisma.payment.create({
      data: {
        booking_id: booking.id,
        amount: remaining,
        payment_time: new Date(), // created-at timestamp
        status: PaymentStatus.Delayed,
      },
      select: { payment_id: true },
    });

    // TODO: integrate PSP here (create checkout session), store PSP ref if schema allows
    const redirectUrl = this.buildRedirectUrl(
      bookingReference,
      payment.payment_id,
    );

    return { redirectUrl, paymentId: payment.payment_id };
  }

  /**
   * GET /bookings/:bookingReference/payments
   */
  async listPaymentAttempts(
    user: User,
    bookingReference: string,
  ): Promise<PaymentListItemDto[]> {
    const booking = await this.getBookingForUser(user, bookingReference);

    const payments = await this.prisma.payment.findMany({
      where: { booking_id: booking.id },
      orderBy: { payment_time: 'desc' },
      select: {
        payment_id: true,
        amount: true,
        payment_time: true,
        status: true,
      },
    });

    return payments.map((p) => ({
      payment_id: p.payment_id,
      amount: p.amount,
      payment_time: p.payment_time.toISOString(),
      status: p.status,
    }));
  }

  /**
   * POST /bookings/:bookingReference/payments/retry
   * Allows creating a new attempt if not fully paid yet.
   */
  async retryPaymentAttempt(
    user: User,
    bookingReference: string,
  ): Promise<{ redirectUrl: string; paymentId: number }> {
    const booking = await this.getBookingForUser(user, bookingReference);

    if (
      booking.booking_status === BookingStatus.Cancelled ||
      booking.booking_status === BookingStatus.Expired
    ) {
      throw new BadRequestException('BOOKING_CLOSED');
    }

    const remaining = await this.getRemainingAmount(
      booking.id,
      booking.total_amount,
    );
    if (remaining <= 0) {
      throw new BadRequestException('ALREADY_PAID');
    }

    const payment = await this.prisma.payment.create({
      data: {
        booking_id: booking.id,
        amount: remaining,
        payment_time: new Date(),
        status: PaymentStatus.Delayed,
      },
      select: { payment_id: true },
    });

    const redirectUrl = this.buildRedirectUrl(
      bookingReference,
      payment.payment_id,
    );
    return { redirectUrl, paymentId: payment.payment_id };
  }

  /* --------------------------------- helpers -------------------------------- */

  private async getBookingForUser(user: User, bookingReference: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { booking_reference: bookingReference },
      select: {
        id: true,
        user_id: true,
        total_amount: true,
        booking_status: true,
      },
    });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    if (booking.user_id !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    return booking;
  }

  /** Compute remaining amount: total - sum(success payments) */
  private async getRemainingAmount(
    bookingId: number,
    totalAmount: number,
  ): Promise<number> {
    const agg = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { booking_id: bookingId, status: PaymentStatus.Success },
    });

    const paid = agg._sum.amount ?? 0;
    return Math.max(totalAmount - paid, 0);
  }

  /** Stub redirect URL builder; replace with your PSP checkout session URL */
  private buildRedirectUrl(
    bookingReference: string,
    paymentId: number,
  ): string {
    // In real life, create a PSP session and return its url.
    // Keep this deterministic for now:
    return `https://payments.example/checkout?booking=${encodeURIComponent(
      bookingReference,
    )}&pid=${paymentId}`;
  }
}
