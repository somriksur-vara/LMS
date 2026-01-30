import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/index';
import { PaginationOptions, calculatePagination, createPaginationResult } from '@/common/utils';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, createdById: string): Promise<CategoryResponseDto> {
    // Check if category already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
      include: {
        books: {
          select: {
            id: true,
            title: true,
            isbn: true,
          },
        },
        _count: {
          select: { books: true },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      books: category.books,
      booksCount: category._count.books,
    };
  }

  async findAll(options: PaginationOptions & { search?: string }) {
    const { page, limit, skip } = calculatePagination(options);
    const { search } = options;

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          books: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
          _count: {
            select: { books: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    const data = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      books: category.books,
      booksCount: category._count.books,
    }));

    return createPaginationResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        books: {
          select: {
            id: true,
            title: true,
            isbn: true,
            publishedYear: true,
            status: true,
          },
        },
        _count: {
          select: { books: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      books: category.books.map(book => ({
        ...book,
        publishedYear: book.publishedYear ?? undefined,
      })),
      booksCount: category._count.books,
    };
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    updatedById: string,
  ): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Check if name is being changed and if it conflicts
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const nameConflict = await this.prisma.category.findUnique({
        where: { name: updateCategoryDto.name },
      });

      if (nameConflict) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        books: {
          select: {
            id: true,
            title: true,
            isbn: true,
          },
        },
        _count: {
          select: { books: true },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      books: category.books,
      booksCount: category._count.books,
    };
  }

  async remove(id: string, deletedById: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.books > 0) {
      throw new ConflictException('Cannot delete category with associated books');
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }
}