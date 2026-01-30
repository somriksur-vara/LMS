import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto, AuthResponseDto } from './dto/index';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,        // For database operations
    private jwtService: JwtService,       // For creating JWT tokens
  ) {}

  // Check if a user's email and password are correct
  async validateUser(email: string, password: string): Promise<any> {
    // Look up the user by their email address
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, // We need this to check the password
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // If user doesn't exist or their account is disabled, reject them
    if (!user || !user.isActive) {
      return null;
    }

    // Check if the password they provided matches what we have stored
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user info without the password (for security)
    const { password: _, ...result } = user;
    return result;
  }

  // Handle user login and create a JWT token
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // First, make sure their credentials are valid
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create the JWT token payload with user info
    const payload = {
      sub: user.id,     // 'sub' is the standard JWT field for user ID
      email: user.email,
      role: user.role,
    };

    // Generate the actual JWT token
    const accessToken = this.jwtService.sign(payload);

    // Send back the token and user info in simplified format
    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      }
    };
  }
}