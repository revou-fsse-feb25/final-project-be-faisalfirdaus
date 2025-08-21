import { IsEnum, IsNumber, IsString, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsIn(['CARD', 'VA', 'EWALLET'], {
    message: 'method must be one of CARD, VA, EWALLET',
  })
  method: 'CARD' | 'VA' | 'EWALLET';

  @IsNumber()
  amount: number;

  @IsString()
  @IsIn(['IDR'], { message: 'Only IDR is supported right now' })
  currency: 'IDR';
}
