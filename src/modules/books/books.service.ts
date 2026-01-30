import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, BookResponseDto } from './dto/index';
import { PaginationOptions, calculatePagination, createPaginationResult } from '@/common/utils';
import { BookStatus } from '@/common/enums';

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createBookDto: CreateBookDto, createdById: string): Promise<BookResponseDto> {
    // Check if ISBN already exists
    const existingBook = await this.prisma.book.findUnique({
      where: { isbn: createBookDto.isbn },
    });

    if (existingBook) {
      throw new ConflictException('Book with this ISBN already exists');
    }

    // Verify authors exist
    const authors = await this.prisma.author.findMany({
      where: { id: { in: createBookDto.authorIds } },
    });

    if (authors.length !== createBookDto.authorIds.length) {
      throw new BadRequestException('One or more authors not found');
    }

    // Verify category exists if provided
    if (createBookDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createBookDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const { authorIds, ...bookData } = createBookDto;

    // Create book with authors
    const book = await this.prisma.book.create({
      data: {
        ...bookData,
        availableCopies: bookData.totalCopies,
        authors: {
          create: authorIds.map((authorId) => ({
            authorId,
          })),
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                biography: true,
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(book);
  }

  async findAll(
    paginationOptions: PaginationOptions,
    filters?: {
      search?: string;
      categoryId?: string;
      authorId?: string;
      status?: BookStatus;
      availableOnly?: boolean;
    },
  ) {
    const { page, limit, skip } = calculatePagination(paginationOptions);

    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { isbn: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.authorId) {
      where.authors = {
        some: {
          authorId: filters.authorId,
        },
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.availableOnly) {
      where.availableCopies = { gt: 0 };
      where.status = BookStatus.AVAILABLE;
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          authors: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  biography: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    const mappedBooks = books.map((book) => this.mapToResponseDto(book));

    return createPaginationResult(mappedBooks, total, page, limit);
  }

  async findOne(id: string): Promise<BookResponseDto> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                biography: true,
              },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return this.mapToResponseDto(book);
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
    updatedById: string,
  ): Promise<BookResponseDto> {
    const existingBook = await this.prisma.book.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!existingBook) {
      throw new NotFoundException('Book not found');
    }

    // Check ISBN uniqueness if being updated
    if (updateBookDto.isbn && updateBookDto.isbn !== existingBook.isbn) {
      const isbnExists = await this.prisma.book.findUnique({
        where: { isbn: updateBookDto.isbn },
      });

      if (isbnExists) {
        throw new ConflictException('Book with this ISBN already exists');
      }
    }

    // Verify authors exist if provided
    if (updateBookDto.authorIds) {
      const authors = await this.prisma.author.findMany({
        where: { id: { in: updateBookDto.authorIds } },
      });

      if (authors.length !== updateBookDto.authorIds.length) {
        throw new BadRequestException('One or more authors not found');
      }
    }

    // Verify category exists if provided
    if (updateBookDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateBookDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const { authorIds, ...initialBookData } = updateBookDto;
    let bookData = initialBookData;

    // Update available copies if total copies changed
    if (bookData.totalCopies && bookData.totalCopies !== existingBook.totalCopies) {
      const issuedCopies = existingBook.totalCopies - existingBook.availableCopies;
      bookData = {
        ...bookData,
        availableCopies: Math.max(0, bookData.totalCopies - issuedCopies),
      } as any;
    }

    // Update book
    const book = await this.prisma.book.update({
      where: { id },
      data: {
        ...bookData,
        ...(authorIds && {
          authors: {
            deleteMany: {},
            create: authorIds.map((authorId) => ({
              authorId,
            })),
          },
        }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                biography: true,
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(book);
  }

  async remove(id: string, deletedById: string): Promise<void> {
    const existingBook = await this.prisma.book.findUnique({
      where: { id },
      include: {
        issues: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE'] },
          },
        },
      },
    });

    if (!existingBook) {
      throw new NotFoundException('Book not found');
    }

    // Check if book has active issues
    if (existingBook.issues.length > 0) {
      throw new BadRequestException('Cannot delete book with active issues');
    }

    await this.prisma.book.delete({
      where: { id },
    });
  }

  async updateAvailability(bookId: string, increment: number): Promise<void> {
    await this.prisma.book.update({
      where: { id: bookId },
      data: {
        availableCopies: {
          increment,
        },
      },
    });
  }

  private mapToResponseDto(book: any): BookResponseDto {
    return {
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      description: book.description,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      status: book.status,
      publishedYear: book.publishedYear,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      category: book.category,
      authors: book.authors.map((ba: any) => ba.author),
    };
  }
}