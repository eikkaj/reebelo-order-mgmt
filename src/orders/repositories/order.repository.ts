import { Injectable } from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { Logger } from '../../logger/logger.service';
import { IOrderRepository } from './order-repository.interface';

@Injectable()
export class OrderRepository implements IOrderRepository {
  private orders: Map<string, Order> = new Map<string, Order>();

  constructor(private readonly logger: Logger) {
    this.logger.setContext('OrderRepository');
  }

  async findAll(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.orders.get(id);
    return order || null;
  }

  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    this.logger.log(`Created order with ID: ${order.id}`);
    return order;
  }

  async update(id: string, orderData: Partial<Order>): Promise<Order | null> {
    const existingOrder = this.orders.get(id);
    
    if (!existingOrder) {
      return null;
    }

    const updatedOrder = {
      ...existingOrder,
      ...orderData,
      updatedAt: new Date(),
    };

    this.orders.set(id, updatedOrder);
    this.logger.log(`Updated order with ID: ${id}`);
    
    return updatedOrder;
  }

  async delete(id: string): Promise<boolean> {
    const result = this.orders.delete(id);
    
    if (result) {
      this.logger.log(`Deleted order with ID: ${id}`);
    }
    
    return result;
  }
}
