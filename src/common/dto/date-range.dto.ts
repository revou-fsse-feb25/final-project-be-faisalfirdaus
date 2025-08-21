import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class DateRangeQueryDto {
  @ApiPropertyOptional({ format: 'date', example: '2025-08-21' })
  @IsOptional()
  @IsISO8601({ strict: true })
  dateFrom?: string;

  @ApiPropertyOptional({ format: 'date', example: '2025-08-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  dateTo?: string;
}
