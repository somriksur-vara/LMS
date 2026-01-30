import { IsNumber, IsPositive, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFineConfigDto {
  @ApiProperty({
    description: 'Fine amount per day in Indian Rupees',
    example: 10.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  finePerDay: number;

  @ApiProperty({
    description: 'Maximum fine amount in Indian Rupees',
    example: 1000.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  maxFineAmount: number;

  @ApiProperty({
    description: 'Grace period in days before fines start',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  gracePeriodDays: number;
}