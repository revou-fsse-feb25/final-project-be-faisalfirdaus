import { ApiProperty } from '@nestjs/swagger';
class TheaterShowtimeEntryDto {
  @ApiProperty() showtimeId: number;
  @ApiProperty() timeHHmm: string;
  @ApiProperty() studioName: string;
  @ApiProperty({ enum: ['Regular', 'IMAX', 'Premier'] }) studioType: string;
  @ApiProperty() price: number;
}
export class MovieShowtimesResponseDto {
  @ApiProperty() theater_id: number;
  @ApiProperty() theater_name: string;
  @ApiProperty({ type: TheaterShowtimeEntryDto, isArray: true })
  entries: TheaterShowtimeEntryDto[];
}
