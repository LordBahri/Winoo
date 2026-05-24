import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NfcTagsController } from './nfc-tags.controller';
import { NfcTagsService } from './nfc-tags.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
    BullModule.registerQueue({ name: 'geo' }),
  ],
  controllers: [NfcTagsController],
  providers: [NfcTagsService],
  exports: [NfcTagsService],
})
export class NfcTagsModule {}
