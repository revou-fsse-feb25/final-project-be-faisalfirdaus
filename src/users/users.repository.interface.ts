import { User } from './entities/user.entity';

export interface UsersRepositoryInterface {
  getAllUsers(): Promise<User[]>;
  getUserById(userId: string): Promise<User>;
  createUser(user: User): Promise<User>;
  updateUserProfile(userId: string, user: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
}
