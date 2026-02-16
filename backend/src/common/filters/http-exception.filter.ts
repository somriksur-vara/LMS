import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();


    const exceptionResponse = exception.getResponse();
    let message = exception.message || 'Something went wrong';
    let errors: string[] | undefined;


    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      if (responseObj.message && Array.isArray(responseObj.message)) {
        errors = responseObj.message;
        message = 'Please check your input';
      } else if (responseObj.message) {
        message = responseObj.message;
      }
    }


    const errorResponse: any = {
      success: false,
      message,
    };


    if (status === 401) {
      errorResponse.message = 'Please login first or check your token';
      errorResponse.error = 'UNAUTHORIZED';
    } else if (status === 403) {
      errorResponse.message = 'You do not have permission to access this';
      errorResponse.error = 'FORBIDDEN';
    } else if (status === 404) {
      errorResponse.message = 'The requested resource was not found';
      errorResponse.error = 'NOT_FOUND';
    } else if (errors) {
      errorResponse.errors = errors;
    }

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Something went wrong on our end';

    if (exception instanceof HttpException) {
      message = exception.message;
    } else if (exception instanceof Error) {
      message = 'Internal server error';
    }

    response.status(status).json({
      success: false,
      message,
      error: status === 500 ? 'INTERNAL_SERVER_ERROR' : 'UNKNOWN_ERROR',
    });
  }
}