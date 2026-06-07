import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password: string;
}
