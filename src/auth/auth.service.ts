import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterAuthDto } from './dto/req/register-auth.dto';
import { LoginAuthDto } from './dto/req/login-auth.dto';
import { AuthServiceInterface } from './auth.service.interface';
import { UsersRepository } from 'src/users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDto } from './dto/res/login-response.dto';
import { RegisterResponseDto } from './dto/res/register-response.dto';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    private readonly usersReository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async userRegister(body: RegisterAuthDto): Promise<RegisterResponseDto> {
    const existingUser = await this.usersReository.getUserByEmail(body.email);
    if (existingUser) {
      throw new UnauthorizedException(
        `User with email ${body.email} already exists.`,
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser: User = {
      id: uuidv4(),
      username: body.username,
      email: body.email,
      role: 'USER',
      password: hashedPassword,
      phone: body.phone,
      created_at: new Date(),
    };

    const createdUser = await this.usersReository.createUser(newUser);
    if (!createdUser) {
      throw new UnauthorizedException('User registration failed');
    }
    // Remove password before returning user data
    const { password, ...userWithoutPassword } = createdUser;

    // Return the user without the password
    return {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      username: userWithoutPassword.username,
      role: userWithoutPassword.role,
      phone: userWithoutPassword.phone,
      createdAt: userWithoutPassword.created_at,
    };
  }

  async userLogin(body: LoginAuthDto): Promise<LoginResponseDto> {
    // Find the user
    const user = await this.usersReository.getUserByEmail(body.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password (⚠️ should use bcrypt.compare in production)
    if (user.password !== body.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Prepare JWT payload
    const payload = { email: user.email, sub: user.id, role: user.role };

    // Generate access token (short-lived, e.g., 15m)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });

    // Generate refresh token (long-lived, e.g., 7d)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // Remove password before returning user data
    const { password, ...userWithoutPassword } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
        username: userWithoutPassword.username,
        phone: userWithoutPassword.phone || '',
        created_at: userWithoutPassword.created_at,
      },
    };
  }
}
