import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Get,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/req/create-payment.dto';
import { PaymentResponseDto } from './dto/res/payment-response.dto';
import { PaymentWebhookDto } from './dto/req/payment-webhook.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /bookings/:id/payments
  @UseGuards(JwtAuthGuard)
  @Post('bookings/:id/payments')
  async createPayment(
    @Param('id') bookingId: string,
    @Body() body: CreatePaymentDto,
    @Req() req: any,
  ): Promise<PaymentResponseDto> {
    const userId = req.user.id;
    return this.paymentsService.createPaymentIntent(
      parseInt(bookingId, 10),
      userId,
      body,
    );
  }

  // POST /payments/webhook (public, signed)
  @Post('payments/webhook')
  async handleWebhook(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(dto, signature);
  }

  // GET /bookings/:id/payments
  @UseGuards(JwtAuthGuard)
  @Get('bookings/:id/payments')
  async getPayments(
    @Param('id') bookingId: string,
    @Req() req: any,
  ): Promise<PaymentResponseDto[]> {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    return this.paymentsService.listPayments(
      parseInt(bookingId, 10),
      userId,
      isAdmin,
    );
  }
}
