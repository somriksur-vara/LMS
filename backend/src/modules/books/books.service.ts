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

    const existingBook = await this.prisma.book.findUnique({
      where: { isbn: createBookDto.isbn },
    });

    if (existingBook) {
      throw new ConflictException('Book with this ISBN already exists');
    }

    let authorIds = createBookDto.authorIds || [];


    if (createBookDto.authorName && !authorIds.length) {
      let author = await this.prisma.author.findFirst({
        where: { name: createBookDto.authorName },
      });

      if (!author) {
        author = await this.prisma.author.create({
          data: { name: createBookDto.authorName },
        });
      }

      authorIds = [author.id];
    }

    if (!authorIds.length) {
      throw new BadRequestException('Either authorIds or authorName must be provided');
    }


    const authors = await this.prisma.author.findMany({
      where: { id: { in: authorIds } },
    });

    if (authors.length !== authorIds.length) {
      throw new BadRequestException('One or more authors not found');
    }

    const { authorIds: _, authorName: __, ...bookData } = createBookDto;


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


    if (updateBookDto.isbn && updateBookDto.isbn !== existingBook.isbn) {
      const isbnExists = await this.prisma.book.findUnique({
        where: { isbn: updateBookDto.isbn },
      });

      if (isbnExists) {
        throw new ConflictException('Book with this ISBN already exists');
      }
    }


    let authorIds = updateBookDto.authorIds;
    if (updateBookDto.authorName && !authorIds) {
      let author = await this.prisma.author.findFirst({
        where: { name: updateBookDto.authorName },
      });

      if (!author) {
        author = await this.prisma.author.create({
          data: { name: updateBookDto.authorName },
        });
      }

      authorIds = [author.id];
    }


    if (authorIds) {
      const authors = await this.prisma.author.findMany({
        where: { id: { in: authorIds } },
      });

      if (authors.length !== authorIds.length) {
        throw new BadRequestException('One or more authors not found');
      }
    }

    const { authorIds: _, authorName: __, ...initialBookData } = updateBookDto;
    let bookData = initialBookData;


    if (bookData.totalCopies && bookData.totalCopies !== existingBook.totalCopies) {
      const issuedCopies = existingBook.totalCopies - existingBook.availableCopies;
      bookData = {
        ...bookData,
        availableCopies: Math.max(0, bookData.totalCopies - issuedCopies),
      } as any;
    }


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
      publisher: book.publisher,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      status: book.status,
      publishedYear: book.publishedYear,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      authors: book.authors.map((ba: any) => ba.author),
    };
  }
}