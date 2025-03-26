import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';
import { CreateOrderDto } from '../src/orders/dto/create-order.dto';
import { UpdateOrderDto } from '../src/orders/dto/update-order.dto';
import { UpdateShippingDto } from '../src/orders/dto/update-shipping.dto';
import { UpdateStatusDto } from '../src/orders/dto/update-status.dto';
import { Order } from '../src/orders/entities/order.entity';
import { OrderStatus } from '../src/orders/entities/order-status.enum';
import { ShippingCompany } from '../src/orders/dto/update-shipping.dto';
import { Logger } from '../src/logger/logger.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrder: Order = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    customerId: '123e4567-e89b-12d3-a456-426614174001',
    items: [
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        productId: '123e4567-e89b-12d3-a456-426614174003',
        quantity: 2,
      },
    ],
    totalPrice: 59.98,
    status: OrderStatus.PROCESSING,
    createdAt: new Date(),
    updatedAt: new Date(),
    shippingInfo: null,
  };

  const mockOrdersService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateShipping: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      mockOrdersService.findAll.mockResolvedValue([mockOrder]);
      
      const result = await controller.findAll();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockOrder]);
      expect(mockOrdersService.findAll).toHaveBeenCalled();
    });

    it('should accept and pass customerId filter', async () => {
      mockOrdersService.findAll.mockResolvedValue([mockOrder]);
      
      await controller.findAll('123e4567-e89b-12d3-a456-426614174001');
      
      expect(mockOrdersService.findAll).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174001',
        undefined
      );
    });

    it('should accept and pass status filter', async () => {
      mockOrdersService.findAll.mockResolvedValue([mockOrder]);
      
      await controller.findAll(undefined, OrderStatus.PROCESSING);
      
      expect(mockOrdersService.findAll).toHaveBeenCalledWith(
        undefined,
        OrderStatus.PROCESSING
      );
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      mockOrdersService.findById.mockResolvedValue(mockOrder);
      
      const result = await controller.findOne('123e4567-e89b-12d3-a456-426614174000');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);
      expect(mockOrdersService.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrdersService.findById.mockResolvedValue(null);
      
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return an order', async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174003',
            quantity: 2,
          },
        ],
      };
      
      mockOrdersService.create.mockResolvedValue(mockOrder);
      
      const result = await controller.create(createOrderDto);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);
      expect(mockOrdersService.create).toHaveBeenCalledWith(createOrderDto);
    });

    it('should handle errors properly', async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174003',
            quantity: 2,
          },
        ],
      };
      
      mockOrdersService.create.mockRejectedValue(new BadRequestException('Invalid input'));
      
      await expect(controller.create(createOrderDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update and return an order', async () => {
      const updateOrderDto: UpdateOrderDto = {
        notes: 'Please deliver to the back door',
      };
      
      mockOrdersService.update.mockResolvedValue({
        ...mockOrder,
        notes: 'Please deliver to the back door',
      });
      
      const result = await controller.update('123e4567-e89b-12d3-a456-426614174000', updateOrderDto);
      
      expect(result.success).toBe(true);
      expect(result.data?.notes).toEqual('Please deliver to the back door');
      expect(mockOrdersService.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', updateOrderDto);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrdersService.update.mockResolvedValue(null);
      
      await expect(
        controller.update('non-existent-id', { notes: 'test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateShipping', () => {
    it('should update shipping info and return an order', async () => {
      const shippingDto: UpdateShippingDto = {
        trackingNumber: '1Z999AA10123456784',
        trackingCompany: ShippingCompany.UPS,
      };
      
      mockOrdersService.updateShipping.mockResolvedValue({
        ...mockOrder,
        shippingInfo: shippingDto,
      });
      
      const result = await controller.updateShipping('123e4567-e89b-12d3-a456-426614174000', shippingDto);
      
      expect(result.success).toBe(true);
      expect(result.data?.shippingInfo).toEqual(shippingDto);
      expect(mockOrdersService.updateShipping).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', shippingDto);
    });
  });

  describe('updateStatus', () => {
    it('should update status and return an order', async () => {
      const statusDto: UpdateStatusDto = {
        status: OrderStatus.SHIPPED,
      };
      
      mockOrdersService.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });
      
      const result = await controller.updateStatus('123e4567-e89b-12d3-a456-426614174000', statusDto);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toEqual(OrderStatus.SHIPPED);
      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', statusDto);
    });
  });

  describe('remove', () => {
    it('should remove an order and return success', async () => {
      mockOrdersService.remove.mockResolvedValue(true);
      
      const result = await controller.remove('123e4567-e89b-12d3-a456-426614174000');
      
      expect(result.success).toBe(true);
      expect(mockOrdersService.remove).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrdersService.remove.mockResolvedValue(false);
      
      await expect(controller.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
