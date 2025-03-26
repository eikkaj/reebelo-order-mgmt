import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CustomerDto } from './dto/customer.dto';
import { Logger } from '../../logger/logger.service';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class CustomerService {
  private readonly baseUrl: string;
  
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.logger.setContext('CustomerService');
    this.baseUrl = this.configService.customerServiceUrl;
  }

  /**
   * Fetch customer details by ID from the Customer Service
   * 
   * Note: This is currently mocked for demonstration purposes.
   * In a real implementation, this would call the actual Customer Service API.
   */
  async getCustomerById(id: string): Promise<CustomerDto | null> {
    try {
      this.logger.log(`Fetching customer with ID: ${id}`);
      
      // Check if we should use the real API or mock data
      const useRealApi = this.configService.get('USE_REAL_CUSTOMER_API', 'false') === 'true';
      
      if (useRealApi) {
        try {
          const response = await firstValueFrom(
            this.httpService.get<CustomerDto>(`${this.baseUrl}/customers/${id}`)
          );
          return response.data;
        } catch (apiError: any) {
          if (apiError.response && apiError.response.status === 404) {
            this.logger.warn(`Customer with ID ${id} not found in external service`);
            return null;
          }
          this.logger.error(
            `API error fetching customer with ID ${id}: ${apiError.message}`, 
            apiError.stack || ''
          );
          throw apiError;
        }
      } else {
        this.logger.log('Using mock customer data (USE_REAL_CUSTOMER_API=false)');
        await new Promise(resolve => setTimeout(resolve, 100));

        if (id === '00000000-0000-0000-0000-000000000000') {
          return null;
        }
        
        return {
          id,
          name: `Customer ${id.substring(0, 6)}`,
          email: `customer-${id.substring(0, 6)}@example.com`,
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '90210',
            country: 'USA',
          },
          phone: '+1-555-123-4567',
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error: any) {
      this.logger.error(
        `Error fetching customer with ID ${id}: ${error.message}`, 
        error.stack || ''
      );
      
      // Generic error handling, could be improved upon greatly
      throw error;
    }
  }
}
