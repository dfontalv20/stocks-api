import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  private readonly passwordSalt = 10;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  private async encrypt(text: string): Promise<string> {
    return bcrypt.hash(text, this.passwordSalt);
  }

  async registerUser(createAuthDto: CreateUserDto): Promise<User> {
    const exists = await this.userRepository.existsBy({
      username: createAuthDto.username,
    });
    if (exists) {
      throw new BadRequestException('Username already exists');
    }
    const user = new User();
    user.username = createAuthDto.username;
    user.password = await this.encrypt(createAuthDto.password);
    return this.userRepository.save(user);
  }
}
