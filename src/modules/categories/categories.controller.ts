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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/index';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums';
import { PaginationOptions } from '@/common/utils';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
    schema: {
      example: {
        success: true,
        message: 'Category created successfully',
        data: {
          id: 'cat_123',
          name: 'Technology',
          description: 'Books about technology and programming',
          createdAt: '2024-01-01T12:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category with this name already exists',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.categoriesService.create(createCategoryDto, user.id);
    return {
      success: true,
      message: 'Category created successfully',
      data: result
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by category name or description' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Found 2 categories',
        data: [
          {
            id: 'cat_123',
            name: 'Technology',
            description: 'Books about technology and programming',
            createdAt: '2024-01-01T12:00:00.000Z'
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
    @Query('search') search?: string,
  ) {
    const options: PaginationOptions & { search?: string } = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    };
    const result = await this.categoriesService.findAll(options);
    return {
      success: true,
      message: `Found ${result.data.length} categor${result.data.length === 1 ? 'y' : 'ies'}`,
      data: result.data,
      pagination: result.meta
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Category retrieved successfully',
        data: {
          id: 'cat_123',
          name: 'Technology',
          description: 'Books about technology and programming',
          createdAt: '2024-01-01T12:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.categoriesService.findOne(id);
    return {
      success: true,
      message: 'Category retrieved successfully',
      data: result
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Category updated successfully',
        data: {
          id: 'cat_123',
          name: 'Technology',
          description: 'Books about technology and programming',
          updatedAt: '2024-01-01T12:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category with this name already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.categoriesService.update(id, updateCategoryDto, user.id);
    return {
      success: true,
      message: 'Category updated successfully',
      data: result
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete category by ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Category deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Category deleted successfully'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete category with associated books',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.categoriesService.remove(id, user.id);
    return {
      success: true,
      message: 'Category deleted successfully'
    };
  }
}