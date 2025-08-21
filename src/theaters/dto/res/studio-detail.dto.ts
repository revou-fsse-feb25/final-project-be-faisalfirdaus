import { ApiProperty } from '@nestjs/swagger';

export class StudioDetailDto {
  @ApiProperty() studio_id: number;
  @ApiProperty() theater_id: number;
  @ApiProperty() studio_name: string;
  @ApiProperty() total_seats: number;
  @ApiProperty({ enum: ['Regular', 'IMAX', 'Premier'] }) studio_type: string;
}
