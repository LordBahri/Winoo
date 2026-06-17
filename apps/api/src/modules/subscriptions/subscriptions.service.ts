import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { CreateCheckoutDto, BillingInterval } from './dto/create-checkout.dto';
import { AuthUser } from '../../common/types/auth-user.type';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { HttpStatus } from '@nestjs/common';
import { QUEUES, NOTIFICATION_JOBS } from '../queue/queue.constants';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly stripe: Stripe;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUES.NOTIFICATIONS) private readonly notifQueue: Queue,
  ) {
    this.stripe = new Stripe(config.get<string>('STRIPE_SECRET_KEY', ''), {
      apiVersion: '2024-06-20',
    });
    this.frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  // ── Plan catalog ───────────────────────────────────────────────────────────

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  // ── Checkout ───────────────────────────────────────────────────────────────

  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) {
      throw new ApiException({
        code: ErrorCodes.PLAN_NOT_FOUND,
        message: 'Subscription plan not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, stripeCustomerId: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Get or create Stripe customer
    const customerId = await this.getOrCreateCustomer(userId, user);

    const priceId =
      dto.interval === BillingInterval.YEARLY
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new ApiException({
        code: ErrorCodes.PLAN_NOT_FOUND,
        message: 'This billing interval is not configured for the selected plan',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/settings/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/settings/billing?canceled=1`,
      metadata: { userId, planId: plan.id },
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId, planId: plan.id },
      },
      allow_promotion_codes: true,
    });

    return { checkoutUrl: session.url };
  }

  // ── Customer Portal ────────────────────────────────────────────────────────

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new ApiException({
        code: ErrorCodes.SUBSCRIPTION_ALREADY_ACTIVE,
        message: 'No billing account found. Purchase a subscription first.',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.frontendUrl}/settings/billing`,
    });

    return { portalUrl: session.url };
  }

  // ── Stripe Webhook Handler ─────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new ApiException({
        code: ErrorCodes.STRIPE_WEBHOOK_INVALID,
        message: `Webhook signature verification failed: ${(err as Error).message}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.onPaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  // ── Current subscription ───────────────────────────────────────────────────

  async getMySubscription(userId: string) {
    return this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async getOrCreateCustomer(
    userId: string,
    user: { email: string; name: string; stripeCustomerId: string | null },
  ): Promise<string> {
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription') return;

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    if (!userId || !planId) return;

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    await this.upsertSubscription(userId, planId, subscription);
  }

  private async onSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    const planId = subscription.metadata?.planId;
    if (!userId || !planId) return;
    await this.upsertSubscription(userId, planId, subscription);
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.prisma.userSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'CANCELED', cancelAtPeriodEnd: false },
    });
  }

  private async onPaymentFailed(invoice: Stripe.Invoice) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!customerId) return;

    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (!user) return;

    await this.prisma.userSubscription.updateMany({
      where: { userId: user.id },
      data: { status: 'PAST_DUE' },
    });
  }

  private async upsertSubscription(
    userId: string,
    planId: string,
    subscription: Stripe.Subscription,
  ) {
    const statusMap: Record<Stripe.Subscription.Status, 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID'> = {
      active: 'ACTIVE',
      trialing: 'TRIALING',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      incomplete: 'PAST_DUE',
      incomplete_expired: 'CANCELED',
      unpaid: 'UNPAID',
      paused: 'CANCELED',
    };

    await this.prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: statusMap[subscription.status] ?? 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : undefined,
      },
      update: {
        planId,
        status: statusMap[subscription.status] ?? 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }
}
