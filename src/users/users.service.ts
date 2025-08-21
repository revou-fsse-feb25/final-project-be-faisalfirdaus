// src/users/users.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/req/update-user.dto';
import { UsersServiceInterface } from './users.service.interface';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
import { UsersResponseDto } from './dto/res/users-response.dto';

@Injectable()
export class UsersService implements UsersServiceInterface {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getAllUsers(): Promise<UsersResponseDto[]> {
    const users = await this.usersRepository.getAllUsers();

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      username: u.username,
      phone: u.phone || '',
      created_at: u.created_at,
    }));
  }

  async getUserProfile(current: User): Promise<UsersResponseDto> {
    const user = await this.usersRepository.getUserById(current.id);
    if (!user)
      throw new NotFoundException(`User with ID ${current.id} not found`);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      phone: user.phone || '',
      created_at: user.created_at,
    };
  }

  async updateUserProfile(
    current: User,
    body: UpdateUserDto,
  ): Promise<UsersResponseDto> {
    const existing = await this.usersRepository.getUserById(current.id);
    if (!existing)
      throw new NotFoundException(`User with ID ${current.id} not found`);

    const payload: UpdateUserDto = {
      ...(typeof body.username === 'string'
        ? { username: body.username.trim() }
        : {}),
      ...(typeof body.phone === 'string' ? { phone: body.phone.trim() } : {}),
    };

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    const updated = await this.usersRepository.updateUserProfile(
      current.id,
      payload,
    );

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      username: updated.username,
      phone: updated.phone || '',
      created_at: updated.created_at,
    };
  }
}
