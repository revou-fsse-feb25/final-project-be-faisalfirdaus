import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GenreResponseDto {
  @ApiProperty() genre_id: number;
  @ApiProperty() name: string;
}

export class CreateGenreDto {
  @ApiProperty() @IsString() name: string;
}

export class UpdateGenreDto {
  @ApiProperty() @IsString() name: string;
}
