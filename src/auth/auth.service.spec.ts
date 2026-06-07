import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import { Test } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: (u) => Promise.resolve(u),
            existsBy: () => Promise.resolve(false),
          } satisfies Partial<Repository<User>>,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should save password encrypted', async () => {
    const userDto: CreateUserDto = {
      password: '12345',
      username: `test-user-${new Date().getTime()}`,
    };
    const user = await service.registerUser(userDto);
    expect(bcrypt.compare(userDto.password, user.password)).toBeTruthy();
  });
});
