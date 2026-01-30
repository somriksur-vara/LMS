import {
  Controller,
  Get,
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
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { UserRole, AuditAction } from '@/common/enums';
import { AuditLogResponseDto } from './dto/index';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve paginated audit logs with optional filters. Requires ADMIN or LIBRARIAN role.',
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
    name: 'action',
    required: false,
    enum: AuditAction,
    description: 'Filter by action type',
  })
  @ApiQuery({
    name: 'entity',
    required: false,
    type: String,
    description: 'Filter by entity type (users, books, etc.)',
    example: 'books',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter from date (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter to date (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Found 1 audit log(s)',
        data: [
          {
            id: 'clp123456789',
            action: 'CREATE_BOOK',
            entity: 'books',
            entityId: 'book123',
            metadata: {
              title: 'Clean Code',
              isbn: '978-0132350884',
            },
            timestamp: '2024-01-01T12:00:00.000Z',
            user: {
              id: 'user123',
              email: 'librarian@library.com',
              firstName: 'John',
              lastName: 'Librarian',
              role: 'LIBRARIAN',
            },
          },
        ],
        pagination: {
          total: 1,
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
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (action) filters.action = action;
    if (entity) filters.entity = entity;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await this.auditLogsService.findAll({ page, limit }, filters);
    return {
      success: true,
      message: `Found ${result.data.length} audit log(s)`,
      data: result.data,
      pagination: result.meta
    };
  }
}