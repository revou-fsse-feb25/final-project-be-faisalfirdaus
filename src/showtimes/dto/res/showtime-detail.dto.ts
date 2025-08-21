import { ApiProperty } from '@nestjs/swagger';

export class ShowtimeDetailDto {
  @ApiProperty() showtime_id: number;
  @ApiProperty() movie_id: number;
  @ApiProperty() studio_id: number;
  @ApiProperty() show_datetime: string;
  @ApiProperty() price: number;
  @ApiProperty() is_active: boolean;
  @ApiProperty() movie_title: string;
  @ApiProperty() theater_name: string;
  @ApiProperty() studio_name: string;
}
