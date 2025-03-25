import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';
import { UpdateShippingDto } from '../dto/update-shipping.dto';

export class Order {
  @ApiProperty({
    description: 'Unique identifier for the order',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  customerId: string;

  @ApiProperty({
    description: 'Order items',
    type: [OrderItem],
  })
  items: OrderItem[];

  @ApiProperty({
    description: 'Total price of the order',
    example: 129.99,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Current status of the order',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Date and time when the order was created',
    example: '2023-04-10T14:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date and time when the order was last updated',
    example: '2023-04-10T15:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Shipping information',
    type: UpdateShippingDto,
    nullable: true,
  })
  shippingInfo: UpdateShippingDto | null;

  @ApiProperty({
    description: 'Additional notes for the order',
    example: 'Please deliver to the back door',
    nullable: true,
  })
  notes?: string;
}
