import { OrderStatus } from '../entities/order-status.enum';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
  [OrderStatus.DELIVERED]: [], // Terminal state
  [OrderStatus.CANCELED]: [OrderStatus.PROCESSING], // Allow reactivation
  [OrderStatus.CREATED]: [OrderStatus.PROCESSING],
}; 