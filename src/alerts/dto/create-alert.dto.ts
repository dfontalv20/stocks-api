import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Stock is required' })
  stock: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;
}
