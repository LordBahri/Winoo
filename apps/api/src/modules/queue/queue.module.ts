import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './processors/notification.processor';
import { GeoProcessor } from './processors/geo.processor';
import { TasksService } from './tasks.service';
import { QUEUES } from './queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.NOTIFICATIONS }),
    BullModule.registerQueue({ name: QUEUES.GEO }),
  ],
  providers: [NotificationProcessor, GeoProcessor, TasksService],
  exports: [BullModule],
})
export class QueueModule {}
