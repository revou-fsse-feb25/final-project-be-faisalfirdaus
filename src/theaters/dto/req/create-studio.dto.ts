import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Min } from 'class-validator';
export enum StudioTypeDto {
  Regular = 'Regular',
  IMAX = 'IMAX',
  Premier = 'Premier',
}

export class CreateStudioDto {
  @ApiProperty() @IsString() studio_name: string;
  @ApiProperty() @IsInt() @Min(1) total_seats: number;
  @ApiProperty({ enum: StudioTypeDto })
  @IsEnum(StudioTypeDto)
  studio_type: StudioTypeDto;
}
export class UpdateStudioDto extends CreateStudioDto {}
