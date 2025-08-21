// src/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

import { UsersRepository } from 'src/users/users.repository';

import { RegisterAuthDto } from './dto/req/register-auth.dto';
import { LoginAuthDto } from './dto/req/login-auth.dto';
import { RefreshTokenDto } from './dto/req/refresh-token.dto';

import { RegisterResponseDto } from './dto/res/register-response.dto';
import { LoginResponseDto } from './dto/res/login-response.dto';
import { RefreshResponseDto } from './dto/res/refresh-response.dto';

type JwtPayload = { sub: number; email: string; role: Role };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /* -------------------------------- REGISTER -------------------------------- */

  async userRegister(body: RegisterAuthDto): Promise<RegisterResponseDto> {
    const email = body.email.trim().toLowerCase();
    const username = body.username.trim();
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null;

    const existing = await this.usersRepository.getUserByEmail(email);
    if (existing) {
      throw new ConflictException(`User with email ${email} already exists.`);
    }

    const saltRounds = Number(this.config.get('BCRYPT_SALT_ROUNDS') ?? 10);
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);

    const created = await this.usersRepository.createUser({
      username,
      email,
      role: Role.USER,
      password: hashedPassword,
      phone: phone ?? undefined,
      created_at: new Date(),
    });

    return {
      id: created.id,
      email: created.email,
      username: created.username,
      role: created.role,
      phone: created.phone,
      createdAt: created.created_at,
    };
  }

  /* ---------------------------------- LOGIN --------------------------------- */

  async userLogin(body: LoginAuthDto): Promise<LoginResponseDto> {
    const email = body.email.trim().toLowerCase();
    const user = await this.usersRepository.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const { access_token, refresh_token } = await this.signTokens(payload);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        phone: user.phone || '',
        created_at: user.created_at,
      },
    };
  }

  /* --------------------------------- REFRESH -------------------------------- */

  async refresh(body: RefreshTokenDto): Promise<RefreshResponseDto> {
    const token = body.refresh_token;
    if (!token) throw new UnauthorizedException('Missing refresh token');

    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')!;
    const issuer = this.config.get<string>('JWT_ISSUER') || 'cinema.api';
    const audience = this.config.get<string>('JWT_AUDIENCE') || 'cinema.web';

    let decoded: JwtPayload;
    try {
      decoded = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: refreshSecret,
        issuer,
        audience,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.getUserById(decoded.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const { access_token, refresh_token } = await this.signTokens(payload);

    return { access_token, refresh_token };
  }

  /* --------------------------------- LOGOUT --------------------------------- */

  async logout(_body: RefreshTokenDto): Promise<{ success: true }> {
    // Stateless logout: client discards tokens.
    // For server-side revocation, add a denylist/whitelist store and mark this refresh token as revoked.
    return { success: true };
  }

  /* -------------------------------- HELPERS --------------------------------- */

  private async signTokens(
    payload: JwtPayload,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const accessSecret = this.config.get<string>('JWT_SECRET')!;
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')!;
    const issuer = this.config.get<string>('JWT_ISSUER') || 'cinema.api';
    const audience = this.config.get<string>('JWT_AUDIENCE') || 'cinema.web';
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') || '15m';
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') || '7d';

    const access_token = await this.jwt.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessTtl,
      issuer,
      audience,
    });

    const refresh_token = await this.jwt.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshTtl,
      issuer,
      audience,
    });

    return { access_token, refresh_token };
  }
}
