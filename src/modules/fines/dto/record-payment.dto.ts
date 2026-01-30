import { IsNumber, IsPositive, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordPaymentDto {
  @ApiProperty({
    description: 'Amount paid in Indian Rupees',
    example: 50.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  paidAmount: number;

  @ApiProperty({
    description: 'Payment method used',
    example: 'CASH',
    enum: ['CASH', 'CARD', 'ONLINE', 'BANK_TRANSFER'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['CASH', 'CARD', 'ONLINE', 'BANK_TRANSFER'])
  paymentMethod: string;
}