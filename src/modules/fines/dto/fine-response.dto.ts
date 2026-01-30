import { Decimal } from '@prisma/client/runtime/library';

export class FineResponseDto {
  issueId: string;
  fineAmount: Decimal;
  overdueDays: number;
  bookTitle: string;
  userEmail: string;
  expectedReturnDate: Date;
}

export class OverdueBookDto {
  id: string;
  issueDate: Date;
  expectedReturnDate: Date;
  fineAmount: Decimal;
  overdueDays: number;
  book: {
    id: string;
    title: string;
    isbn: string;
    authors: Array<{
      author: {
        name: string;
      };
    }>;
  };
  issuedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class FineConfigurationDto {
  id: string;
  finePerDay: Decimal;
  maxFineAmount: Decimal;
  gracePeriodDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserOutstandingFinesDto {
  userId: string;
  totalOutstandingFines: Decimal;
  overdueIssuesCount: number;
}