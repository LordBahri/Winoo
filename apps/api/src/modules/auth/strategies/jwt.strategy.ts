import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
        subscription: { select: { planId: true, status: true } },
      },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      planId: user.subscription?.planId ?? null,
    };
  }
}
