import { ApiProperty } from '@nestjs/swagger';

export class TheaterListItemDto {
  @ApiProperty() theater_id: number;
  @ApiProperty() name: string;
  @ApiProperty() address: string;
  @ApiProperty() city: string;
  @ApiProperty() phone: string;
}
