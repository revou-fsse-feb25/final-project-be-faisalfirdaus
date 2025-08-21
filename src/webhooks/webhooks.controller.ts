import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { PaymentWebhookDto } from './dto/req/payment-webhook.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payments')
  @HttpCode(200)
  @ApiOkResponse({ schema: { example: { received: true } } })
  async handlePaymentWebhook(
    @Headers() headers: Record<string, string>,
    @Body() payload: PaymentWebhookDto,
  ): Promise<{ received: true }> {
    await this.webhooksService.handlePaymentWebhook(headers, payload);
    return { received: true };
  }
}
