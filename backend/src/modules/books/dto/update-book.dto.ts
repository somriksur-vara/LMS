import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  IsEnum,
  Matches,
} from 'class-validator';
import { BookStatus } from '@/common/enums';

export class UpdateBookDto {
  @ApiPropertyOptional({
    description: 'Book ISBN (International Standard Book Number)',
    example: '978-0132350884',
  })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiPropertyOptional({
    description: 'Book title',
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Book description',
    example: 'A comprehensive guide to writing clean, maintainable code',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Total number of copies',
    example: 5,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalCopies?: number;

  @ApiPropertyOptional({
    description: 'Year of publication',
    example: 2008,
  })
  @IsInt()
  @IsOptional()
  publishedYear?: number;

  @ApiPropertyOptional({
    description: 'Book status',
    enum: BookStatus,
    example: BookStatus.AVAILABLE,
  })
  @IsEnum(BookStatus)
  @IsOptional()
  status?: BookStatus;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'clp123456789',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Category name (will create category if not exists)',
    example: 'Science Fiction',
  })
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiPropertyOptional({
    description: 'Array of author IDs',
    example: ['author-1', 'author-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  authorIds?: string[];

  @ApiPropertyOptional({
    description: 'Author name (will create author if not exists)',
    example: 'Robert C. Martin',
  })
  @IsString()
  @IsOptional()
  authorName?: string;
}