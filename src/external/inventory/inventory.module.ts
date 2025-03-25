import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InventoryService } from './inventory.service';
import { LoggerModule } from '../../logger/logger.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [LoggerModule, ConfigModule, HttpModule],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
