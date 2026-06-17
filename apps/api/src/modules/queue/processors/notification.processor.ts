import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import { PrismaService } from '../../../database/prisma.service';
import { QUEUES, NOTIFICATION_JOBS } from '../queue.constants';
import { NotificationType } from '@prisma/client';

interface PushJobData {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  userId?: string;
}

interface PetScannedJobData {
  petId: string;
  scanEventId: string;
  latitude?: number;
  longitude?: number;
  city?: string;
}

interface SightingJobData {
  ownerId: string;
  petName: string;
  address?: string;
  reportId: string;
}

@Processor(QUEUES.NOTIFICATIONS, {
  concurrency: 10,
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;
  private firebaseInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
    const resendKey = config.get<string>('RESEND_API_KEY');
    if (resendKey) this.resend = new Resend(resendKey);
    this.fromEmail = config.get<string>('EMAIL_FROM', 'noreply@petid.app');
    this.initFirebase();
  }

  private initFirebase() {
    const projectId = this.config.get('FIREBASE_PROJECT_ID');
    if (!projectId) return;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          clientEmail: this.config.get<string>('FIREBASE_CLIENT_EMAIL'),
        }),
      });
    }
    this.firebaseInitialized = true;
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing job ${job.name} [${job.id}]`);

    switch (job.name) {
      case NOTIFICATION_JOBS.PUSH:
        return this.handlePush(job.data as PushJobData);

      case NOTIFICATION_JOBS.PET_SCANNED:
        return this.handlePetScanned(job.data as PetScannedJobData);

      case NOTIFICATION_JOBS.SIGHTING_REPORTED:
        return this.handleSighting(job.data as SightingJobData);

      case NOTIFICATION_JOBS.EMAIL_VERIFICATION:
        return this.handleEmailVerification(job.data as { userId: string; token: string });

      case NOTIFICATION_JOBS.EMAIL_PASSWORD_RESET:
        return this.handlePasswordReset(job.data as { userId: string; token: string });

      case NOTIFICATION_JOBS.EMAIL_SUBSCRIPTION_EXPIRING:
        return this.handleSubscriptionExpiring(job.data as { userId: string; daysLeft: number });

      default:
        this.logger.warn(`Unknown notification job: ${job.name}`);
    }
  }

  // ── FCM Push ───────────────────────────────────────────────────────────────

  private async handlePush(data: PushJobData) {
    if (!this.firebaseInitialized) {
      this.logger.warn('Firebase not configured, skipping push');
      return;
    }

    await admin.messaging().send({
      token: data.token,
      notification: { title: data.title, body: data.body },
      data: data.data ?? {},
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });

    // Persist to notification inbox if userId provided
    if (data.userId) {
      await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: NotificationType.SYSTEM,
          title: data.title,
          body: data.body,
          data: data.data,
        },
      });
    }
  }

  // ── Pet Scanned ────────────────────────────────────────────────────────────

  private async handlePetScanned(data: PetScannedJobData) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: data.petId },
      include: { owner: { select: { id: true, name: true, fcmToken: true, email: true } } },
    });

    if (!pet) return;

    const location = data.city ?? `${data.latitude?.toFixed(4)}, ${data.longitude?.toFixed(4)}`;
    const title = `${pet.name} was just scanned!`;
    const body = `Someone scanned ${pet.name}'s tag${location ? ` in ${location}` : ''}`;

    // Save to notification inbox
    await this.prisma.notification.create({
      data: {
        userId: pet.ownerId,
        type: NotificationType.PET_SCANNED,
        title,
        body,
        data: { petId: pet.id, scanEventId: data.scanEventId },
      },
    });

    // FCM push
    if (pet.owner.fcmToken) {
      await this.handlePush({
        token: pet.owner.fcmToken,
        title,
        body,
        data: { type: 'PET_SCANNED', petId: pet.id },
      });
    }
  }

  // ── Sighting ───────────────────────────────────────────────────────────────

  private async handleSighting(data: SightingJobData) {
    const owner = await this.prisma.user.findUnique({
      where: { id: data.ownerId },
      select: { fcmToken: true, email: true, name: true },
    });

    if (!owner) return;

    const title = `New sighting of ${data.petName}!`;
    const body = `Someone reported seeing ${data.petName}${data.address ? ` near ${data.address}` : ''}`;

    await this.prisma.notification.create({
      data: {
        userId: data.ownerId,
        type: NotificationType.SIGHTING_REPORTED,
        title,
        body,
        data: { reportId: data.reportId, petName: data.petName },
      },
    });

    if (owner.fcmToken) {
      await this.handlePush({
        token: owner.fcmToken,
        title,
        body,
        data: { type: 'SIGHTING_REPORTED', reportId: data.reportId },
      });
    }

    // Also send email for sightings (high importance)
    if (owner.email) {
      await this.sendEmail({
        to: owner.email,
        subject: `[PetID] ${title}`,
        html: `
          <h2>${title}</h2>
          <p>${body}</p>
          <p><a href="${this.config.get('FRONTEND_URL')}/lost-pets">View the report →</a></p>
        `,
      });
    }
  }

  // ── Email Verification ────────────────────────────────────────────────────

  private async handleEmailVerification(data: { userId: string; token: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });
    if (!user) return;

    const url = `${this.config.get('FRONTEND_URL')}/auth/verify-email?token=${data.token}`;
    await this.sendEmail({
      to: user.email,
      subject: 'Verify your PetID email address',
      html: `
        <h2>Welcome to PetID, ${user.name}!</h2>
        <p>Please verify your email address to activate your account:</p>
        <p><a href="${url}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    });
  }

  // ── Password Reset ────────────────────────────────────────────────────────

  private async handlePasswordReset(data: { userId: string; token: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });
    if (!user) return;

    const url = `${this.config.get('FRONTEND_URL')}/auth/reset-password?token=${data.token}`;
    await this.sendEmail({
      to: user.email,
      subject: 'Reset your PetID password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${url}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">Reset Password</a></p>
        <p>If you didn't request this, ignore this email — your password won't change.</p>
      `,
    });
  }

  // ── Subscription Expiring ─────────────────────────────────────────────────

  private async handleSubscriptionExpiring(data: { userId: string; daysLeft: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true, fcmToken: true },
    });
    if (!user) return;

    const title = `Your PetID subscription expires in ${data.daysLeft} day${data.daysLeft !== 1 ? 's' : ''}`;

    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: NotificationType.SUBSCRIPTION_EXPIRING,
        title,
        body: 'Renew now to keep your pets protected.',
      },
    });

    if (user.email) {
      await this.sendEmail({
        to: user.email,
        subject: `[PetID] ${title}`,
        html: `
          <h2>${title}</h2>
          <p>Hi ${user.name}, your PetID subscription will expire soon.</p>
          <p><a href="${this.config.get('FRONTEND_URL')}/settings/billing">Renew Subscription →</a></p>
        `,
      });
    }

    if (user.fcmToken) {
      await this.handlePush({ token: user.fcmToken, title, body: 'Tap to renew.' });
    }
  }

  // ── Email helper ──────────────────────────────────────────────────────────

  private async sendEmail(opts: { to: string; subject: string; html: string }) {
    if (!this.resend) {
      this.logger.warn('Resend not configured, skipping email');
      return;
    }
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.name} [${job.id}] failed after ${job.attemptsMade} attempts: ${error.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.name} [${job.id}] completed`);
  }
}
