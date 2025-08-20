import { User } from 'src/users/entities/user.entity';
import { LoginAuthDto } from './dto/req/login-auth.dto';
import { RegisterAuthDto } from './dto/req/register-auth.dto';
import { LoginResponseDto } from './dto/res/login-response.dto';
import { RegisterResponseDto } from './dto/res/register-response.dto';

export interface AuthServiceInterface {
  userRegister(body: RegisterAuthDto): Promise<RegisterResponseDto>;
  userLogin(body: LoginAuthDto): Promise<LoginResponseDto>;
}
