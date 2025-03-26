# Order Management Microservice

NestJS in TS built for a basic order management system for Reebelo

## Project Overview

Order Management Operations:
   - Creating orders with products and quantities
   - Updating orders with shipping information
   - Updating order status (processing, shipped, delivered, cancelled)
   - Deleting orders

## Architecture

1. **Controllers**: Handle API requests and route them to services
2. **Services**: Contain business logic and coordinate between repositories and external services
3. **Repositories**: Handle data access abstraction
4. **DTOs**: Define data transfer objects for structured data sharing between layers
5. **Entities**: Define the domain models (right now, just: order, order status, order items)
6. **Tests**: Some rudimentary tests with jest

## Core Features

### Order Management

- Full CRUD operations for orders
- Status management with *validation of state transitions*
- Shipping information updates

### External Service Integration

The order management service communicates with other microservices through:

1. **Synchronous API Calls** - Using HTTP for immediate data needs:
   - Customer Service: Fetches customer details during order creation - I mocked a bunch of data here...
   - Inventory Service: Manages product details and inventory levels - I mocked a bunch of data here too...

2. **Asynchronous Messaging** - Using a message queue for event-driven communication:
   - Order events: Created, Updated, Shipped, Delivered, Canceled
   - Inventory events: Reserved, Released
   - Message queue mocks a connection with RabbitMQ, so it isn't really doing anything atm

### Logging Service
   - Custom logging service extending NestJS LoggerService interface
   - Winston is utilized for fancier log formatting 
   - Configurable log levels
   - LoggingInterceptor that logs all HTTP requests

### Swagger
   - Swagger UI available at [http://0.0.0.0:8000/api]

## Technical Implementation

### API Endpoints (or see swagger!)

- `GET /orders` - List all orders with optional filtering
- `GET /orders/:id` - Get order details
- `POST /orders` - Create a new order
- `PUT /orders/:id` - Update an existing order
- `PUT /orders/:id/shipping` - Update shipping information
- `PUT /orders/:id/status` - Update order status
- `DELETE /orders/:id` - Delete an order

### Messaging Events

The service publishes the following events to the message queue:

- `order.created` - When a new order is created
- `order.updated` - When an order is updated
- `order.shipped` - When shipping information is added
- `order.delivered` - When an order is marked as delivered
- `order.canceled` - When an order is canceled
- `inventory.reserved` - When inventory is reserved for an order
- `inventory.released` - When inventory is released (cancellation/deletion)

### Resilience Features

- [not yet] Retry mechanisms for failed operations
- [sort of] Graceful degradation when external services are unavailable
   - We handle 404s when resources are not found, we handle for bad API requests in general, we have some configurability for utilizing mock data vs "real" data (although real data is not possible atm)
- Comprehensive error handling and logging
   - logs of logging

## Deployment Considerations

### AWS Infrastructure

For production deployment, this service would use:

1. **Compute**:
   - AWS ECS Fargate for containerized deployment
   - Auto-scaling based on demand

2. **Networking**:
   - AWS Application Load Balancer for traffic distribution
   - API Gateway for API management, throttling, and security

3. **Data Storage**:
   - DynamoDB for order data, taking advantage of its scalability
   - DynamoDB streams to trigger event processing

4. **Messaging**:
   - Amazon SNS/SQS for asynchronous messaging
   - Amazon EventBridge for event routing

5. **Monitoring & Observability**:
   - AWS CloudWatch for logs and metrics
   - X-Ray for distributed tracing

### Scalability

- Horizontal scaling of service instances
- Database sharding for multi-region deployment
- Read replicas for high-read workloads
- Caching layers for frequently accessed data

**Considerations**
- "The service should handle millions of orders and be scalable for global storefronts"
   - Horizontally scaling this service in AWS, as noted, is made quite easy with ECS and the usage of IAC. Proper metrics, alarms, etc would need to be tuned.

### Resilience

- I'd opt for multi-AZ deployment for high availability
- Circuit breakers for external service calls
- Retry mechanisms with exponential backoff
- Dead letter queues for failed message processing

**Considerations**
- "Inter-service communication should be resilient to failures and scalable"
   - Right now we're just publishing events to a message queue when a status of an order changes. If the message fails, we continue on our way, while of course logging the issue. Maybe we'd need to refine this and continue to try pumping the message out and/or have some kind of alert mechanism when there are service outages detected.

### Security
- The Order Management service should have authentication middleware to ensure only authenticated users can utilize these APIs. If internal services were communicating with the Order Management service, we could consider API keys.
- AWS Secrets Manager is nice for API key storage, we could cache the key so that we don't get rate limited
- API Gateway and ALBs can also be leveraged for API key validation, simplifying our Order Management Service

## Development Setup

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start server
npm run start
```

### Environment Variables

- `PORT` - Port for the HTTP server (default: 8000)
- `USE_REAL_CUSTOMER_API` - Toggle between real and mock customer API (default: false)
- `USE_REAL_INVENTORY_API` - Toggle between real and mock inventory API (default: false)
- `USE_REAL_MESSAGE_BROKER` - Toggle between real and mock message broker (default: false)
- `CUSTOMER_SERVICE_URL` - URL for the Customer Service API
- `INVENTORY_SERVICE_URL` - URL for the Inventory Service API
- `AMQP_URL` - URL for the RabbitMQ server

## Future Improvements

1. **Data Persistence**: Replace in-memory storage with a proper database
2. **Authentication/Authorization**: Implement JWT-based authentication
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Caching**: Implement response caching for frequently accessed data
5. **Metrics**: Add prometheus metrics collection
6. **API Versioning**: Implement formal API versioning
7. **Pagination**: Add pagination for list endpoints
8. **WebSockets**: Add real-time order status updates via WebSockets
9. **Reporting**: Add aggregation and reporting capabilities
10. **Messaging Queue Improvements**: Retry, Exponential Backoff...
11. **Code Quality**: I added eslint but this needs to be improved upon and actually utilized
12. **CI/CD**: Automate build, tests, deployment of service with Github Actions or an equivalent
13. **IAC**: Automate resource deployment to the cloud with Terraform or equivalent (I like Terraform)