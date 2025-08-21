import { ApiProperty } from '@nestjs/swagger';

export class ShowtimeSeatAvailabilityDto {
  @ApiProperty() seat_id: number;
  @ApiProperty() row: string;
  @ApiProperty() number: number;
  @ApiProperty({ enum: ['AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED'] })
  status: string;
  @ApiProperty({ required: false }) hold_expires_at?: string;
}
