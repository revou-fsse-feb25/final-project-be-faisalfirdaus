import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/req/register-auth.dto';
import { LoginAuthDto } from './dto/req/login-auth.dto';
import { RegisterResponseDto } from './dto/res/register-response.dto';
import { LoginResponseDto } from './dto/res/login-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async userRegister(
    @Body() body: RegisterAuthDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.userRegister(body);
  }

  @Post('login')
  async userLogin(@Body() body: LoginAuthDto): Promise<LoginResponseDto> {
    return await this.authService.userLogin(body);
  }

  // @Post('refresh')
  // refreshToken(@Body() body: LoginAuthDto) {
  //   return 'return refresh access token';
  // }

  // @Post('logout')
  // userLogout(@Body() body: LoginAuthDto) {
  //   return 'remove refresh token from db';
  // }
}
