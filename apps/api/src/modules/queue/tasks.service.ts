import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { QUEUES, NOTIFICATION_JOBS } from './queue.constants';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.NOTIFICATIONS) private readonly notifQueue: Queue,
  ) {}

  /** Warn users whose subscription expires in 3 days. Runs daily at 09:00 UTC. */
  @Cron('0 9 * * *')
  async notifyExpiringSubscriptions() {
    this.logger.log('Running subscription expiry check');

    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // window: 2–3 days out

    const expiring = await this.prisma.userSubscription.findMany({
      where: {
        status: 'ACTIVE',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { gte: tomorrow, lte: in3Days },
      },
      select: { userId: true, currentPeriodEnd: true },
    });

    for (const sub of expiring) {
      const daysLeft = Math.ceil(
        (sub.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      await this.notifQueue.add(
        NOTIFICATION_JOBS.EMAIL_SUBSCRIPTION_EXPIRING,
        { userId: sub.userId, daysLeft },
        { jobId: `sub-expiry-${sub.userId}-${daysLeft}`, removeOnComplete: true },
      );
    }

    this.logger.log(`Queued expiry warnings for ${expiring.length} subscriptions`);
  }

  /** Auto-expire lost pet reports older than 90 days. Runs daily at 02:00 UTC. */
  @Cron('0 2 * * *')
  async expireOldLostReports() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const { count } = await this.prisma.lostPetReport.updateMany({
      where: { status: 'ACTIVE', createdAt: { lt: cutoff } },
      data: { status: 'EXPIRED' },
    });

    if (count > 0) {
      this.logger.log(`Expired ${count} old lost pet reports`);
    }
  }

  /** Clean up used/expired auth tokens to keep the table lean. Runs daily at 03:00 UTC. */
  @Cron('0 3 * * *')
  async cleanupExpiredTokens() {
    const [rt, ev, pr] = await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({
        where: { OR: [{ isRevoked: true }, { expiresAt: { lt: new Date() } }] },
      }),
      this.prisma.emailVerification.deleteMany({
        where: { OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }] },
      }),
      this.prisma.passwordReset.deleteMany({
        where: { OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }] },
      }),
    ]);

    this.logger.log(
      `Token cleanup: ${rt.count} refresh, ${ev.count} email verifications, ${pr.count} password resets deleted`,
    );
  }
}
