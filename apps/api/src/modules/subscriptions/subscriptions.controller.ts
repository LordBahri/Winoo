import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('Subscriptions')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List all available subscription plans' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiOperation({ summary: 'Get current subscription and plan details' })
  getMy(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Create a Stripe Checkout session for a plan' })
  createCheckout(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckoutDto) {
    return this.subscriptionsService.createCheckoutSession(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('portal')
  @ApiOperation({ summary: 'Create a Stripe Billing Portal session' })
  createPortal(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.createPortalSession(user.id);
  }

  /**
   * Stripe webhook — must receive raw body for signature verification.
   * Ensure Nginx / Express does NOT parse this route's body as JSON.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint (raw body required)' })
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    // rawBody is attached by the bodyParser.raw middleware in main.ts
    const rawBody = (req as any).rawBody as Buffer;
    await this.subscriptionsService.handleWebhook(rawBody, signature);
    res.json({ received: true });
  }
}
