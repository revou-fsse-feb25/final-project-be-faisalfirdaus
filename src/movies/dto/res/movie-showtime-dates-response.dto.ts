import { ApiProperty } from '@nestjs/swagger';
export class MovieShowtimeDatesResponseDto {
  @ApiProperty({ format: 'date' }) date: string;
  @ApiProperty() count: number;
}
