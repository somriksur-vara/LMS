import { IsNumber, IsPositive, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class RecordPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  paidAmount: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['CASH', 'CARD', 'ONLINE', 'BANK_TRANSFER'])
  paymentMethod: string;
}