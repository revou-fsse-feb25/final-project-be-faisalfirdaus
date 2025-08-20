import { IsOptional, IsString } from 'class-validator';

export class TheatersListQueryDto {
  @IsOptional()
  @IsString()
  city?: string; // case-insensitive filter
}
