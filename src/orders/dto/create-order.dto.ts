import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, IsUUID, IsArray, ValidateNested, ArrayMinSize, IsInt, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}

/**
 * Create Order DTO
 * 
 * This DTO is used to create a new order.
 * CreateOrder contains the customerId and the items (OrderItemDtos) in the order.
 * 
 */
export class CreateOrderDto {
  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
