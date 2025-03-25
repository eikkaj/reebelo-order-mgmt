import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../entities/order-status.enum';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.SHIPPED,
  })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({
    description: 'Reason for status change',
    example: 'Customer requested cancellation',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  statusReason?: string;
}
