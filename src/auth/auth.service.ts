import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { SignInDto } from './dto/sign-in.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly passwordSalt = 10;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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

  async signIn(signInDto: SignInDto): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findOneBy({
      username: signInDto.username,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordMatches = await bcrypt.compare(
      signInDto.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (signInDto.fcmToken) {
      user.fcmToken = signInDto.fcmToken;
      await this.userRepository.save(user);
    }
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
    });
    return { accessToken };
  }

  async getUserById(id: number): Promise<User> {
    return this.userRepository.findOneByOrFail({ id });
  }

  async updateFCMToken(id: number, fcmToken: string | null): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.fcmToken = fcmToken;
    return this.userRepository.save(user);
  }
}
