import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ArrayNotEmpty,
  Matches,
} from 'class-validator';

export class CreateBookDto {
  @ApiProperty({
    description: 'Book ISBN (International Standard Book Number)',
    example: '978-0132350884',
    pattern: '^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:ISBN(?:-1[03])?:?\s)?(?=.{10}$|.{13}$|.{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, {
    message: 'ISBN must be a valid format',
  })
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

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'clp123456789',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Array of author IDs',
    example: ['author-1', 'author-2'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  authorIds: string[];
}