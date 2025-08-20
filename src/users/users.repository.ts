import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepositoryInterface } from './users.repository.interface';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/req/update-user.dto';

@Injectable()
export class UsersRepository implements UsersRepositoryInterface {
  private users: User[] = [
    {
      id: '1',
      username: 'john_doe',
      email: '111@mail.com',
      role: 'USER',
      password: 'password123',
      phone: '1234567890',
      created_at: new Date('2023-01-01T00:00:00Z'),
    },
    {
      id: '2',
      username: 'john_smith',
      email: '222@mail.com',
      role: 'ADMIN',
      password: 'password123',
      phone: '1234567890',
      created_at: new Date('2023-01-01T00:00:00Z'),
    },
  ];

  getAllUsers(): Promise<User[]> {
    return this.users.length > 0
      ? Promise.resolve(this.users)
      : Promise.reject(new NotFoundException('No users found.'));
  }

  getUserById(userId: string): Promise<User> {
    const user = this.users.find((u) => u.id === userId.toString());
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    return Promise.resolve(user);
  }

  getUserByEmail(email: string): Promise<User> {
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }
    return Promise.resolve(user);
  }

  createUser(user: User): Promise<User> {
    this.users.push(user);
    return Promise.resolve(user);
  }

  updateUserProfile(userId: string, body: UpdateUserDto): Promise<User> {
    const id = String(userId); // normalize id comparison

    // Defensive whitelist
    const data: Partial<User> = {};
    if (body.username !== undefined) data.username = body.username;
    if (body.phone !== undefined) data.phone = body.phone || '';

    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const updatedUser: User = { ...this.users[userIndex], ...data };
    this.users[userIndex] = updatedUser;

    return Promise.resolve(updatedUser);
  }

  deleteUser(userId: string): Promise<void> {
    return Promise.resolve();
  }
}
