import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbOptionsSqlite } from '../data-source';

describe('AuthModule', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(dbOptionsSqlite), AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  const sendSignUpRequest = (userDto: CreateUserDto) => {
    return request(app.getHttpServer()).post('/auth/signUp').send(userDto);
  };

  it('should create user', async () => {
    const userDto: CreateUserDto = {
      password: '1234',
      username: `test-user-${new Date().getTime()}`,
    };
    const res = await sendSignUpRequest(userDto);
    expect(res.status).toBe(HttpStatus.CREATED);
    const user = res.body as User;
    expect(user.id).toBeDefined();
    expect(user.username).toMatch(userDto.username);
  });

  it('should not allow user to have username shorter than 4 characters', async () => {
    const userDto: CreateUserDto = {
      password: '1234',
      username: `tes`,
    };
    const res = await sendSignUpRequest(userDto);
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should not allow user to have password shorter than 4 characters', async () => {
    const userDto: CreateUserDto = {
      password: '123',
      username: `test-user-${new Date().getTime()}`,
    };

    const res = await sendSignUpRequest(userDto);
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should return error if username already exists', async () => {
    const userDto: CreateUserDto = {
      password: '12345',
      username: `test-user-1`,
    };
    const res1 = await sendSignUpRequest(userDto);
    expect(res1.status).toBe(HttpStatus.CREATED);
    const res2 = await sendSignUpRequest(userDto);
    expect(res2.ok).toBeFalsy();
  });
});
