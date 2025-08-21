import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePaymentAttemptDto {
  @ApiPropertyOptional({ description: 'Payment provider (if multiple)' })
  @IsOptional()
  @IsString()
  provider?: string; // e.g. 'xendit'
}
