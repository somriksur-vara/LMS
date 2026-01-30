import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WaiveFineDto {
  @ApiProperty({
    description: 'Reason for waiving the fine',
    example: 'Book was damaged when issued',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  waiveReason: string;
}