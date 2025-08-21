import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreatePaymentAttemptDto } from './dto/req/create-payment.dto';
import { PaymentListItemDto } from './dto/res/payment-list-item.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings/:bookingReference/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOkResponse({
    schema: {
      example: { redirectUrl: 'https://pay.example/…', paymentId: 123 },
    },
  })
  createPaymentAttempt(
    @Param('bookingReference') bookingReference: string,
    @CurrentUser() user: User,
    @Body() body: CreatePaymentAttemptDto,
  ): Promise<any> {
    return this.paymentsService.createPaymentAttempt(
      user,
      bookingReference,
      body,
    );
  }

  @Get()
  @ApiOkResponse({ type: PaymentListItemDto, isArray: true })
  listPaymentAttempts(
    @Param('bookingReference') bookingReference: string,
    @CurrentUser() user: User,
  ): Promise<PaymentListItemDto[]> {
    return this.paymentsService.listPaymentAttempts(user, bookingReference);
  }

  @Post('retry')
  @ApiOkResponse({
    schema: {
      example: { redirectUrl: 'https://pay.example/…', paymentId: 124 },
    },
  })
  retryPaymentAttempt(
    @Param('bookingReference') bookingReference: string,
    @CurrentUser() user: User,
  ): Promise<any> {
    return this.paymentsService.retryPaymentAttempt(user, bookingReference);
  }
}
