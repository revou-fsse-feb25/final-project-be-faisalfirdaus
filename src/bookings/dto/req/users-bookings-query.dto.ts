import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { BookingStatusDto } from './admin-bookings-query.dto';

export class UsersBookingsQueryDto {
  @ApiPropertyOptional({ enum: BookingStatusDto })
  @IsOptional()
  @IsEnum(BookingStatusDto)
  status?: BookingStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}
