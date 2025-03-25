import { ApiProperty } from '@nestjs/swagger';

export class OrderItem {
  @ApiProperty({
    description: 'Unique identifier for the order item',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
  })
  quantity: number;
}
