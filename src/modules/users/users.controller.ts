import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/index';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser, CurrentUserPayload } from '@/common/decorators';
import { UserRole } from '@/common/enums';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user account. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        success: true,
        message: 'User created successfully',
        data: {
          id: 'clp123456789',
          email: 'john.doe@library.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'MEMBER',
          isActive: true,
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        }
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        success: false,
        message: 'Please login first or check your token',
        error: 'UNAUTHORIZED'
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        message: 'You do not have permission to access this',
        error: 'FORBIDDEN'
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User with email already exists',
    schema: {
      example: {
        success: false,
        message: 'User with this email already exists',
        error: 'EMAIL_EXISTS'
      }
    }
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.usersService.create(createUserDto, user.id);
    return {
      success: true,
      message: 'User created successfully',
      data: result
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve paginated list of users with optional filters. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name and email',
    example: 'john',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Found 2 user(s)',
        data: [
          {
            id: 'clp123456789',
            email: 'john.doe@library.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'MEMBER',
            isActive: true,
            createdAt: '2024-01-01T12:00:00.000Z',
            updatedAt: '2024-01-01T12:00:00.000Z',
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === true;
    if (search) filters.search = search;

    const result = await this.usersService.findAll({ page, limit }, filters);
    return {
      success: true,
      message: `Found ${result.data.length} user(s)`,
      data: result.data,
      pagination: result.meta
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by ID. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clp123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'User retrieved successfully',
        data: {
          id: 'clp123456789',
          email: 'john.doe@library.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'MEMBER',
          isActive: true,
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.usersService.findOne(id);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: result
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information. Role changes require ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clp123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        success: true,
        message: 'User updated successfully',
        data: {
          id: 'clp123456789',
          email: 'john.doe@library.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'MEMBER',
          isActive: true,
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.usersService.update(id, updateUserDto, user.id, user.role as UserRole);
    return {
      success: true,
      message: 'User updated successfully',
      data: result
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user account. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clp123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or cannot delete own account',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.usersService.remove(id, user.id, user.role as UserRole);
    return { 
      success: true,
      message: 'User deleted successfully' 
    };
  }
}