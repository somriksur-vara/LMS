import { IsNumber, IsPositive, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordPaymentDto {
  @ApiProperty({
    description: 'Amount paid',
    example: 50.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  paidAmount: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'CASH',
    enum: ['CASH', 'CARD', 'UPI', 'ONLINE'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['CASH', 'CARD', 'UPI', 'ONLINE'])
  paymentMethod: string;
}