import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Update Order DTO
 * 
 * This DTO is used to update an order.
 * Extends CreateOrderDto.
 * 
 */
export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    description: 'Additional notes for the order',
    example: 'Please deliver to the back door',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
