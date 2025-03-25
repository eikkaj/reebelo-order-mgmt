import { ApiProperty } from '@nestjs/swagger';

export class DimensionsDto {
  @ApiProperty({ example: 10 })
  length: number;

  @ApiProperty({ example: 5 })
  width: number;

  @ApiProperty({ example: 2 })
  height: number;
}

export class ProductDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Wireless Headphones' })
  name: string;

  @ApiProperty({ example: 'High-quality wireless headphones with noise cancellation' })
  description: string;

  @ApiProperty({ example: 129.99 })
  price: number;

  @ApiProperty({ example: 0.5 })
  weight: number;

  @ApiProperty()
  dimensions: DimensionsDto;

  @ApiProperty({ example: 'WH-1000XM4' })
  sku: string;

  @ApiProperty({ example: 'Electronics' })
  category: string;
}
