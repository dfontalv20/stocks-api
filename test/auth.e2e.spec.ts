import { CreateUserDto } from '../src/auth/dto/create-user.dto';
import { User } from '../src/auth/entities/user.entity';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SignInDto } from '../src/auth/dto/sign-in.dto';
import { createTestApp } from './utils/app';

describe('AuthModule', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createTestApp();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const sendSignUpRequest = (userDto: CreateUserDto) => {
    return request(app.getHttpServer()).post('/auth/signUp').send(userDto);
  };

  const sendSignInRequest = (userDto: SignInDto) => {
    return request(app.getHttpServer()).post('/auth/signIn').send(userDto);
  };

  const sendGetAuthUserRequest = (token: string) => {
    return request(app.getHttpServer())
      .get('/auth/user')
      .set('Authorization', `Bearer ${token}`);
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

  it('should not retrieve user password on create', async () => {
    const userDto: CreateUserDto = {
      password: '1234',
      username: `test-user-${new Date().getTime()}`,
    };
    const res = await sendSignUpRequest(userDto);
    expect(res.status).toBe(HttpStatus.CREATED);
    const user = res.body as User;
    expect(user.id).toBeDefined();
    expect(user.username).toMatch(userDto.username);
    expect(user.password).toBeUndefined();
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

  it('should return access token on successful login', async () => {
    const userDto: CreateUserDto = {
      password: '12345',
      username: `test-user-1`,
    };
    await sendSignUpRequest(userDto);
    const res = await sendSignInRequest(userDto);
    expect(res.status).toBe(HttpStatus.OK);
    const body = res.body as { accessToken: string };
    expect(body.accessToken).toBeDefined();
    expect(typeof body.accessToken).toBe('string');
  });

  it('should return bad request if username is incorrect', async () => {
    const userDto: CreateUserDto = {
      password: '12345',
      username: `test-user-1`,
    };
    await sendSignUpRequest(userDto);
    const res = await sendSignInRequest({
      ...userDto,
      username: `test-user-2`,
    });
    expect(res.ok).toBeFalsy();
  });

  it('should return bad request if password is incorrect', async () => {
    const userDto: CreateUserDto = {
      password: '12345',
      username: `test-user-1`,
    };
    await sendSignUpRequest(userDto);
    const res = await sendSignInRequest({
      ...userDto,
      password: `12346`,
    });
    expect(res.ok).toBeFalsy();
  });

  it('should return auth user', async () => {
    const userDto: SignInDto = {
      password: '12345',
      username: `test-user-1`,
      fcmToken: 'fcm-token-1',
    };
    await sendSignUpRequest(userDto);
    const res = await sendSignInRequest(userDto);
    const body = res.body as { accessToken: string };
    const authUser = (await sendGetAuthUserRequest(body.accessToken))
      .body as User;
    expect(authUser).toBeDefined();
    expect(authUser.username).toBe(userDto.username);
    expect(authUser.fcmToken).toBe(userDto.fcmToken);
  });

  it('should return unauthorized when retrieveing auth user and token is invalid', async () => {
    const res = await sendGetAuthUserRequest('');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  const sendSignOutRequest = (token: string) => {
    return request(app.getHttpServer())
      .post('/auth/signOut')
      .set('Authorization', `Bearer ${token}`);
  };

  it('should successfully sign out and clear fcm token', async () => {
    const userDto: SignInDto = {
      password: '12345',
      username: `test-user-${new Date().getTime()}`,
      fcmToken: 'fcm-token-to-clear',
    };
    await sendSignUpRequest(userDto);
    const signInRes = await sendSignInRequest(userDto);
    const { accessToken } = signInRes.body as { accessToken: string };

    const preUser = (await sendGetAuthUserRequest(accessToken)).body as User;
    expect(preUser.fcmToken).toBe('fcm-token-to-clear');

    const signOutRes = await sendSignOutRequest(accessToken);
    expect(signOutRes.status).toBe(HttpStatus.NO_CONTENT);

    const postUser = (await sendGetAuthUserRequest(accessToken)).body as User;
    expect(postUser.fcmToken).toBeNull();
  });

  it('should return unauthorized when signing out without token', async () => {
    const res = await request(app.getHttpServer()).post('/auth/signOut');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return unauthorized when signing out with invalid token', async () => {
    const res = await sendSignOutRequest('invalid-token');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
