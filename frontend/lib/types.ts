export enum UserRole {
  LIBRARIAN = 'LIBRARIAN',
  MEMBER = 'MEMBER',
}

export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  ISSUED = 'ISSUED',
  MAINTENANCE = 'MAINTENANCE',
  LOST = 'LOST',
}

export enum IssueStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}


export const USER_ROLES = {
  LIBRARIAN: UserRole.LIBRARIAN,
  MEMBER: UserRole.MEMBER,
};

export const BOOK_STATUS = {
  AVAILABLE: BookStatus.AVAILABLE,
  ISSUED: BookStatus.ISSUED,
  MAINTENANCE: BookStatus.MAINTENANCE,
  LOST: BookStatus.LOST,
};

export const ISSUE_STATUS = {
  ACTIVE: IssueStatus.ACTIVE,
  RETURNED: IssueStatus.RETURNED,
  OVERDUE: IssueStatus.OVERDUE,
};


export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  description?: string;
  totalCopies: number;
  availableCopies: number;
  status: BookStatus;
  publishedYear?: number;
  publisher?: string;
  authors?: Author[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  booksCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Author {
  id: string;
  name: string;
  biography?: string;
}

export interface Issue {
  id: string;
  bookId: string;
  userId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: IssueStatus;
  fineAmount?: number;
  book?: Book;
  user?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface Fine {
  issueId: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
  issue?: Issue;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
