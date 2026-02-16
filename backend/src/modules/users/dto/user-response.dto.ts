import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/common/enums';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@library.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.MEMBER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'User creation date',
    example: '2024-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update date',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt: Date;
}