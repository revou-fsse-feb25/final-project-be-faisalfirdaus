import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'bob@example.com' })
  email: string;

  @ApiProperty({ example: 'bob' })
  username: string;

  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ example: '+628123456789', nullable: true, required: false })
  phone?: string | null;

  @ApiProperty({ example: '2025-08-21T13:00:00.000Z' })
  createdAt: Date;
}
