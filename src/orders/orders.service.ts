import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IOrderRepository } from './repositories/order-repository.interface';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CustomerService } from '../external/customer/customer.service';
import { InventoryService } from '../external/inventory/inventory.service';
import { MessagingService, QueueEvents } from '../messaging/messaging.service';
import { OrderStatus } from './entities/order-status.enum';
import { Logger } from '../logger/logger.service';
import { v4 as uuidv4 } from 'uuid';
import { ORDER_STATUS_TRANSITIONS } from './constants/order-status-transition';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly customerService: CustomerService,
    private readonly inventoryService: InventoryService,
    private readonly messagingService: MessagingService,
    private readonly logger: Logger,)
  {this.logger.setContext('OrdersService');}

  /**
   * Find all orders
   * Filter by customerId and status
   * TODO: add pagination
   */
  async findAll(customerId?: string, status?: string): Promise<Order[]> {
    let orders = await this.orderRepository.findAll();

    if (customerId) {
      orders = orders.filter(order => order.customerId === customerId);
    }

    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    return orders;
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepository.findById(id);
  }

  /**
   * Create an order
   * Validate customer exists
   * Validate products and check inventory
   * Calculate total price
   * Save order
   * Publish order created event
   */
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      const customer = await this.customerService.getCustomerById(createOrderDto.customerId);
      if (!customer) {
        throw new BadRequestException(`Customer with ID ${createOrderDto.customerId} not found`);
      }

      // Validate products and check inventory
      for (const item of createOrderDto.items) {
        const product = await this.inventoryService.getProductById(item.productId);
        if (!product) {
          throw new BadRequestException(`Product with ID ${item.productId} not found`);
        }

        const inventory = await this.inventoryService.getInventory(item.productId);
        if (inventory < item.quantity) {
          throw new BadRequestException(
            `Insufficient inventory for product ${item.productId}. Requested: ${item.quantity}, Available: ${inventory}`,
          );
        }
      }

      const totalPrice = await this.calculateTotalPrice(createOrderDto.items);

      const newOrder = this.createOrderWithOrderItems(createOrderDto.customerId, createOrderDto.items, totalPrice);

      // update inventory (in real life, this might use transactions)
      for (const item of createOrderDto.items) {
        await this.inventoryService.reserveInventory(item.productId, item.quantity);
      }

      // "persist" the order
      const savedOrder = await this.orderRepository.create(newOrder);
      
      // publish order created event
      await this.publishOrderEvent(OrderStatus.CREATED, savedOrder);
      
      return savedOrder;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order | null> {
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      return null;
    }

    // Only allow updates if order is not delivered or canceled
    if (
      existingOrder.status === OrderStatus.DELIVERED || 
      existingOrder.status === OrderStatus.CANCELED
    ) {
      throw new BadRequestException(`Cannot update order with status ${existingOrder.status}`);
    }

    // Update properties
    const { items, ...restUpdateData } = updateOrderDto;
    
    // Process items separately if they exist
    let processedItems: OrderItem[] | undefined;
    if (items) {
      processedItems = items.map(item => ({
        ...item,
        id: uuidv4(),
      }));
    }
    
    const updatedOrder: Partial<Order> = {
      ...restUpdateData,
      ...(processedItems && { items: processedItems }),
      updatedAt: new Date(),
    };

    // Update the order
    const result = await this.orderRepository.update(id, updatedOrder);
    
    if (result) {
      // Publish order updated event
      await this.messagingService.publishEvent(QueueEvents.ORDER_UPDATED, result);
      this.logger.log(`Published order updated event for order ${result.id}`);
    }
    
    return result;
  }

  async updateShipping(id: string, updateShippingDto: UpdateShippingDto): Promise<Order | null> {
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      return null;
    }

    if (existingOrder.status === OrderStatus.CANCELED) {
      throw new BadRequestException('Cannot update shipping for a canceled order');
    }

    const updatedOrder: Partial<Order> = {
      shippingInfo: updateShippingDto,
      updatedAt: new Date(),
    };

    // Update the order with shipping info
    const result = await this.orderRepository.update(id, updatedOrder);
    
    if (result) {
      // Publish order shipped event
      await this.publishOrderEvent(OrderStatus.SHIPPED, result);
    }
    
    return result;
  }

  /**
   * Update the status of an order
   * Validation of status transition
   * Inventory adjustments
   * Publish order event
   */
  async updateStatus(id: string, updateStatusDto: UpdateStatusDto): Promise<Order | null> {
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      return null;
    }

    this.validateStatusTransition(existingOrder.status, updateStatusDto.status);

    if (updateStatusDto.status === OrderStatus.CANCELED) {
      for (const item of existingOrder.items) {
        await this.inventoryService.releaseInventory(item.productId, item.quantity);
      }
    // Right now, the only allowed transition is from canceled to processing but this could be extended, so checking for the updated status here
    } else if (existingOrder.status === OrderStatus.CANCELED && updateStatusDto.status === OrderStatus.PROCESSING) {
      // see if we can reactivate the order
      for (const item of existingOrder.items) {
        const inventory = await this.inventoryService.getInventory(item.productId);
        if (inventory < item.quantity) {
          throw new BadRequestException(
            `Cannot reactivate order. Insufficient inventory for product ${item.productId}`,
          );
        }
        await this.inventoryService.reserveInventory(item.productId, item.quantity);
      }
    }

    const updatedOrder: Partial<Order> = {
      status: updateStatusDto.status,
      updatedAt: new Date(),
    };

    // Update the order status
    const result = await this.orderRepository.update(id, updatedOrder);
    
    if (result) {
      // Publish order event based on new status
      await this.publishOrderEvent(updateStatusDto.status, result);
      
      // If event impacts inventory, publish inventory events
      if (updateStatusDto.status === OrderStatus.CANCELED) {
        for (const item of result.items) {
          await this.publishInventoryEvent(QueueEvents.INVENTORY_RELEASED, item.productId, item.quantity);
        }
      } else if (existingOrder.status === OrderStatus.CANCELED && updateStatusDto.status === OrderStatus.PROCESSING) {
        for (const item of result.items) {
          await this.publishInventoryEvent(QueueEvents.INVENTORY_RESERVED, item.productId, item.quantity);
        }
      }
    }
    
    return result;
  }

  /**
   * Remove an order
   * Release inventory - synchronously release inventory so that inventory is hopefully immediately available for other orders
   * Publish order event - so other services can deal with the order being removed like in analytics, notification services, etc.
   */
  async remove(id: string): Promise<boolean> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      return false;
    }

    // If order is canceled, release inventory
    if (order.status === OrderStatus.CANCELED) {
      for (const item of order.items) {
        await this.inventoryService.releaseInventory(item.productId, item.quantity);
        
        // Publish inventory release event
        await this.publishInventoryEvent(QueueEvents.INVENTORY_RELEASED, item.productId, item.quantity);
      }
    }

    const result = await this.orderRepository.delete(id);
    
    if (result) {
      const updatedOrder = { ...order!, status: OrderStatus.CANCELED, updatedAt: new Date()};
      await this.publishOrderEvent(OrderStatus.CANCELED, updatedOrder);
    }
    
    return result;
  }

  private async calculateTotalPrice(items: { productId: string; quantity: number }[]): Promise<number> {
    let totalPrice = 0;
    for (const item of items) {
      const product = await this.inventoryService.getProductById(item.productId);
      if (product) {
        totalPrice += product.price * item.quantity;
      } else {
        throw new BadRequestException(`Product ${item.productId} not found when calculating price`);
      }
    }
    return totalPrice;
  }

  private createOrderWithOrderItems(customerId: string, items: { productId: string; quantity: number }[], totalPrice: number): Order {
    return {
      id: uuidv4(),
      customerId,
      items: items.map(item => ({
        ...item,
        id: uuidv4(),
      })),
      totalPrice: totalPrice,
      status: OrderStatus.PROCESSING,
      createdAt: new Date(),
      updatedAt: new Date(),
      shippingInfo: null,
    };
  }

  private async publishInventoryEvent(eventType: QueueEvents, productId: string, quantity: number): Promise<void> {
    await this.messagingService.publishEvent(eventType, {
      productId,
      quantity,
    });
    this.logger.log(`Published ${eventType} event for product ${productId} with quantity ${quantity}`);
  }

  private async publishOrderEvent (status: OrderStatus, order: Order): Promise<void> {
    let eventType: QueueEvents;
    switch (status) {
      case OrderStatus.CREATED:
        eventType = QueueEvents.ORDER_CREATED;
        break;
      case OrderStatus.SHIPPED:
        eventType = QueueEvents.ORDER_SHIPPED;
        break;
      case OrderStatus.DELIVERED:
        eventType = QueueEvents.ORDER_DELIVERED;
        break;
      case OrderStatus.CANCELED:
        eventType = QueueEvents.ORDER_CANCELED;
        break;
      default:
        eventType = QueueEvents.ORDER_UPDATED;
    }

    await this.messagingService.publishEvent(eventType, { order });

    this.logger.log(`Published ${status} event for order ${order.id}`);
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    if (!ORDER_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}