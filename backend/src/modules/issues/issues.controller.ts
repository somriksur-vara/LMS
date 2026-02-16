import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto, IssueResponseDto, ReturnBookDto } from './dto/index';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, IssueStatus } from '@/common/enums';
import { PaginationOptions } from '@/common/utils';

@ApiTags('Issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @Roles(UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Issue a book to a user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Book issued successfully',
    schema: {
      example: {
        success: true,
        message: 'Book issued successfully',
        data: {
          id: 'issue_123',
          bookId: 'book_123',
          issuedToId: 'user_123',
          issueDate: '2024-01-01',
          expectedReturnDate: '2024-01-15',
          status: 'ACTIVE'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book or user not found',
    schema: {
      example: {
        success: false,
        message: 'The requested resource was not found',
        error: 'NOT_FOUND'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No available copies of this book',
    schema: {
      example: {
        success: false,
        message: 'No available copies of this book',
        error: 'NO_COPIES_AVAILABLE'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already has this book issued',
    schema: {
      example: {
        success: false,
        message: 'User already has this book issued',
        error: 'BOOK_ALREADY_ISSUED'
      }
    }
  })
  async create(
    @Body() createIssueDto: CreateIssueDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.issuesService.create(createIssueDto, user.id);
    return {
      success: true,
      message: 'Book issued successfully',
      data: result
    };
  }

  @Get()
  @Roles(UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get all issues with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, enum: IssueStatus, description: 'Filter by issue status' })
  @ApiQuery({ name: 'bookId', required: false, type: String, description: 'Filter by book ID' })
  @ApiQuery({ name: 'issuedToId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean, description: 'Filter overdue issues' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issues retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Found 2 issue(s)',
        data: [
          {
            id: 'issue_123',
            bookTitle: 'Clean Code',
            userName: 'John Doe',
            issueDate: '2024-01-01',
            expectedReturnDate: '2024-01-15',
            status: 'ACTIVE'
          }
        ],
        pagination: {
          page: 1,
          total: 2,
          totalPages: 1
        }
      }
    }
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: IssueStatus,
    @Query('bookId') bookId?: string,
    @Query('issuedToId') issuedToId?: string,
    @Query('overdue') overdue?: boolean,
  ) {
    const options: PaginationOptions & {
      status?: IssueStatus;
      bookId?: string;
      issuedToId?: string;
      overdue?: boolean;
    } = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      bookId,
      issuedToId,
      overdue: overdue === true,
    };
    const result = await this.issuesService.findAll(options);
    return {
      success: true,
      message: `Found ${result.data.length} issue(s)`,
      data: result.data,
      pagination: result.meta
    };
  }

  @Get('my-issues')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get current user\'s issues' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, enum: IssueStatus, description: 'Filter by issue status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User issues retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Found 1 of your issue(s)',
        data: [
          {
            id: 'issue_123',
            bookTitle: 'Clean Code',
            issueDate: '2024-01-01',
            expectedReturnDate: '2024-01-15',
            status: 'ACTIVE'
          }
        ],
        pagination: {
          page: 1,
          total: 1,
          totalPages: 1
        }
      }
    }
  })
  async findMyIssues(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: IssueStatus,
  ) {
    const options: PaginationOptions & {
      status?: IssueStatus;
      issuedToId: string;
    } = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      issuedToId: user.id,
    };
    const result = await this.issuesService.findAll(options);
    return {
      success: true,
      message: `Found ${result.data.length} of your issue(s)`,
      data: result.data,
      pagination: result.meta
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issue retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Issue retrieved successfully',
        data: {
          id: 'issue_123',
          bookTitle: 'Clean Code',
          userName: 'John Doe',
          issueDate: '2024-01-01',
          expectedReturnDate: '2024-01-15',
          status: 'ACTIVE'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.issuesService.findOne(id);
    return {
      success: true,
      message: 'Issue retrieved successfully',
      data: result
    };
  }

  @Patch(':id')
  @Roles(UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update issue by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issue updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Issue updated successfully',
        data: {
          id: 'issue_123',
          bookTitle: 'Clean Code',
          userName: 'John Doe',
          issueDate: '2024-01-01',
          expectedReturnDate: '2024-01-20',
          status: 'ACTIVE'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateIssueDto: UpdateIssueDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.issuesService.update(id, updateIssueDto, user.id);
    return {
      success: true,
      message: 'Issue updated successfully',
      data: result
    };
  }

  @Post(':id/return')
  @Roles(UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Return a book' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book returned successfully',
    schema: {
      example: {
        success: true,
        message: 'Book returned successfully',
        data: {
          id: 'issue_123',
          bookTitle: 'Clean Code',
          userName: 'John Doe',
          issueDate: '2024-01-01',
          returnDate: '2024-01-10',
          status: 'RETURNED'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Book is already returned',
  })
  async returnBook(
    @Param('id') id: string,
    @Body() returnBookDto: ReturnBookDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.issuesService.returnBook(id, returnBookDto, user.id);
    return {
      success: true,
      message: 'Book returned successfully',
      data: result
    };
  }
}