import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(
    private readonly config: ConfigService,
    @InjectQueue('notifications') private readonly notifQueue: Queue,
  ) {
    this.resend = new Resend(config.get('RESEND_API_KEY'));
    this.fromEmail = config.get('EMAIL_FROM', 'noreply@petid.app');
  }

  async sendEmailVerification(user: { email: string; name: string }, token?: string) {
    const verifyUrl = `${this.config.get('FRONTEND_URL')}/auth/verify-email?token=${token ?? 'demo'}`;

    await this.resend.emails.send({
      from: this.fromEmail,
      to: user.email,
      subject: 'Verify your PetID account',
      html: `
        <h1>Welcome to PetID, ${user.name}!</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verifyUrl}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `,
    }).catch((err) => this.logger.error('Email send failed', err));
  }

  async sendPasswordReset(user: { email: string; name: string }, token: string) {
    const resetUrl = `${this.config.get('FRONTEND_URL')}/auth/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: this.fromEmail,
      to: user.email,
      subject: 'Reset your PetID password',
      html: `
        <h1>Password Reset</h1>
        <p>Hi ${user.name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      `,
    }).catch((err) => this.logger.error('Password reset email failed', err));
  }

  async sendPetScanNotification(payload: {
    userId: string;
    fcmToken?: string | null;
    petName: string;
    city?: string | null;
  }) {
    if (payload.fcmToken) {
      await this.notifQueue.add('push', {
        token: payload.fcmToken,
        title: 'Your pet was scanned!',
        body: `${payload.petName} was just scanned${payload.city ? ` in ${payload.city}` : ''}`,
        data: { type: 'PET_SCANNED' },
      });
    }
  }

  async sendSightingNotification(payload: {
    userId: string;
    fcmToken?: string | null;
    petName: string;
    address?: string | null;
  }) {
    if (payload.fcmToken) {
      await this.notifQueue.add('push', {
        token: payload.fcmToken,
        title: 'Someone spotted your pet!',
        body: `A sighting of ${payload.petName} was reported${payload.address ? ` near ${payload.address}` : ''}`,
        data: { type: 'SIGHTING_REPORTED' },
      });
    }
  }
}
