import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logger/logger.service';
import * as amqplib from 'amqplib';

// Define types for connection and channel
interface AmqpConnection {
  close(): Promise<void>;
  createChannel(): Promise<AmqpChannel>;
  on(event: string, listener: (error: any) => void): void;
}

interface AmqpChannel {
  close(): Promise<void>;
  assertExchange(exchange: string, type: string, options?: any): Promise<any>;
  assertQueue(queue: string, options?: any): Promise<any>;
  bindQueue(queue: string, exchange: string, pattern: string): Promise<any>;
  publish(exchange: string, routingKey: string, content: Buffer, options?: any): boolean;
  consume(queue: string, onMessage: (msg: any) => void, options?: any): Promise<any>;
  ack(message: any): void;
  nack(message: any, allUpTo?: boolean, requeue?: boolean): void;
}

// Define event types for the messaging system
export enum QueueEvents {
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELED = 'order.canceled',
  INVENTORY_RESERVED = 'inventory.reserved',
  INVENTORY_RELEASED = 'inventory.released',
}

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private connection: AmqpConnection;
  private channel: AmqpChannel;
  private readonly amqpUrl: string;
  private readonly exchangeName = 'order_exchange';
  private isConnected = false;
  
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext('MessagingService');
    this.amqpUrl = this.configService.get('AMQP_URL', 'amqp://localhost:5672');
  }
  
  async onModuleInit() {
    this.logger.log('Initializing messaging service');
    await this.connect();
  }
  
  async onModuleDestroy() {
    this.logger.log('Cleaning up messaging resources');
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error: any) {
      this.logger.error(`Error during cleanup: ${error.message}`, error.stack || '');
    }
  }
  
  // Connect to RabbitMQ
  async connect(): Promise<void> {
    try {
      this.logger.log(`Connecting to message broker at ${this.amqpUrl}`);
      
      // In a real environment, we would connect to RabbitMQ:
      // this.connection = await amqplib.connect(this.amqpUrl);
      // this.channel = await this.connection.createChannel();
      
      // For demonstration/development purposes, we'll mock the connection
      // This allows the service to run without an actual RabbitMQ instance
      const mockConnection = this.configService.get('USE_REAL_MESSAGE_BROKER', 'false') === 'true';
      
      if (mockConnection) {
        this.connection = await amqplib.connect(this.amqpUrl);
        this.channel = await this.connection.createChannel();
      } else {
        this.logger.log('Using mock message broker (USE_REAL_MESSAGE_BROKER=false)');
        // Mock the connection and channel
        // This prevents errors when no RabbitMQ is available
      }
      
      // Setup error handling for real connections
      if (this.connection) {
        this.connection.on('error', (err: Error) => {
          this.isConnected = false;
          this.logger.error(`Connection error: ${err.message}`, err.stack || '');
          setTimeout(() => this.connect(), 5000);
        });
      }
      
      this.isConnected = true;
      this.logger.log('Successfully connected to message broker');
    } catch (error: any) {
      this.isConnected = false;
      this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`, error.stack || '');
      // Attempt to reconnect after a delay
      setTimeout(() => this.connect(), 5000);
    }
  }

  // Publish a message to the exchange with a routing key
  async publishEvent<T>(routingKey: string, data: T): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Not connected to message broker, attempting to reconnect...');
        await this.connect();
      }
      
      // If using a mock connection, just log the event but consider it successful
      if (!this.channel) {
        this.logger.log(`[MOCK] Published message to ${routingKey}: ${JSON.stringify(data)}`);
        return true;
      }
      
      const success = this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
      );
      
      this.logger.log(`Published message to ${routingKey}: ${JSON.stringify(data)}`);
      return success;
    } catch (error: any) {
      this.logger.error(
        `Failed to publish message to ${routingKey}: ${error.message}`,
        error.stack || '',
      );
      return false;
    }
  }

  // Subscribe to a queue for a specific routing key pattern
  async subscribeToQueue(
    queueName: string, 
    routingPattern: string,
    onMessage: (msg: any) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Not connected to message broker, attempting to reconnect...');
        await this.connect();
      }
      
      // If using a mock connection, just log the subscription but don't try to set up anything
      if (!this.channel) {
        this.logger.log(`[MOCK] Subscribed to queue ${queueName} with routing pattern ${routingPattern}`);
        return;
      }
      
      // Assert queue exists
      await this.channel.assertQueue(queueName, { durable: true });
      
      // Bind queue to exchange with routing pattern
      await this.channel.bindQueue(queueName, this.exchangeName, routingPattern);
      
      // Consume messages
      this.channel.consume(queueName, async (msg: amqplib.ConsumeMessage | null) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            this.logger.log(`Received message from ${queueName}: ${JSON.stringify(content)}`);
            
            await onMessage(content);
            
            // Acknowledge the message
            this.channel.ack(msg);
          } catch (error: any) {
            this.logger.error(
              `Error processing message from ${queueName}: ${error.message}`,
              error.stack || '',
            );
            // Reject the message and requeue
            this.channel.nack(msg, false, true);
          }
        }
      });
      
      this.logger.log(`Subscribed to queue ${queueName} with routing pattern ${routingPattern}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to subscribe to queue ${queueName}: ${error.message}`,
        error.stack || '',
      );
    }
  }
}