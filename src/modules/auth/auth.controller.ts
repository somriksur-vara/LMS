import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser, CurrentUserPayload } from '@/common/decorators';
import { LoginDto, AuthResponseDto } from './dto/index';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔐 Login to get access token',
    description: `
      **Step 1**: Use this endpoint to login and get your JWT token.
      
      **Test Credentials:**
      - Admin: admin@library.com / admin123
      - Librarian: librarian@library.com / librarian123  
      - Member: member@library.com / member123
      
      **Step 2**: Copy the accessToken from response
      **Step 3**: Click 🔒 Authorize button and paste: Bearer YOUR_TOKEN
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - Copy the accessToken!',
    type: AuthResponseDto,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'clr123abc456def789',
          email: 'admin@library.com',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/auth/login',
        method: 'POST',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed',
        validationErrors: [
          'email must be an email',
          'password must be longer than or equal to 6 characters',
        ],
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/auth/login',
        method: 'POST',
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🚪 Logout and end session',
    description: 'Logout current user and log the activity for audit purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logout successful',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async logout(@CurrentUser() user: CurrentUserPayload) {
    await this.authService.logout(user.id);
    return { message: 'Logout successful' };
  }
}