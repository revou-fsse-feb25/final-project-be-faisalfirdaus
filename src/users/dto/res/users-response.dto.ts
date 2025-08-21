import { ApiProperty } from '@nestjs/swagger';

export class UsersResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() username: string;
  @ApiProperty() email: string;
  @ApiProperty() phone: string;
  @ApiProperty({ enum: ['USER', 'ADMIN'] }) role: 'USER' | 'ADMIN';
  @ApiProperty() created_at: Date;
}
