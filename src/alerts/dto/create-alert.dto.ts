import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  stock: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number;
}
