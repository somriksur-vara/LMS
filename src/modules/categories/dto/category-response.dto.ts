import { ApiProperty } from '@nestjs/swagger';

export class CategoryBookDto {
  @ApiProperty({ description: 'Book ID', example: 'clm123456789' })
  id: string;

  @ApiProperty({ description: 'Book title', example: 'Clean Code' })
  title: string;

  @ApiProperty({ description: 'Book ISBN', example: '978-0132350884' })
  isbn: string;

  @ApiProperty({ description: 'Published year', example: 2008, required: false })
  publishedYear?: number;

  @ApiProperty({ description: 'Book status', example: 'AVAILABLE', required: false })
  status?: string;
}

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID', example: 'clm123456789' })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Technology' })
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Books related to technology and programming',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Books in this category',
    type: [CategoryBookDto],
    example: [
      {
        id: 'clm123456789',
        title: 'Clean Code',
        isbn: '978-0132350884',
        publishedYear: 2008,
        status: 'AVAILABLE',
      },
    ],
  })
  books: CategoryBookDto[];

  @ApiProperty({ description: 'Total number of books in this category', example: 5 })
  booksCount: number;
}