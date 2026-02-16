import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';

export class CreateBookDto {
  @ApiProperty({
    description: 'Book ISBN (International Standard Book Number)',
    example: '978-0132350884',
  })
  @IsString()
  @IsNotEmpty()
  isbn: string;

  @ApiProperty({
    description: 'Book title',
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Book description',
    example: 'A comprehensive guide to writing clean, maintainable code',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Total number of copies',
    example: 5,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  totalCopies: number;

  @ApiPropertyOptional({
    description: 'Year of publication',
    example: 2008,
  })
  @IsInt()
  @IsOptional()
  publishedYear?: number;

  @ApiProperty({
    description: 'Array of author IDs',
    example: ['author-1', 'author-2'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  authorIds?: string[];

  @ApiPropertyOptional({
    description: 'Author name (will create author if not exists)',
    example: 'Robert C. Martin',
  })
  @IsString()
  @IsOptional()
  authorName?: string;

  @ApiPropertyOptional({
    description: 'Publisher name',
    example: 'Prentice Hall',
  })
  @IsString()
  @IsOptional()
  publisher?: string;
}
