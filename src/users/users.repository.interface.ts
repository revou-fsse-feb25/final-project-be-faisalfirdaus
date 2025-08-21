import { User } from './entities/user.entity';

export interface UsersRepositoryInterface {
  getAllUsers(): Promise<User[]>;
  getUserById(userId: number): Promise<User>;
  createUser(user: User): Promise<User>;
  updateUserProfile(userId: number, user: Partial<User>): Promise<User>;
  deleteUser(userId: number): Promise<void>;
}
