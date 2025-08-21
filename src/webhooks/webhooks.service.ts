import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus, BookingStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PaymentWebhookDto } from './dto/req/payment-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle PSP payment webhooks.
   * 1) (Optional) Verify signature using WEBHOOK_SECRET.
   * 2) Load Payment by `payload.paymentId` (internal id we created).
   * 3) If incoming status is Success/Failed, update Payment accordingly (idempotent).
   * 4) On Success: re-calc booking paid sum; if >= total -> Confirm booking.
   */
  async handlePaymentWebhook(
    headers: Record<string, string>,
    payload: PaymentWebhookDto,
  ): Promise<void> {
    // 1) Verify signature (optional but recommended). See notes below for raw body handling.
    this.verifySignatureIfConfigured(headers, payload);

    // 2) Find payment
    const paymentId = (payload as any)?.paymentId;
    if (!paymentId || Number.isNaN(Number(paymentId))) {
      throw new BadRequestException('INVALID_PAYMENT_ID');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { payment_id: Number(paymentId) },
      select: {
        payment_id: true,
        booking_id: true,
        status: true,
      },
    });

    if (!payment) throw new NotFoundException('PAYMENT_NOT_FOUND');

    // 3) Map incoming status -> PaymentStatus (ignore unknowns)
    const incoming = String((payload as any)?.status || '').toLowerCase();
    const nextStatus =
      incoming === 'success' || incoming === 'succeeded'
        ? PaymentStatus.Success
        : incoming === 'failed' || incoming === 'failure'
          ? PaymentStatus.Failed
          : incoming === 'pending'
            ? PaymentStatus.Delayed
            : null;

    if (!nextStatus) {
      // Unknown status: accept but ignore (don’t throw to avoid webhook retries)
      return;
    }

    // Idempotency: if already terminal & same value, do nothing
    if (
      (payment.status === PaymentStatus.Success ||
        payment.status === PaymentStatus.Failed) &&
      payment.status === nextStatus
    ) {
      return;
    }

    // 4) Update payment + maybe confirm booking in a transaction.
    await this.prisma.$transaction(async (tx) => {
      // Re-read inside tx to avoid stale status race
      const current = await tx.payment.findUnique({
        where: { payment_id: payment.payment_id },
        select: { payment_id: true, booking_id: true, status: true },
      });
      if (!current) throw new NotFoundException('PAYMENT_NOT_FOUND');

      // If already terminal, do nothing (idempotent)
      if (
        current.status === PaymentStatus.Success ||
        current.status === PaymentStatus.Failed
      ) {
        return;
      }

      // Update the payment row
      await tx.payment.update({
        where: { payment_id: current.payment_id },
        data: {
          status: nextStatus,
          // Note: schema has `payment_time` only (no updated_at); it already stores creation time.
          // If you want to capture gateway confirmation time, consider adding a separate column.
        },
      });

      if (nextStatus !== PaymentStatus.Success) {
        // Only confirm booking on success
        return;
      }

      // On success, recompute total paid and confirm if fully paid
      const booking = await tx.booking.findUnique({
        where: { id: current.booking_id },
        select: {
          id: true,
          total_amount: true,
          booking_status: true,
        },
      });
      if (!booking) {
        // Payment exists but booking missing -> data issue; just stop here.
        return;
      }

      // If booking already Confirmed/Claimed/Cancelled/Expired, don't change it
      if (
        booking.booking_status === BookingStatus.Confirmed ||
        booking.booking_status === BookingStatus.Claimed ||
        booking.booking_status === BookingStatus.Cancelled ||
        booking.booking_status === BookingStatus.Expired
      ) {
        return;
      }

      const agg = await tx.payment.aggregate({
        _sum: { amount: true },
        where: {
          booking_id: booking.id,
          status: PaymentStatus.Success,
        },
      });
      const paid = agg._sum.amount ?? 0;

      if (paid >= booking.total_amount) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            booking_status: BookingStatus.Confirmed,
            hold_expires_at: null, // not needed once confirmed
          },
        });
      }
    });
  }

  /* ------------------------------------------------------------------------ */
  /*                               VERIFICATION                               */
  /* ------------------------------------------------------------------------ */

  /**
   * Verifies webhook HMAC signature if WEBHOOK_SECRET is configured.
   * - Expects header "x-signature" to contain hex HMAC-SHA256 over the raw body.
   * - Here we use JSON.stringify(payload) because Nest by default parses JSON.
   *   To verify raw body securely, set up a raw-body middleware and pass it here.
   */
  private verifySignatureIfConfigured(
    headers: Record<string, string>,
    payload: unknown,
  ) {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) return; // signature verification disabled

    const headerName = 'x-signature';
    const signature = headers[headerName] || headers[headerName.toUpperCase()];
    if (!signature) {
      throw new ForbiddenException('SIGNATURE_MISSING');
    }

    // WARNING: Using JSON.stringify here is only acceptable if your PSP signs the parsed JSON.
    // Prefer verifying the exact raw body bytes.
    const body = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (!timingSafeEqual(hmac, signature)) {
      throw new ForbiddenException('SIGNATURE_INVALID');
    }
  }
}

/* ------------------------------- utils -------------------------------- */

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}
