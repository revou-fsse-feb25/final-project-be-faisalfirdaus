import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';
export class MovieShowtimesQueryDto {
  @ApiProperty({ example: '2025-08-21' })
  @IsISO8601({ strict: true })
  date: string;
}
