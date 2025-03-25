import { Module, Global } from '@nestjs/common';
import { Logger } from './logger.service';
import { ConfigModule } from '../config/config.module';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [Logger],
  exports: [Logger],
})
export class LoggerModule {}
