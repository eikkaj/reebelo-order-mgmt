import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';
import { CreateOrderDto } from '../src/orders/dto/create-order.dto';
import { UpdateOrderDto } from '../src/orders/dto/update-order.dto';
import { ShippingCompany, UpdateShippingDto } from '../src/orders/dto/update-shipping.dto';
import { UpdateStatusDto } from '../src/orders/dto/update-status.dto';
import { Order } from '../src/orders/entities/order.entity';
import { OrderStatus } from '../src/orders/entities/order-status.enum';
import { Logger } from '../src/logger/logger.service';
import { NotFoundException } from '@nestjs/common';

describe('OrdersController', () => {
  let controller: OrdersController;
  let mockOrdersService: Partial<OrdersService>;

  const mockOrder: Order = {
    id: 'test-order-id',
    customerId: 'customer-123',
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        quantity: 2
      }
    ],
    totalPrice: 100,
    status: OrderStatus.PROCESSING,
    createdAt: new Date(),
    updatedAt: new Date(),
    shippingInfo: null
  };

  beforeEach(async () => {
    mockOrdersService = {
      findAll: jest.fn().mockResolvedValue([mockOrder]),
      findById: jest.fn().mockResolvedValue(mockOrder),
      create: jest.fn().mockResolvedValue(mockOrder),
      update: jest.fn().mockResolvedValue(mockOrder),
      updateShipping: jest.fn().mockResolvedValue(mockOrder),
      updateStatus: jest.fn().mockResolvedValue(mockOrder),
      remove: jest.fn().mockResolvedValue(true)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            setContext: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const result = await controller.findAll('customer-123', OrderStatus.PROCESSING);
      expect(result.data).toEqual([mockOrder]);
      expect(mockOrdersService.findAll).toHaveBeenCalledWith('customer-123', OrderStatus.PROCESSING);
    });
  });

  describe('findOne', () => {
    it('should return a single order by id', async () => {
      const result = await controller.findOne('test-order-id');
      expect(result.data).toEqual(mockOrder);
      expect(mockOrdersService.findById).toHaveBeenCalledWith('test-order-id');
    });

    it('should return null if order is not found', async () => {
      mockOrdersService.findById = jest.fn().mockResolvedValue(null);
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: 'customer-123',
        items: [
          {
            productId: 'product-1',
            quantity: 2
          }
        ]
      };

      const result = await controller.create(createOrderDto);
      
      expect(result.data).toEqual(mockOrder);
      expect(mockOrdersService.create).toHaveBeenCalledWith(createOrderDto);
    });
  });

  describe('update', () => {
    it('should update an existing order', async () => {
      const updateOrderDto: UpdateOrderDto = {
        items: [
          {
            productId: 'product-2',
            quantity: 3
          }
        ]
      };

      const result = await controller.update('test-order-id', updateOrderDto);
      
      expect(result.data).toEqual(mockOrder);
      expect(mockOrdersService.update).toHaveBeenCalledWith('test-order-id', updateOrderDto);
    });
  });

  describe('updateShipping', () => {
    it('should update shipping information', async () => {
      const updateShippingDto: UpdateShippingDto = {
        "trackingCompany": ShippingCompany.UPS,
        "trackingNumber": '1Z999AA1234567890'
      };

      const result = await controller.updateShipping('test-order-id', updateShippingDto);
      
      expect(result.data).toEqual(mockOrder);
      expect(mockOrdersService.updateShipping).toHaveBeenCalledWith('test-order-id', updateShippingDto);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updateStatusDto: UpdateStatusDto = {
        status: OrderStatus.SHIPPED
      };

      const result = await controller.updateStatus('test-order-id', updateStatusDto);
      
      expect(result.data).toEqual(mockOrder);
      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith('test-order-id', updateStatusDto);
    });
  });

  describe('remove', () => {
    it('should remove an order', async () => {
      await controller.remove('test-order-id');
      expect(mockOrdersService.remove).toHaveBeenCalledWith('test-order-id');
    });
  });
});