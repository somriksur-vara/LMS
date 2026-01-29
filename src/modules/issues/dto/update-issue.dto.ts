import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDate, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IssueStatus } from '@/common/enums';

export class UpdateIssueDto {
  @ApiProperty({
    description: 'Due date for the book return',
    example: '2023-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty({
    description: 'Fine amount',
    example: 5.50,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fine?: number;

  @ApiProperty({
    description: 'Issue status',
    enum: IssueStatus,
    example: IssueStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;
}