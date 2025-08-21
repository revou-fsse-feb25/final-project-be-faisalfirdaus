import { ApiProperty } from '@nestjs/swagger';
export class MoviesListItemDto {
  @ApiProperty() movie_id: number;
  @ApiProperty() title: string;
  @ApiProperty() poster_url: string;
  @ApiProperty() duration_minutes: number;
  @ApiProperty({ enum: ['COMING_SOON', 'NOW_SHOWING', 'ARCHIVED'] })
  status: string;
  @ApiProperty() is_active: boolean;
}
export class MoviesListResponseDto {
  @ApiProperty({ type: MoviesListItemDto, isArray: true })
  items: MoviesListItemDto[];
  @ApiProperty({ required: false }) nextCursor?: string;
}
