import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  timestamp: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({ required: false })
  message?: string;

  constructor(success: boolean, data?: T, message?: string, error?: string) {
    this.success = success;
    this.timestamp = new Date().toISOString();
    
    if (data) this.data = data;
    if (message) this.message = message;
    if (error) this.error = error;
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto<T>(true, data, message);
  }

  static error<T>(error: string, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto<T>(false, undefined, message, error);
  }
}
