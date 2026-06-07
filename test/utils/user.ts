import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateUserDto } from '@/auth/dto/create-user.dto';
import { SignInDto } from '@/auth/dto/sign-in.dto';

export const createTestUser = async (
  app: INestApplication,
  options?: { suffix?: string; fcmToken?: string },
) => {
  const userDto: CreateUserDto = {
    password: '12345',
    username: `test-user-${options?.suffix ?? new Date().getTime()}`,
  };
  await request(app.getHttpServer()).post('/auth/signUp').send(userDto);
  const res = await request(app.getHttpServer())
    .post('/auth/signIn')
    .send({ ...userDto, fcmToken: options?.fcmToken } satisfies SignInDto);
  return (res.body as { accessToken: string }).accessToken;
};
