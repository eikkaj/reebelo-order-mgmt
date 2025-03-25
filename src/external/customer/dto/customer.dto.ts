import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ example: '123 Main St' })
  street: string;

  @ApiProperty({ example: 'Anytown' })
  city: string;

  @ApiProperty({ example: 'CA' })
  state: string;

  @ApiProperty({ example: '90210' })
  zipCode: string;

  @ApiProperty({ example: 'USA' })
  country: string;
}

export class CustomerDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty()
  address: AddressDto;

  @ApiProperty({ example: '+1-555-123-4567' })
  phone: string;

  @ApiProperty({ example: '2023-04-10T14:30:00Z' })
  createdAt: string;
}
