import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';
export class MovieShowtimeDatesQueryDto {
  @ApiProperty({ description: 'Start date (inclusive)', example: '2025-08-21' })
  @IsISO8601({ strict: true })
  startDate: string;
  @ApiProperty({ description: 'End date (inclusive)', example: '2025-08-31' })
  @IsISO8601({ strict: true })
  endDate: string;
}
