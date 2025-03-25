import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderRepository } from './repositories/order.repository';
import { CustomerModule } from '../external/customer/customer.module';
import { InventoryModule } from '../external/inventory/inventory.module';
import { LoggerModule } from '../logger/logger.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [CustomerModule, InventoryModule, LoggerModule, MessagingModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: 'IOrderRepository',
      useClass: OrderRepository,
    },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
