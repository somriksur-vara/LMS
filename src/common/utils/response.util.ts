export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
}

export class ResponseUtil {
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, error?: string, errors?: string[]): ApiResponse {
    return {
      success: false,
      message,
      error,
      errors,
    };
  }
}