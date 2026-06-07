import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class SignInDto extends PickType(CreateUserDto, [
  'username',
  'password',
]) {
  @ApiProperty()
  @IsString()
  @IsOptional()
  fcmToken?: string;
}
