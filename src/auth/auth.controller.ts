// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/req/register-auth.dto';
import { LoginAuthDto } from './dto/req/login-auth.dto';
import { RefreshTokenDto } from './dto/req/refresh-token.dto';
import { RegisterResponseDto } from './dto/res/register-response.dto';
import { LoginResponseDto } from './dto/res/login-response.dto';
import { RefreshResponseDto } from './dto/res/refresh-response.dto';

@ApiTags('auth')
@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterAuthDto })
  @ApiOkResponse({ type: RegisterResponseDto })
  userRegister(@Body() body: RegisterAuthDto): Promise<RegisterResponseDto> {
    return this.authService.userRegister(body);
  }

  @Post('login')
  @ApiBody({ type: LoginAuthDto })
  @ApiOkResponse({ type: LoginResponseDto })
  userLogin(@Body() body: LoginAuthDto): Promise<LoginResponseDto> {
    return this.authService.userLogin(body);
  }

  @Post('refresh')
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ type: RefreshResponseDto })
  refresh(@Body() body: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refresh(body);
  }

  @Post('logout')
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ schema: { example: { success: true } } })
  logout(@Body() body: RefreshTokenDto): Promise<{ success: true }> {
    return this.authService.logout(body);
  }
}
