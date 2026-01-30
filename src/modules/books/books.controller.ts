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
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, BookResponseDto } from './dto/index';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser, CurrentUserPayload } from '@/common/decorators';
import { UserRole, BookStatus } from '@/common/enums';

@ApiTags('Books')
@Controller('books')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'Create a new book',
    description: 'Add a new book to the library catalog. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Book created successfully',
    schema: {
      example: {
        success: true,
        message: 'Book created successfully',
        data: {
          id: 'clp123456789',
          isbn: '978-0132350884',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          description: 'A comprehensive guide to writing clean, maintainable code',
          totalCopies: 5,
          availableCopies: 5,
          status: 'AVAILABLE',
          publishedYear: 2008,
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or authors/category not found',
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
    status: 409,
    description: 'Conflict - Book with ISBN already exists',
  })
  async create(
    @Body() createBookDto: CreateBookDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.booksService.create(createBookDto, user.id);
    return {
      success: true,
      message: 'Book created successfully',
      data: result
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all books',
    description: 'Retrieve paginated list of books with optional filters.',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Search in title, ISBN, or description',
    example: 'clean code',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: String,
    description: 'Filter by author ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookStatus,
    description: 'Filter by book status',
  })
  @ApiQuery({
    name: 'availableOnly',
    required: false,
    type: Boolean,
    description: 'Show only available books',
  })
  @ApiResponse({
    status: 200,
    description: 'Books retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Found 1 book(s)',
        data: [
          {
            id: 'clp123456789',
            isbn: '978-0132350884',
            title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
            description: 'A comprehensive guide to writing clean, maintainable code',
            totalCopies: 5,
            availableCopies: 3,
            status: 'AVAILABLE',
            publishedYear: 2008,
            createdAt: '2024-01-01T12:00:00.000Z',
            updatedAt: '2024-01-01T12:00:00.000Z',
            category: {
              id: 'cat123',
              name: 'Technology',
              description: 'Technology and programming books',
            },
            authors: [
              {
                id: 'author-1',
                name: 'Robert C. Martin',
                biography: 'Software engineer and author',
              },
            ],
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
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('authorId') authorId?: string,
    @Query('status') status?: BookStatus,
    @Query('availableOnly', new DefaultValuePipe(false), ParseBoolPipe) availableOnly?: boolean,
  ) {
    const filters: any = {};
    if (search) filters.search = search;
    if (categoryId) filters.categoryId = categoryId;
    if (authorId) filters.authorId = authorId;
    if (status) filters.status = status;
    if (availableOnly) filters.availableOnly = availableOnly;

    const result = await this.booksService.findAll({ page, limit }, filters);
    return {
      success: true,
      message: `Found ${result.data.length} book(s)`,
      data: result.data,
      pagination: result.meta
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get book by ID',
    description: 'Retrieve a specific book by ID with full details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 'clp123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Book retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Book retrieved successfully',
        data: {
          id: 'clp123456789',
          isbn: '978-0132350884',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          description: 'A comprehensive guide to writing clean, maintainable code',
          totalCopies: 5,
          availableCopies: 3,
          status: 'AVAILABLE',
          publishedYear: 2008,
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
    status: 404,
    description: 'Book not found',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.booksService.findOne(id);
    return {
      success: true,
      message: 'Book retrieved successfully',
      data: result
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'Update book',
    description: 'Update book information. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 'clp123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Book updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Book updated successfully',
        data: {
          id: 'clp123456789',
          isbn: '978-0132350884',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          description: 'A comprehensive guide to writing clean, maintainable code',
          totalCopies: 5,
          availableCopies: 3,
          status: 'AVAILABLE',
          publishedYear: 2008,
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or authors/category not found',
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
    description: 'Book not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - ISBN already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.booksService.update(id, updateBookDto, user.id);
    return {
      success: true,
      message: 'Book updated successfully',
      data: result
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'Delete book',
    description: 'Delete a book from the catalog. Cannot delete books with active issues. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 'clp123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Book deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Book deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete book with active issues',
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
    description: 'Book not found',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.booksService.remove(id, user.id);
    return { 
      success: true,
      message: 'Book deleted successfully' 
    };
  }
}