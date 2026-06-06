import { addAppConfig } from '../utils/app';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { StockSearchResponse } from './dto/get-stocks.dto';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbOptionsSqlite } from '@/data-source';
import { AppModule } from '@/app.module';
import { StocksService } from './stocks.service';

describe('StocksModule', () => {
  let app: INestApplication;
  let accessToken: string;

  const createUser = async (suffix = `${new Date().getTime()}`) => {
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

  const sendGetStocksRequest = (token: string, query: string) => {
    return request(app.getHttpServer())
      .get(`/stocks${query}`)
      .set('Authorization', `Bearer ${token}`);
  };

  beforeEach(async () => {
    const result: StockSearchResponse = {
      result: [{ description: '', displaySymbol: '', symbol: '', type: '' }],
      count: 1,
    };
    const mockStocksService = {
      getStocks: jest.fn(() => Promise.resolve(result)),
    } satisfies Partial<StocksService>;
    const module = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(dbOptionsSqlite), AppModule],
    })
      .overrideProvider(StocksService)
      .useValue(mockStocksService)
      .compile();
    app = module.createNestApplication();
    addAppConfig(app);
    await app.init();
    accessToken = await createUser();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return a list of stocks', async () => {
    const res = await sendGetStocksRequest(accessToken, '?search="a"');
    expect(res.ok).toBeTruthy();
    expect(res.body).toBeDefined();
    expect((res.body as StockSearchResponse).result).toBeDefined();
  });

  it('should return unauthorized when no token is provided', async () => {
    const res = await request(app.getHttpServer()).get('/stocks?search="a"');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return unauthorized when an invalid token is provided', async () => {
    const res = await sendGetStocksRequest('invalid-token', '?search="a"');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return response with count and result properties', async () => {
    const res = await sendGetStocksRequest(accessToken, '?search="a"');
    expect(res.ok).toBeTruthy();
    const body = res.body as StockSearchResponse;
    expect(body.count).toBeDefined();
    expect(typeof body.count).toBe('number');
    expect(Array.isArray(body.result)).toBeTruthy();
  });

  it('should return stock items with required fields', async () => {
    const res = await sendGetStocksRequest(accessToken, '?search="apple"');
    expect(res.ok).toBeTruthy();
    const body = res.body as StockSearchResponse;
    if (body.result.length > 0) {
      const item = body.result[0];
      expect(item.description).toBeDefined();
      expect(item.displaySymbol).toBeDefined();
      expect(item.symbol).toBeDefined();
      expect(item.type).toBeDefined();
    }
  });

  it('should handle search with no query parameter', async () => {
    const res = await sendGetStocksRequest(accessToken, '');
    expect(res.ok).toBeFalsy();
  });
});
