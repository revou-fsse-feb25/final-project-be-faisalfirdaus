import { ApiProperty } from '@nestjs/swagger';
import { TheaterListItemDto } from './theater-list-item.dto';

export class TheaterDetailDto extends TheaterListItemDto {
  @ApiProperty({ type: Number, isArray: true }) studio_ids: number[];
}
