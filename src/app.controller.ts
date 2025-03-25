import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from './common/dto/api-response.dto';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Returns service health and information',
    type: Object,
  })
  healthCheck(): ApiResponseDto<{ status: string; service: string; version: string }> {
    return ApiResponseDto.success(
      {
        status: 'healthy',
        service: 'order-management-service',
        version: '1.0.0',
      },
      'Order Management Service is running',
    );
  }
}