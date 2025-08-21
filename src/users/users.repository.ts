import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepositoryInterface } from './users.repository.interface';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/req/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersRepository implements UsersRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany();

    if (!users || users.length === 0) {
      throw new NotFoundException('No users found.');
    }

    return users;
  }

  async getUserById(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user;
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    return this.prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        password: user.password, // ⚠️ hash this before calling createUser!
        phone: user.phone || '',
        role: user.role,
      },
    });
  }

  async updateUserProfile(userId: number, body: UpdateUserDto): Promise<User> {
    // Defensive whitelist
    const data: Partial<User> = {};
    if (body.username !== undefined) data.username = body.username;
    if (body.phone !== undefined) data.phone = body.phone || '';

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, // use the right field (check your Prisma schema, could be `id` or `user_id`)
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // Update in DB
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
