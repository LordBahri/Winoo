import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [MemoryHealthIndicator],
})
export class HealthModule {}
