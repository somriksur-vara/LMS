import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';

// Define what information we expect to find in JWT tokens
export interface JwtPayload {
  sub: string;    // User ID (standard JWT field name)
  email: string;  // User's email address
  role: string;   // User's role (admin, librarian, member)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService, // For getting our JWT secret
    private prisma: PrismaService,        // For looking up user info
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Get token from Authorization header
      ignoreExpiration: false,                                  // Make sure tokens haven't expired
      secretOrKey: configService.get<string>('jwt.secret'),    // Secret key to verify tokens
    });
  }

  // This runs every time someone sends a JWT token with their request
  async validate(payload: JwtPayload) {
    // Look up the user to make sure they still exist and are active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // If user doesn't exist or is disabled, reject the request
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user info that will be available in controllers as request.user
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}