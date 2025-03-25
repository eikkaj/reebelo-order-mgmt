import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/exceptions/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { Logger } from "./logger/logger.service";

async function bootstrap() {
  /**
   * Boilerplate NestJS code to bootstrap the application. NestFactory exposes create method that builds a Nest application instance.
   * TODO: we could use a platform factory to create the application instance. platform-express, platform-fastify, etc.
   */
  const app = await NestFactory.create(AppModule);

  const logger = new Logger();
  logger.setContext("Bootstrap");

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // NestJS Swagger is so cool
  // TODO: think about versioning the API
  const config = new DocumentBuilder()
    .setTitle("Order Management API")
    .setDescription("API for managing orders in an e-commerce platform")
    .setVersion("1.0")
    .addTag("orders")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // CORS settings for multiple storefronts
  app.enableCors();

  // Start the application
  const port = process.env.PORT || 8000;
  await app.listen(port, "0.0.0.0");
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();