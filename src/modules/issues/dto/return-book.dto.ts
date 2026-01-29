import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';

export class ReturnBookDto {
  @ApiProperty({
    description: 'Additional fine amount (beyond overdue fine)',
    example: 2.50,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  additionalFine?: number;
}