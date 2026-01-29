import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateIssueDto, UpdateIssueDto, IssueResponseDto, ReturnBookDto } from './dto/index';
import { PaginationOptions, calculatePagination, createPaginationResult } from '@/common/utils';
import { AuditAction, IssueStatus, BookStatus } from '@/common/enums';

@Injectable()
export class IssuesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createIssueDto: CreateIssueDto, processedById: string): Promise<IssueResponseDto> {
    // Check if book exists and is available
    const book = await this.prisma.book.findUnique({
      where: { id: createIssueDto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException('No available copies of this book');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createIssueDto.issuedToId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has this book issued
    const existingIssue = await this.prisma.issue.findFirst({
      where: {
        bookId: createIssueDto.bookId,
        issuedToId: createIssueDto.issuedToId,
        status: IssueStatus.ACTIVE,
      },
    });

    if (existingIssue) {
      throw new ConflictException('User already has this book issued');
    }

    // Calculate expected return date (default 14 days from now)
    const expectedReturnDate = new Date();
    expectedReturnDate.setDate(expectedReturnDate.getDate() + 14);

    // Create issue and update book availability in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create the issue
      const issue = await prisma.issue.create({
        data: {
          bookId: createIssueDto.bookId,
          issuedToId: createIssueDto.issuedToId,
          processedById,
          expectedReturnDate,
          status: IssueStatus.ACTIVE,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
          issuedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update book availability
      await prisma.book.update({
        where: { id: createIssueDto.bookId },
        data: {
          availableCopies: { decrement: 1 },
          status: book.availableCopies === 1 ? BookStatus.ISSUED : book.status,
        },
      });

      return issue;
    });

    // Log the action
    await this.auditLogsService.createLog({
      action: AuditAction.ISSUE_BOOK,
      entity: 'Issue',
      entityId: result.id,
      userId: processedById,
      metadata: {
        bookTitle: result.book.title,
        issuedToEmail: result.issuedTo.email,
        expectedReturnDate: result.expectedReturnDate,
      },
    });

    return {
      id: result.id,
      bookId: result.bookId,
      issuedToId: result.issuedToId,
      issuedById: result.processedById,
      issueDate: result.issueDate,
      dueDate: result.expectedReturnDate,
      returnDate: result.actualReturnDate,
      fine: Number(result.fineAmount),
      status: result.status,
      book: result.book,
      issuedTo: result.issuedTo,
      issuedBy: result.processedBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async findAll(options: PaginationOptions & { 
    status?: IssueStatus;
    bookId?: string;
    issuedToId?: string;
    overdue?: boolean;
  }) {
    const { page, limit, skip } = calculatePagination(options);
    const { status, bookId, issuedToId, overdue } = options;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (bookId) {
      where.bookId = bookId;
    }

    if (issuedToId) {
      where.issuedToId = issuedToId;
    }

    if (overdue) {
      where.expectedReturnDate = { lt: new Date() };
      where.status = IssueStatus.ACTIVE;
    }

    const [issues, total] = await Promise.all([
      this.prisma.issue.findMany({
        where,
        skip,
        take: limit,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
          issuedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.issue.count({ where }),
    ]);

    const data = issues.map(issue => ({
      id: issue.id,
      bookId: issue.bookId,
      issuedToId: issue.issuedToId,
      issuedById: issue.processedById,
      issueDate: issue.issueDate,
      dueDate: issue.expectedReturnDate,
      returnDate: issue.actualReturnDate,
      fine: Number(issue.fineAmount),
      status: issue.status,
      book: issue.book,
      issuedTo: issue.issuedTo,
      issuedBy: issue.processedBy,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    }));

    return createPaginationResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<IssueResponseDto> {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
          },
        },
        issuedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return {
      id: issue.id,
      bookId: issue.bookId,
      issuedToId: issue.issuedToId,
      issuedById: issue.processedById,
      issueDate: issue.issueDate,
      dueDate: issue.expectedReturnDate,
      returnDate: issue.actualReturnDate,
      fine: Number(issue.fineAmount),
      status: issue.status,
      book: issue.book,
      issuedTo: issue.issuedTo,
      issuedBy: issue.processedBy,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }

  async returnBook(id: string, returnBookDto: ReturnBookDto, returnedById: string): Promise<IssueResponseDto> {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        book: true,
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    if (issue.status !== IssueStatus.ACTIVE) {
      throw new BadRequestException('Book is already returned');
    }

    const returnDate = new Date();
    let fine = 0;

    // Calculate fine if overdue
    if (returnDate > issue.expectedReturnDate) {
      const overdueDays = Math.ceil((returnDate.getTime() - issue.expectedReturnDate.getTime()) / (1000 * 60 * 60 * 24));
      fine = overdueDays * 1; // $1 per day fine
    }

    // Add any additional fine from the request
    if (returnBookDto.additionalFine) {
      fine += returnBookDto.additionalFine;
    }

    // Update issue and book availability in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Update the issue
      const updatedIssue = await prisma.issue.update({
        where: { id },
        data: {
          actualReturnDate: returnDate,
          fineAmount: fine,
          status: IssueStatus.RETURNED,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
          issuedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update book availability
      await prisma.book.update({
        where: { id: issue.bookId },
        data: {
          availableCopies: { increment: 1 },
          status: BookStatus.AVAILABLE,
        },
      });

      return updatedIssue;
    });

    // Log the action
    await this.auditLogsService.createLog({
      action: AuditAction.RETURN_BOOK,
      entity: 'Issue',
      entityId: result.id,
      userId: returnedById,
      metadata: {
        bookTitle: result.book.title,
        issuedToEmail: result.issuedTo.email,
        returnDate,
        fine,
        overdue: returnDate > issue.expectedReturnDate,
      },
    });

    return {
      id: result.id,
      bookId: result.bookId,
      issuedToId: result.issuedToId,
      issuedById: result.processedById,
      issueDate: result.issueDate,
      dueDate: result.expectedReturnDate,
      returnDate: result.actualReturnDate,
      fine: Number(result.fineAmount),
      status: result.status,
      book: result.book,
      issuedTo: result.issuedTo,
      issuedBy: result.processedBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async update(
    id: string,
    updateIssueDto: UpdateIssueDto,
    updatedById: string,
  ): Promise<IssueResponseDto> {
    const existingIssue = await this.prisma.issue.findUnique({
      where: { id },
    });

    if (!existingIssue) {
      throw new NotFoundException('Issue not found');
    }

    const updateData: any = {};
    
    if (updateIssueDto.dueDate) {
      updateData.expectedReturnDate = updateIssueDto.dueDate;
    }
    
    if (updateIssueDto.fine !== undefined) {
      updateData.fineAmount = updateIssueDto.fine;
    }
    
    if (updateIssueDto.status) {
      updateData.status = updateIssueDto.status;
    }

    const issue = await this.prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
          },
        },
        issuedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log the action
    await this.auditLogsService.createLog({
      action: AuditAction.UPDATE_BOOK, // Using UPDATE_BOOK as there's no UPDATE_ISSUE action
      entity: 'Issue',
      entityId: issue.id,
      userId: updatedById,
      metadata: {
        bookTitle: issue.book.title,
        changes: updateIssueDto,
      },
    });

    return {
      id: issue.id,
      bookId: issue.bookId,
      issuedToId: issue.issuedToId,
      issuedById: issue.processedById,
      issueDate: issue.issueDate,
      dueDate: issue.expectedReturnDate,
      returnDate: issue.actualReturnDate,
      fine: Number(issue.fineAmount),
      status: issue.status,
      book: issue.book,
      issuedTo: issue.issuedTo,
      issuedBy: issue.processedBy,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }
}