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
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Issue a book to a user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Book issued successfully',
    type: IssueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book or user not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No available copies of this book',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already has this book issued',
  })
  async create(
    @Body() createIssueDto: CreateIssueDto,
    @CurrentUser() user: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.create(createIssueDto, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
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
    return this.issuesService.findAll(options);
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
    return this.issuesService.findAll(options);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issue retrieved successfully',
    type: IssueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  async findOne(@Param('id') id: string): Promise<IssueResponseDto> {
    return this.issuesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update issue by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issue updated successfully',
    type: IssueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateIssueDto: UpdateIssueDto,
    @CurrentUser() user: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.update(id, updateIssueDto, user.id);
  }

  @Post(':id/return')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Return a book' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book returned successfully',
    type: IssueResponseDto,
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
  ): Promise<IssueResponseDto> {
    return this.issuesService.returnBook(id, returnBookDto, user.id);
  }
}