import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateUserDto } from '@/auth/dto/create-user.dto';

export const createTestUser = async (
  app: INestApplication,
  suffix = `${new Date().getTime()}`,
) => {
  const userDto: CreateUserDto = {
    password: '12345',
    username: `test-user-${suffix}`,
  };
  await request(app.getHttpServer()).post('/auth/signUp').send(userDto);
  const res = await request(app.getHttpServer())
    .post('/auth/signIn')
    .send(userDto);
  return (res.body as { accessToken: string }).accessToken;
};
