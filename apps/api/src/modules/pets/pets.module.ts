import { Module } from '@nestjs/common';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { StorageService } from '../../config/storage.service';

@Module({
  controllers: [PetsController],
  providers: [PetsService, StorageService],
  exports: [PetsService],
})
export class PetsModule {}
