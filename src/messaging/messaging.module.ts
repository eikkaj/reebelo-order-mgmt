import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { MessagingService } from './messaging.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}