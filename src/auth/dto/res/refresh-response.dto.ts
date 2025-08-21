import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6…' })
  access_token: string;

  @ApiProperty({ example: 'def50200b1c9e3f3fbc1…' })
  refresh_token: string;
}
