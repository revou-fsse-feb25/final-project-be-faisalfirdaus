import { ApiProperty } from '@nestjs/swagger';

export class SeatLayoutItemDto {
  @ApiProperty() seat_id: number;
  @ApiProperty() row_letter: string;
  @ApiProperty() seat_number: number;
  @ApiProperty() is_blocked: boolean;
}
