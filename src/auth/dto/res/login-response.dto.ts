import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6…' })
  access_token: string;

  @ApiProperty({ example: 'def50200b1c9e3f3fbc1…' })
  refresh_token: string;

  @ApiProperty({ type: () => UserLoginInfoDto })
  user: UserLoginInfoDto;
}

export class UserLoginInfoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 'ADMIN' })
  role: string;

  @ApiProperty({ example: 'alice' })
  username: string;

  @ApiProperty({ example: '+62812345678', nullable: true })
  phone: string | null;

  @ApiProperty({ example: '2025-08-21T13:00:00.000Z' })
  created_at: Date;
}
