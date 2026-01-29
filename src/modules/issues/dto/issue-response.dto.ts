import { ApiProperty } from '@nestjs/swagger';
import { IssueStatus } from '@/common/enums';

export class IssueBookDto {
  @ApiProperty({ description: 'Book ID', example: 'clm123456789' })
  id: string;

  @ApiProperty({ description: 'Book title', example: 'Clean Code' })
  title: string;

  @ApiProperty({ description: 'Book ISBN', example: '978-0132350884' })
  isbn: string;
}

export class IssueUserDto {
  @ApiProperty({ description: 'User ID', example: 'clm987654321' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  lastName: string;
}

export class IssueResponseDto {
  @ApiProperty({ description: 'Issue ID', example: 'clm123456789' })
  id: string;

  @ApiProperty({ description: 'Book ID', example: 'clm123456789' })
  bookId: string;

  @ApiProperty({ description: 'User ID who received the book', example: 'clm987654321' })
  issuedToId: string;

  @ApiProperty({ description: 'User ID who issued the book', example: 'clm111222333' })
  issuedById: string;

  @ApiProperty({ description: 'Issue date', example: '2023-01-01T00:00:00.000Z' })
  issueDate: Date;

  @ApiProperty({ description: 'Due date', example: '2023-01-15T00:00:00.000Z' })
  dueDate: Date;

  @ApiProperty({
    description: 'Return date',
    example: '2023-01-14T00:00:00.000Z',
    nullable: true,
  })
  returnDate: Date | null;

  @ApiProperty({
    description: 'Fine amount',
    example: 0,
    nullable: true,
  })
  fine: number | null;

  @ApiProperty({
    description: 'Issue status',
    enum: IssueStatus,
    example: IssueStatus.ACTIVE,
  })
  status: IssueStatus;

  @ApiProperty({ description: 'Book details', type: IssueBookDto })
  book: IssueBookDto;

  @ApiProperty({ description: 'User who received the book', type: IssueUserDto })
  issuedTo: IssueUserDto;

  @ApiProperty({ description: 'User who issued the book', type: IssueUserDto })
  issuedBy: IssueUserDto;

  @ApiProperty({ description: 'Creation timestamp', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;
}