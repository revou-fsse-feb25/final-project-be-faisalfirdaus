import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  showtimeId: number;

  @ApiProperty({ type: [Number], description: 'Seat IDs' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  seats: number[];
}
