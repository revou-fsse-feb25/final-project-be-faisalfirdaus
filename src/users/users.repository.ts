// src/users/users.repository.ts
import {
  ConflictException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersRepositoryInterface } from './users.repository.interface';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/req/update-user.dto';

@Injectable()
export class UsersRepository implements UsersRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        created_at: true,
      },
    });
    return users as unknown as User[];
  }

  async getUserById(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        created_at: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    return user as unknown as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        password: true,
        created_at: true,
      },
    });
    return (user as unknown as User) ?? null;
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const created = await this.prisma.user.create({
        data: {
          username: user.username,
          email: user.email.trim().toLowerCase(),
          password: user.password,
          phone: user.phone ?? '',
          role: user.role,
          created_at: user.created_at,
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          phone: true,
          created_at: true,
        },
      });
      return created as unknown as User;
    } catch (e: any) {
      if (
        e?.code === 'P2002' &&
        Array.isArray(e.meta?.target) &&
        e.meta.target.includes('email')
      ) {
        throw new ConflictException(
          `User with email ${user.email} already exists.`,
        );
      }
      throw e;
    }
  }

  async updateUserProfile(userId: number, body: UpdateUserDto): Promise<User> {
    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(body.username !== undefined ? { username: body.username } : {}),
          ...(body.phone !== undefined ? { phone: body.phone ?? '' } : {}),
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          phone: true,
          created_at: true,
        },
      });
      return updated as unknown as User;
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }
      throw e;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }
      throw e;
    }
  }
}
