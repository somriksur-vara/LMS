import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateIssueDto {
  @ApiProperty({
    description: 'Book ID to issue',
    example: 'clm123456789',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  bookId: string;

  @ApiProperty({
    description: 'User ID to issue the book to',
    example: 'clm987654321',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  issuedToId: string;
}