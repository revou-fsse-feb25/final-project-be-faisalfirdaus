import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { StudioTypeDto } from './showtimes-list-query.dto';

export class CreateShowtimeDto {
  @ApiProperty() @IsInt() @Min(1) movie_id: number;
  @ApiProperty() @IsInt() @Min(1) studio_id: number;
  @ApiProperty() @IsDateString() show_datetime: string;
  @ApiProperty() @IsInt() @Min(0) price: number;
  @ApiPropertyOptional() @IsBoolean() is_active?: boolean;
}
export class UpdateShowtimeDto extends CreateShowtimeDto {}
