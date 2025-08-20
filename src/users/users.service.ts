import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/req/update-user.dto';
import { UsersServiceInterface } from './users.service.interface';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
import { UsersResponseDto } from './dto/res/users-response.dto';

@Injectable()
export class UsersService implements UsersServiceInterface {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getAllUsers(
    search?: string,
    limit?: number,
  ): Promise<UsersResponseDto[]> {
    const users = await this.usersRepository.getAllUsers();

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      phone: user.phone || '',
      created_at: user.created_at,
    }));
  }

  async getUserProfile(user: User): Promise<UsersResponseDto> {
    const exsitingUser = await this.usersRepository.getUserById(user.id);

    if (!exsitingUser) {
      throw new Error(`User with ID ${user.id} not found.`);
    }

    const userProfile: UsersResponseDto = {
      id: exsitingUser.id,
      email: exsitingUser.email,
      role: exsitingUser.role,
      username: exsitingUser.username,
      phone: exsitingUser.phone || '',
      created_at: exsitingUser.created_at,
    };

    return Promise.resolve(userProfile);
  }

  async updateUserProfile(
    user: User,
    body: UpdateUserDto,
  ): Promise<UsersResponseDto> {
    const exsitingUser = await this.usersRepository.getUserById(user.id);

    if (!exsitingUser) {
      throw new Error(`User with ID ${user.id} not found.`);
    }

    // Update user properties based on the body
    const updatedUser = await this.usersRepository.updateUserProfile(
      user.id,
      body,
    );

    const userProfile: UsersResponseDto = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      username: updatedUser.username,
      phone: updatedUser.phone || '',
      created_at: updatedUser.created_at,
    };
    return userProfile;
  }
}
