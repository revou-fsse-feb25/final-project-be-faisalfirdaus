import { ApiProperty } from '@nestjs/swagger';
export class MovieDetailResponseDto {
  @ApiProperty() movie_id: number;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty() duration_minutes: number;
  @ApiProperty() poster_url: string;
  @ApiProperty({ enum: ['COMING_SOON', 'NOW_SHOWING', 'ARCHIVED'] })
  status: string;
  @ApiProperty() is_active: boolean;
  @ApiProperty({ type: String, isArray: true }) genres: string[];
}
