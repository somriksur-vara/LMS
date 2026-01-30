import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinesService {
  private readonly logger = new Logger(FinesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate fine for an overdue book
   */
  async calculateFine(issueId: string): Promise<Decimal> {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: { book: true, issuedTo: true },
    });

    if (!issue) {
      throw new Error('Issue not found');
    }

    if (issue.actualReturnDate) {
      // Book already returned, return existing fine
      return issue.fineAmount;
    }

    const fineConfig = await this.getFineConfiguration();
    const currentDate = new Date();
    const expectedReturnDate = new Date(issue.expectedReturnDate);

    // Calculate overdue days
    const overdueDays = Math.max(
      0,
      Math.ceil((currentDate.getTime() - expectedReturnDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (overdueDays <= fineConfig.gracePeriodDays) {
      return new Decimal(0);
    }

    const effectiveOverdueDays = overdueDays - fineConfig.gracePeriodDays;
    let fineAmount = new Decimal(effectiveOverdueDays).mul(fineConfig.finePerDay);

    // Apply maximum fine limit
    if (fineAmount.gt(fineConfig.maxFineAmount)) {
      fineAmount = fineConfig.maxFineAmount;
    }

    // Update the issue with calculated fine
    await this.prisma.issue.update({
      where: { id: issueId },
      data: { 
        fineAmount,
        status: overdueDays > 0 ? 'OVERDUE' : issue.status,
      },
    });

    this.logger.log(`Fine calculated for issue ${issueId}: ₹${fineAmount} (${overdueDays} days overdue)`);

    return fineAmount;
  }

  /**
   * Calculate fines for all active issues
   */
  async calculateAllActiveFines(): Promise<{ updated: number; totalFines: Decimal }> {
    const activeIssues = await this.prisma.issue.findMany({
      where: {
        status: 'ACTIVE',
        actualReturnDate: null,
      },
    });

    let updated = 0;
    let totalFines = new Decimal(0);

    for (const issue of activeIssues) {
      try {
        const fine = await this.calculateFine(issue.id);
        if (fine.gt(0)) {
          updated++;
          totalFines = totalFines.add(fine);
        }
      } catch (error) {
        this.logger.error(`Error calculating fine for issue ${issue.id}:`, error);
      }
    }

    return { updated, totalFines };
  }

  /**
   * Get overdue books with fines
   */
  async getOverdueBooks(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [overdueIssues, total] = await Promise.all([
      this.prisma.issue.findMany({
        where: {
          status: 'OVERDUE',
          actualReturnDate: null,
        },
        include: {
          book: {
            include: {
              authors: {
                include: { author: true },
              },
            },
          },
          issuedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { expectedReturnDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.issue.count({
        where: {
          status: 'OVERDUE',
          actualReturnDate: null,
        },
      }),
    ]);

    return {
      data: overdueIssues.map(issue => ({
        ...issue,
        overdueDays: Math.ceil(
          (new Date().getTime() - new Date(issue.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's total outstanding fines
   */
  async getUserOutstandingFines(userId: string): Promise<Decimal> {
    const result = await this.prisma.issue.aggregate({
      where: {
        issuedToId: userId,
        actualReturnDate: null,
        fineAmount: { gt: 0 },
      },
      _sum: { fineAmount: true },
    });

    return result._sum.fineAmount || new Decimal(0);
  }

  /**
   * Waive fine for an issue (admin/librarian only)
   */
  async waiveFine(issueId: string, waiveReason: string, waiveById: string): Promise<void> {
    await this.prisma.issue.update({
      where: { id: issueId },
      data: { 
        fineAmount: 0,
        notes: waiveReason,
      },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        action: AuditAction.WAIVE_FINE,
        entity: 'Issue',
        entityId: issueId,
        metadata: { waiveReason },
        userId: waiveById,
      },
    });

    this.logger.log(`Fine waived for issue ${issueId} by user ${waiveById}`);
  }

  /**
   * Record fine payment
   */
  async recordFinePayment(issueId: string, paidAmount: Decimal, paymentMethod: string): Promise<void> {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new Error('Issue not found');
    }

    if (paidAmount.gte(issue.fineAmount)) {
      // Full payment - clear the fine
      await this.prisma.issue.update({
        where: { id: issueId },
        data: { fineAmount: 0 },
      });
    } else {
      // Partial payment - reduce the fine
      await this.prisma.issue.update({
        where: { id: issueId },
        data: { fineAmount: issue.fineAmount.sub(paidAmount) },
      });
    }

    // Log the payment
    await this.prisma.auditLog.create({
      data: {
        action: AuditAction.PAY_FINE,
        entity: 'Issue',
        entityId: issueId,
        metadata: { 
          paidAmount: paidAmount.toString(),
          paymentMethod,
          remainingFine: issue.fineAmount.sub(paidAmount).toString(),
        },
        userId: issue.issuedToId,
      },
    });

    this.logger.log(`Fine payment recorded for issue ${issueId}: ₹${paidAmount}`);
  }

  /**
   * Get fine configuration
   */
  async getFineConfiguration() {
    let config = await this.prisma.fineConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      // Create default configuration if none exists (Indian Rupees)
      config = await this.prisma.fineConfiguration.create({
        data: {
          finePerDay: new Decimal(10.00), // ₹10 per day
          maxFineAmount: new Decimal(1000.00), // ₹1000 maximum
          gracePeriodDays: 1,
          isActive: true,
        },
      });
    }

    return config;
  }

  /**
   * Update fine configuration (admin only)
   */
  async updateFineConfiguration(
    finePerDay: number,
    maxFineAmount: number,
    gracePeriodDays: number,
    updatedById: string,
  ) {
    // Deactivate current configuration
    await this.prisma.fineConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new configuration
    const newConfig = await this.prisma.fineConfiguration.create({
      data: {
        finePerDay: new Decimal(finePerDay),
        maxFineAmount: new Decimal(maxFineAmount),
        gracePeriodDays,
        isActive: true,
      },
    });

    // Log the change
    await this.prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE_CATEGORY, // We can add UPDATE_FINE_CONFIG later
        entity: 'FineConfiguration',
        entityId: newConfig.id,
        metadata: { finePerDay, maxFineAmount, gracePeriodDays },
        userId: updatedById,
      },
    });

    return newConfig;
  }

  /**
   * Create sample overdue issues for testing (TESTING ONLY)
   */
  async createSampleOverdueIssues(createdById: string) {
    // Get some available books
    const books = await this.prisma.book.findMany({
      where: { availableCopies: { gt: 0 } },
      take: 3,
    });

    // Get some users (excluding the creator)
    const users = await this.prisma.user.findMany({
      where: { 
        id: { not: createdById },
        role: 'MEMBER'
      },
      take: 3,
    });

    if (books.length === 0 || users.length === 0) {
      throw new Error('Not enough books or users to create sample data');
    }

    let created = 0;
    let totalFines = new Decimal(0);

    // Create overdue issues
    for (let i = 0; i < Math.min(books.length, users.length); i++) {
      const book = books[i];
      const user = users[i];

      // Create issue with past due date (5-15 days ago)
      const daysOverdue = 5 + i * 5;
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - (daysOverdue + 14)); // Issue date

      const expectedReturnDate = new Date(issueDate);
      expectedReturnDate.setDate(expectedReturnDate.getDate() + 14); // 14 days to return

      const issue = await this.prisma.issue.create({
        data: {
          bookId: book.id,
          issuedToId: user.id,
          processedById: createdById,
          issueDate,
          expectedReturnDate,
          status: 'OVERDUE',
        },
      });

      // Update book availability
      await this.prisma.book.update({
        where: { id: book.id },
        data: { availableCopies: { decrement: 1 } },
      });

      // Calculate fine
      const fine = await this.calculateFine(issue.id);
      totalFines = totalFines.add(fine);
      created++;

      this.logger.log(`Created sample overdue issue: ${issue.id} with fine ₹${fine}`);
    }

    return { created, totalFines };
  }
}