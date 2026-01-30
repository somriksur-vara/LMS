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
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
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
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        message: 'Please check your input',
        errors: ['Email is required', 'Password must be at least 6 characters']
      }
    }
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
        success: true,
        message: 'Logged out successfully'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        message: 'Please login first or check your token',
        error: 'UNAUTHORIZED'
      }
    }
  })
  async logout(@CurrentUser() user: CurrentUserPayload) {
    await this.authService.logout(user.id);
    return { 
      success: true,
      message: 'Logged out successfully' 
    };
  }
}