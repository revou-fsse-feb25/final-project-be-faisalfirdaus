import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTheaterDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() address: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() phone: string;
}
export class UpdateTheaterDto extends CreateTheaterDto {}
