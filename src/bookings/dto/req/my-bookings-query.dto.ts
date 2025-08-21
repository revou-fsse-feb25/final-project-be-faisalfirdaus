import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
export enum BookingStatusDto {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Claimed = 'Claimed',
  Cancelled = 'Cancelled',
  Expired = 'Expired',
}

export class MyBookingsQueryDto {
  @ApiPropertyOptional({ enum: BookingStatusDto })
  @IsOptional()
  @IsEnum(BookingStatusDto)
  status?: BookingStatusDto;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() dateTo?: string;
}
