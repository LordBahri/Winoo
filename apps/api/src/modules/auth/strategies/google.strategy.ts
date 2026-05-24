import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') ?? 'placeholder',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') ?? 'placeholder',
      callbackURL: `${config.get('app.apiUrl')}/api/v1/auth/oauth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { emails, displayName, photos, id } = profile;
    const result = await this.authService.handleOAuthLogin({
      email: emails[0].value,
      name: displayName,
      provider: 'google',
      providerId: id,
      avatarUrl: photos[0]?.value,
    });
    done(null, result);
  }
}
