import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: Record<string, any>
) {
  return res.status(statusCode).json({
    success: true,
    message: message || 'Operation successful',
    data,
    meta,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: errors || null,
    },
  });
}
