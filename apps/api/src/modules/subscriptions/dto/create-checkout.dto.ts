import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Subscription plan ID (UUID)' })
  planId: string;

  @ApiProperty({ enum: BillingInterval, default: BillingInterval.MONTHLY })
  @IsEnum(BillingInterval)
  interval: BillingInterval = BillingInterval.MONTHLY;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  yearly?: boolean;
}
