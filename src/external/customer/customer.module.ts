import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomerService } from './customer.service';
import { LoggerModule } from '../../logger/logger.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [
    LoggerModule, 
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
