import type { ErrorCode } from '@plublista/shared';

export interface ValidationDetail {
  field: string;
  message: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ValidationDetail[];

  constructor(code: ErrorCode, message: string, statusCode: number, details?: ValidationDetail[]) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}
