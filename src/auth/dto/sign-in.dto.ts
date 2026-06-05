import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  password: string;
}
