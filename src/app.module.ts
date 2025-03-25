import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { OrdersModule } from './orders/orders.module';
import { CustomerModule } from './external/customer/customer.module';
import { InventoryModule } from './external/inventory/inventory.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    OrdersModule,
    CustomerModule,
    InventoryModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  // TODO: could configure some kind of middlewareconsumer here
}