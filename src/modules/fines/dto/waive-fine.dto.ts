import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class WaiveFineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  waiveReason: string;
}