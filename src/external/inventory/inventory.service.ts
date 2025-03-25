import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProductDto } from './dto/product.dto';
import { Logger } from '../../logger/logger.service';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class InventoryService {
  private readonly baseUrl: string;
  private readonly inventoryCache: Map<string, number> = new Map();
  
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.logger.setContext('InventoryService');
    this.baseUrl = this.configService.inventoryServiceUrl;
    
    // Pre-populate mock inventory for demo purposes
    this.setupMockInventory();
  }

  /**
   * Get product details by ID from the Inventory Service
   * 
   * Note: This is currently mocked for demonstration purposes.
   * In a real implementation, this would call the actual Inventory Service API.
   */
  async getProductById(id: string): Promise<ProductDto | null> {
    try {
      this.logger.log(`Fetching product with ID: ${id}`);

      const useRealApi = this.configService.get('USE_REAL_INVENTORY_API', 'false') === 'true';
      
      if (useRealApi) {
        try {
          const response = await firstValueFrom(this.httpService.get<ProductDto>(`${this.baseUrl}/products/${id}`));
          return response.data;
        } catch (apiError: any) {
          if (apiError.response && apiError.response.status === 404) {
            this.logger.warn(`Product with ID ${id} not found in external service`);
            return null;
          }
          this.logger.error(`API error fetching product with ID ${id}: ${apiError.message}`, apiError.stack || '');
          throw apiError;
        }
      } else {
        this.logger.log('Using mock product data (USE_REAL_INVENTORY_API=false)');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (id === '00000000-0000-0000-0000-000000000000') {
          return null;
        }
        
        if (id === '123e4567-e89b-12d3-a456-426614174003') {
          return {
            id,
            name: 'Test Product 123e45',
            description: 'This is a stable test product for order testing',
            price: 49.99,
            weight: 1.5,
            dimensions: {
              length: 10,
              width: 5,
              height: 2,
            },
            sku: 'SKU-TEST-123e45',
            category: 'Electronics',
          };
        }
        
        return {
          id,
          name: `Product ${id.substring(0, 6)}`,
          description: `This is a description for product ${id.substring(0, 6)}`,
          price: 29.99 + Math.random() * 100,
          weight: 1.5,
          dimensions: {
            length: 10,
            width: 5,
            height: 2,
          },
          sku: `SKU-${id.substring(0, 6)}`,
          category: 'Electronics',
        };
      }
    } catch (error: any) {
      this.logger.error(
        `Error fetching product with ID ${id}: ${error.message}`, 
        error.stack || ''
      );
      
      // In case of general errors, rethrow after logging
      throw error;
    }
  }

  /**
   * Get current inventory level for a product
   */
  async getInventory(productId: string): Promise<number> {
    try {
      this.logger.log(`Checking inventory for product ID: ${productId}`);

      const useRealApi = this.configService.get('USE_REAL_INVENTORY_API', 'false') === 'true';
      
      if (useRealApi) {
        try {
          const response = await firstValueFrom(this.httpService.get<{ quantity: number }>(`${this.baseUrl}/inventory/${productId}`));
          return response.data.quantity;
        } catch (apiError: any) {
          if (apiError.response && apiError.response.status === 404) {
            this.logger.warn(`Inventory for product ID ${productId} not found in external service`);
            return 0;
          }
          this.logger.error(`API error checking inventory for product ${productId}: ${apiError.message}`, apiError.stack || '');
          throw apiError;
        }
      } else {
        this.logger.log('Using mock inventory data (USE_REAL_INVENTORY_API=false)');
        await new Promise(resolve => setTimeout(resolve, 50));
        
        return this.inventoryCache.get(productId) || 0;
      }
    } catch (error: any) {
      this.logger.error(`Error checking inventory for product ${productId}: ${error.message}`, error.stack || '');
      throw error;
    }
  }

  /**
   * Reserve inventory for a product (reduce available quantity)
   */
  async reserveInventory(productId: string, quantity: number): Promise<boolean> {
    try {
      this.logger.log(`Reserving ${quantity} units of product ID: ${productId}`);

      const useRealApi = this.configService.get('USE_REAL_INVENTORY_API', 'false') === 'true';
      
      if (useRealApi) {
        try {
          const response = await firstValueFrom(this.httpService.post<{ success: boolean }>(`${this.baseUrl}/inventory/${productId}/reserve`, { quantity }));
          return response.data.success;
        } catch (apiError: any) {
          if (apiError.response && apiError.response.status === 400) {
            this.logger.warn(`Cannot reserve ${quantity} units of product ${productId}: insufficient inventory`);
            return false;
          }
          this.logger.error(`API error reserving inventory for product ${productId}: ${apiError.message}`, apiError.stack || '');
          throw apiError;
        }
      } else {
        this.logger.log('Using mock inventory reservation (USE_REAL_INVENTORY_API=false)');
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const currentInventory = this.inventoryCache.get(productId) || 0;
        if (currentInventory < quantity) {
          return false;
        }
        
        this.inventoryCache.set(productId, currentInventory - quantity);
        return true;
      }
    } catch (error: any) {
      this.logger.error(
        `Error reserving inventory for product ${productId}: ${error.message}`, 
        error.stack || ''
      );
      throw error;
    }
  }

  /**
   * Release inventory for a product (increase available quantity)
   */
  async releaseInventory(productId: string, quantity: number): Promise<boolean> {
    try {
      this.logger.log(`Releasing ${quantity} units of product ID: ${productId}`);
      
      const useRealApi = this.configService.get('USE_REAL_INVENTORY_API', 'false') === 'true';
      
      if (useRealApi) {
        try {
          const response = await firstValueFrom(this.httpService.post<{ success: boolean }>(`${this.baseUrl}/inventory/${productId}/release`, { quantity }) );
          return response.data.success;
        } catch (apiError: any) {
          this.logger.error(`API error releasing inventory for product ${productId}: ${apiError.message}`, apiError.stack || '');
          throw apiError;
        }
      } else {
        this.logger.log('Using mock inventory release (USE_REAL_INVENTORY_API=false)');
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const currentInventory = this.inventoryCache.get(productId) || 0;
        this.inventoryCache.set(productId, currentInventory + quantity);
        
        return true;
      }
    } catch (error: any) {
      this.logger.error(
        `Error releasing inventory for product ${productId}: ${error.message}`, 
        error.stack || ''
      );
      throw error;
    }
  }

  /**
   * Setup mock inventory for demonstration purposes
   */
  private setupMockInventory(): void {
    const productIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174001',
      '323e4567-e89b-12d3-a456-426614174002',
      '523e4567-e89b-12d3-a456-426614174004',
      '923e4567-e89b-12d3-a456-426614174005',
      '923e4567-e89b-12d3-a456-426614174006',
      '823e4567-e89b-12d3-a456-426614174007',
      '923e4567-e89b-12d3-a456-426614174008',
      'a23e4567-e89b-12d3-a456-426614174009',
      'b23e4567-e89b-12d3-a456-426614174010',
      'c23e4567-e89b-12d3-a456-426614174011',
      'd23e4567-e89b-12d3-a456-426614174012'
    ];
    
    // Set random inventory levels
    productIds.forEach(id => {
      this.inventoryCache.set(id, Math.floor(Math.random() * 100) + 10);
    });
    
    // Set specific inventory for the product ID we used in testing
    this.inventoryCache.set('123e4567-e89b-12d3-a456-426614174003', 20);
    
    // Set one product with limited inventory for testing
    this.inventoryCache.set('623e4567-e89b-12d3-a456-426614174005', 3);
    
    // One product with zero inventory
    this.inventoryCache.set('723e4567-e89b-12d3-a456-426614174006', 0);
  }
}
