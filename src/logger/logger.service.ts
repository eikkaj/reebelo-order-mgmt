import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { ConfigService } from '../config/config.service';

@Injectable()
export class Logger implements NestLoggerService {
  private context?: string;
  private logger: winston.Logger;

  constructor(private readonly configService?: ConfigService) {
    const isProduction = configService?.isProduction || false;
    const logLevel = configService?.logLevel || 'info';

    // Define logger format
    const format = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.ms(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, context, ms, ...meta }) => {
        return `${timestamp} [${level}] [${context || 'Default'}] ${message} ${ms}${
          Object.keys(meta).length ? ` - ${JSON.stringify(meta)}` : ''
        }`;
      }),
    );

    // Create Winston logger
    this.logger = winston.createLogger({
      level: logLevel,
      format,
      defaultMeta: { service: 'order-management-service' },
      transports: [
        new winston.transports.Console({
          format: isProduction 
            ? format 
            : winston.format.combine(
                winston.format.colorize(),
                format,
              ),
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  log(message: string, ...optionalParams: any[]) {
    this.logger.info(message, {
      context: this.context,
      ...this.getOptionalParams(optionalParams),
    });
  }

  error(message: string, trace: string, context?: string) {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  warn(message: string, ...optionalParams: any[]) {
    this.logger.warn(message, {
      context: this.context,
      ...this.getOptionalParams(optionalParams),
    });
  }

  debug(message: string, ...optionalParams: any[]) {
    this.logger.debug(message, {
      context: this.context,
      ...this.getOptionalParams(optionalParams),
    });
  }

  verbose(message: string, ...optionalParams: any[]) {
    this.logger.verbose(message, {
      context: this.context,
      ...this.getOptionalParams(optionalParams),
    });
  }

  private getOptionalParams(optionalParams: any[]): object {
    return optionalParams.length > 0 ? { meta: optionalParams } : {};
  }
}
