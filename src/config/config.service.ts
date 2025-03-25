import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string | undefined };

  constructor() {
    this.envConfig = process.env;
  }

  get(key: string, defaultValue?: string): string {
    return this.envConfig[key] || defaultValue || '';
  }

  get customerServiceUrl(): string {
    return this.get('CUSTOMER_SERVICE_URL', 'http://localhost:3001');
  }

  get inventoryServiceUrl(): string {
    return this.get('INVENTORY_SERVICE_URL', 'http://localhost:3002');
  }

  get logLevel(): string {
    return this.get('LOG_LEVEL', 'info');
  }

  get nodeEnv(): string {
    return this.get('NODE_ENV', 'development');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
