import {
  Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Query, NotFoundException, BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery} from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { UpdateShippingDto } from "./dto/update-shipping.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { Order } from "./entities/order.entity";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { Logger } from "../logger/logger.service";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  
  constructor(private readonly ordersService: OrdersService, private readonly logger: Logger) {
    this.logger.setContext("OrdersController");
  }

  @Get()
  @ApiOperation({ summary: "Get all orders" })
  @ApiQuery({ name: "customerId", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Orders found",
    type: Order,
    isArray: true,
  })
  async findAll(@Query("customerId") customerId?: string, @Query("status") status?: string): Promise<ApiResponseDto<Order[]>> { 
    this.logger.log(
      `Getting all orders - filters: customerId=${customerId}, status=${status}`
    );
    const orders = await this.ordersService.findAll(customerId, status);
    return ApiResponseDto.success(orders, "Orders retrieved successfully");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order by ID" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Order found",
    type: Order,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Order not found",
  })
  async findOne(@Param("id") id: string): Promise<ApiResponseDto<Order>> {
    this.logger.log(`Getting order with ID: ${id}`);
    const order = await this.ordersService.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return ApiResponseDto.success(order, "Order retrieved successfully");
  }

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Order created",
    type: Order,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input",
  })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<ApiResponseDto<Order>> {
    this.logger.log(
      `Creating new order for customer: ${createOrderDto.customerId}`
    );

    try {
      const order = await this.ordersService.create(createOrderDto);
      return ApiResponseDto.success(order, "Order created successfully");
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw new BadRequestException(error.message);
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an order" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Order updated",
    type: Order,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Order not found",
  })
  async update(@Param("id") id: string,@Body() updateOrderDto: UpdateOrderDto): Promise<ApiResponseDto<Order>> {
    this.logger.log(`Updating order with ID: ${id}`);
    const updatedOrder = await this.ordersService.update(id, updateOrderDto);

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return ApiResponseDto.success(updatedOrder, "Order updated successfully");
  }

  @Put(":id/shipping")
  @ApiOperation({ summary: "Update order shipping information" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiBody({ type: UpdateShippingDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Shipping information updated",
    type: Order,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Order not found",
  })
  async updateShipping(@Param("id") id: string,@Body() updateShippingDto: UpdateShippingDto): Promise<ApiResponseDto<Order>> {
    this.logger.log(`Updating shipping info for order with ID: ${id}`);
    
    const updatedOrder = await this.ordersService.updateShipping(id, updateShippingDto);

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return ApiResponseDto.success(
      updatedOrder,
      "Shipping information updated successfully"
    );
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update order status" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Status updated",
    type: Order,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Order not found",
  })
  async updateStatus(@Param("id") id: string,@Body() updateStatusDto: UpdateStatusDto): Promise<ApiResponseDto<Order>> {
    this.logger.log(`Updating status for order with ID: ${id} to ${updateStatusDto.status}`);
    
    const updatedOrder = await this.ordersService.updateStatus(id, updateStatusDto);

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return ApiResponseDto.success(updatedOrder, "Order status updated successfully");
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an order" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Order deleted",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Order not found",
  })
  async remove(@Param("id") id: string): Promise<ApiResponseDto<null>> {
    this.logger.log(`Deleting order with ID: ${id}`);
    const isDeleted = await this.ordersService.remove(id);

    if (!isDeleted) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return ApiResponseDto.success(null, "Order deleted successfully");
  }
}
