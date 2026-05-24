import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { QUEUES } from '../queue/queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.NOTIFICATIONS })],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
