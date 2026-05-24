import { Injectable } from '@nestjs/common';
import {
  ApiException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '../../common/exceptions/api.exception';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { NotificationsService } from '../notifications/notifications.service';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 30;
const ACCESS_TOKEN_TTL = '15m';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException(ErrorCodes.EMAIL_ALREADY_EXISTS, 'Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
      },
    });

    await this.notifications.sendEmailVerification(user);
    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
    }
    if (user.isBanned) {
      throw new ForbiddenException('Your account has been suspended. Contact support.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async refreshTokens(rawRefreshToken: string) {
    const tokenHash = await bcrypt.hash(rawRefreshToken, 8);

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, isRevoked: false, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!stored) {
      // Potential token reuse attack — revoke entire family
      const decoded = this.decodeRefreshToken(rawRefreshToken);
      if (decoded?.familyId) {
        await this.prisma.refreshToken.updateMany({
          where: { familyId: decoded.familyId },
          data: { isRevoked: true },
        });
      }
      throw new UnauthorizedException(ErrorCodes.INVALID_REFRESH_TOKEN, 'Refresh token is invalid or expired');
    }

    // Rotate: revoke old, issue new in same family
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    return this.issueTokenPair(stored.userId, stored.user.email, stored.user.role, stored.familyId);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // silent — don't reveal if email exists

    const token = uuidv4();
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await this.notifications.sendPasswordReset(user, token);
  }

  async resetPassword(token: string, newPassword: string) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new ApiException({
        code: ErrorCodes.INVALID_RESET_TOKEN,
        message: 'This reset link has expired or already been used',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens on password change
      this.prisma.refreshToken.updateMany({
        where: { userId: reset.userId },
        data: { isRevoked: true },
      }),
    ]);
  }

  async handleOAuthLogin(profile: { email: string; name: string; provider: string; providerId: string; avatarUrl?: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          oauthProvider: profile.provider,
          oauthProviderId: profile.providerId,
          isEmailVerified: true,
        },
      });
    }

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  private async issueTokenPair(userId: string, email: string, role: string, familyId?: string) {
    const jti = uuidv4();
    const family = familyId ?? uuidv4();

    const accessToken = this.jwt.sign(
      { sub: userId, email, role, jti },
      {
        secret: this.config.get('jwt.accessSecret'),
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );

    const rawRefreshToken = uuidv4();
    const tokenHash = await bcrypt.hash(rawRefreshToken, 8);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, familyId: family, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken, expiresAt };
  }

  private decodeRefreshToken(token: string): { familyId?: string } | null {
    try {
      return this.jwt.decode(token) as { familyId?: string };
    } catch {
      return null;
    }
  }
}
