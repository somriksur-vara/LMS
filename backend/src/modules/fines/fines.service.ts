import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinesService {
  private readonly logger = new Logger(FinesService.name);

  constructor(private prisma: PrismaService) {}


  async getUserFines(userId: string) {
    const overdueIssues = await this.prisma.issue.findMany({
      where: {
        issuedToId: userId,
        actualReturnDate: null,
        expectedReturnDate: { lt: new Date() },
      },
      include: {
        book: { select: { title: true } },
      },
      orderBy: { expectedReturnDate: 'asc' },
    });


    const overdueBooks = [];
    let totalFines = 0;

    for (const issue of overdueIssues) {
      const fine = await this.calculateFine(issue.id);
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(issue.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      overdueBooks.push({
        issueId: issue.id,
        bookTitle: issue.book.title,
        daysOverdue,
        fineAmount: Number(fine),
        dueDate: issue.expectedReturnDate.toISOString().split('T')[0],
      });

      totalFines += Number(fine);
    }

    return {
      totalFines,
      overdueBooks,
      message: totalFines > 0
        ? `You have ₹${totalFines} in outstanding fines`
        : 'No fines! All books returned on time 🎉'
    };
  }


  async recordPayment(issueId: string, paidAmount: number, paymentMethod: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: { book: { select: { title: true } } },
    });

    if (!issue) {
      throw new NotFoundException('Book issue not found');
    }

    const currentFine = Number(issue.fineAmount);

    if (paidAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (paidAmount > currentFine) {
      throw new BadRequestException(`Payment amount (₹${paidAmount}) cannot exceed fine amount (₹${currentFine})`);
    }

    const remainingFine = currentFine - paidAmount;


    await this.prisma.issue.update({
      where: { id: issueId },
      data: { fineAmount: new Decimal(remainingFine) },
    });

    this.logger.log(`Fine payment recorded: ₹${paidAmount} for issue ${issueId}`);

    return {
      message: remainingFine === 0 ? 'Fine fully paid!' : 'Partial payment recorded',
      issueId,
      bookTitle: issue.book.title,
      paidAmount,
      remainingFine,
      paymentMethod,
      status: remainingFine === 0 ? 'PAID' : 'PARTIAL'
    };
  }


  async getOverdueBooks() {
    const overdueIssues = await this.prisma.issue.findMany({
      where: {
        actualReturnDate: null,
        expectedReturnDate: { lt: new Date() },
      },
      include: {
        book: { select: { title: true, isbn: true } },
        issuedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
      },
      orderBy: { expectedReturnDate: 'asc' },
    });

    const overdueBooks = [];
    let totalFines = 0;

    for (const issue of overdueIssues) {
      const fine = await this.calculateFine(issue.id);
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(issue.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      overdueBooks.push({
        issueId: issue.id,
        bookTitle: issue.book.title,
        isbn: issue.book.isbn,
        userName: `${issue.issuedTo.firstName} ${issue.issuedTo.lastName}`,
        userEmail: issue.issuedTo.email,
        daysOverdue,
        fineAmount: Number(fine),
        dueDate: issue.expectedReturnDate.toISOString().split('T')[0],
      });

      totalFines += Number(fine);
    }

    return {
      overdueBooks,
      totalFines,
      count: overdueBooks.length,
      message: `Found ${overdueBooks.length} overdue books with ₹${totalFines} total fines`
    };
  }


  async waiveFine(issueId: string, reason: string, librarianId: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: { book: { select: { title: true } } },
    });

    if (!issue) {
      throw new NotFoundException('Book issue not found');
    }

    const waiveAmount = Number(issue.fineAmount);

    await this.prisma.issue.update({
      where: { id: issueId },
      data: {
        fineAmount: new Decimal(0),
        notes: reason,
      },
    });

    this.logger.log(`Fine waived: ₹${waiveAmount} for issue ${issueId} by librarian ${librarianId}`);

    return {
      message: 'Fine waived successfully',
      issueId,
      bookTitle: issue.book.title,
      waiveAmount,
      reason,
    };
  }


  async calculateFine(issueId: string): Promise<Decimal> {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue || issue.actualReturnDate) {
      return issue?.fineAmount || new Decimal(0);
    }

    const currentDate = new Date();
    const expectedReturnDate = new Date(issue.expectedReturnDate);


    const overdueDays = Math.max(
      0,
      Math.ceil((currentDate.getTime() - expectedReturnDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (overdueDays <= 0) {
      return new Decimal(0);
    }


    const finePerDay = 10;
    const maxFine = 500;
    let fineAmount = overdueDays * finePerDay;

    if (fineAmount > maxFine) {
      fineAmount = maxFine;
    }

    const fine = new Decimal(fineAmount);


    await this.prisma.issue.update({
      where: { id: issueId },
      data: {
        fineAmount: fine,
        status: 'OVERDUE',
      },
    });

    return fine;
  }
}