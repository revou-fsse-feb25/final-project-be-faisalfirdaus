import { UpdateUserDto } from './dto/req/update-user.dto';
import { User } from './entities/user.entity';
import { UsersResponseDto } from './dto/res/users-response.dto';

export interface UsersServiceInterface {
  getAllUsers(): Promise<UsersResponseDto[]>;
  getUserProfile(user: User): Promise<UsersResponseDto>;
  updateUserProfile(user: User, body: UpdateUserDto): Promise<UsersResponseDto>;
}
