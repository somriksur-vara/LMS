import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/common/enums';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  };
}