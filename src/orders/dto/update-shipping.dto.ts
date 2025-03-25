import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum ShippingCompany {
  UPS = 'UPS',
  FEDEX = 'FedEx',
  DHL = 'DHL',
  USPS = 'USPS',
  OTHER = 'Other',
}

export class UpdateShippingDto {
  @ApiProperty({
    description: 'Shipping tracking number',
    example: '1Z999AA10123456784',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  trackingNumber: string;

  @ApiProperty({
    description: 'Shipping company',
    enum: ShippingCompany,
    example: ShippingCompany.UPS,
  })
  @IsNotEmpty()
  @IsEnum(ShippingCompany)
  trackingCompany: ShippingCompany;

  @ApiProperty({
    description: 'Estimated delivery date',
    example: '2023-04-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  estimatedDelivery?: string;

  @ApiProperty({
    description: 'Additional shipping details',
    example: 'Signature required',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingNotes?: string;
}
