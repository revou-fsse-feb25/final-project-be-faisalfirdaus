import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BookingCancelDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
