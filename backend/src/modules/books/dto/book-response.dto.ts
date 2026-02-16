import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookStatus } from '@/common/enums';

export class BookResponseDto {
  @ApiProperty({
    description: 'Book ID',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Book ISBN',
    example: '978-0132350884',
  })
  isbn: string;

  @ApiProperty({
    description: 'Book title',
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Book description',
    example: 'A comprehensive guide to writing clean, maintainable code',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Publisher name',
    example: 'Prentice Hall',
  })
  publisher?: string;

  @ApiProperty({
    description: 'Total number of copies',
    example: 5,
  })
  totalCopies: number;

  @ApiProperty({
    description: 'Available copies',
    example: 3,
  })
  availableCopies: number;

  @ApiProperty({
    description: 'Book status',
    enum: BookStatus,
    example: BookStatus.AVAILABLE,
  })
  status: BookStatus;

  @ApiPropertyOptional({
    description: 'Year of publication',
    example: 2008,
  })
  publishedYear?: number;

  @ApiProperty({
    description: 'Book creation date',
    example: '2024-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Book last update date',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Book authors',
    type: 'array',
  })
  authors: Array<{
    id: string;
    name: string;
    biography?: string;
  }>;
}