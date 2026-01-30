import { IsNumber, IsPositive, Min, IsInt } from 'class-validator';

export class UpdateFineConfigDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  finePerDay: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  maxFineAmount: number;

  @IsInt()
  @Min(0)
  gracePeriodDays: number;
}