import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BookingStatusDto {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Claimed = 'Claimed',
  Cancelled = 'Cancelled',
  Expired = 'Expired',
}

export class AdminBookingsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  showtimeId?: number;

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

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string; // opaque booking id cursor if you want it
}
