import { addAppConfig } from '../utils/app';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { RecommendationTrend, StockSearchResponse } from './dto/get-stocks.dto';
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

  const sendGetStocksRequest = (query: string, token = accessToken) => {
    return request(app.getHttpServer())
      .get(`/stocks${query}`)
      .set('Authorization', `Bearer ${token}`);
  };

  const sendGetRecommendationsRequest = (
    query: string,
    token = accessToken,
  ) => {
    return request(app.getHttpServer())
      .get(`/stocks/recommendations${query}`)
      .set('Authorization', `Bearer ${token}`);
  };

  beforeEach(async () => {
    const result: StockSearchResponse = {
      result: [{ description: '', displaySymbol: '', symbol: '', type: '' }],
      count: 1,
    };
    const recommendations: RecommendationTrend[] = [
      {
        symbol: 'AAPL',
        buy: 24,
        hold: 7,
        period: '2025-03-01',
        sell: 0,
        strongBuy: 13,
        strongSell: 0,
      },
    ];
    const mockStocksService = {
      getStocks: jest.fn(() => Promise.resolve(result)),
      getRecommendations: jest.fn(() => Promise.resolve(recommendations)),
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
    jest.resetAllMocks();
    await app.close();
  });

  it('should return a list of stocks', async () => {
    const res = await sendGetStocksRequest('?search="a"');
    expect(res.ok).toBeTruthy();
    expect(res.body).toBeDefined();
    expect((res.body as StockSearchResponse).result).toBeDefined();
  });

  it('should return unauthorized when no token is provided', async () => {
    const res = await request(app.getHttpServer()).get('/stocks?search="a"');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return unauthorized when an invalid token is provided', async () => {
    const res = await sendGetStocksRequest('?search="a"', 'invalid-token');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return response with count and result properties', async () => {
    const res = await sendGetStocksRequest('?search="a"');
    expect(res.ok).toBeTruthy();
    const body = res.body as StockSearchResponse;
    expect(body.count).toBeDefined();
    expect(typeof body.count).toBe('number');
    expect(Array.isArray(body.result)).toBeTruthy();
  });

  it('should return stock items with required fields', async () => {
    const res = await sendGetStocksRequest('?search="apple"');
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
    const res = await sendGetStocksRequest('');
    expect(res.ok).toBeFalsy();
  });

  it('should return a list of recommendations', async () => {
    const res = await sendGetRecommendationsRequest('?symbol=AAPL');
    expect(res.ok).toBeTruthy();
    expect(res.body).toBeDefined();
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('should return unauthorized for recommendations when no token is provided', async () => {
    const res = await request(app.getHttpServer()).get(
      '/stocks/recommendations?symbol=AAPL',
    );
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return unauthorized for recommendations when an invalid token is provided', async () => {
    const res = await sendGetRecommendationsRequest(
      '?symbol=AAPL',
      'invalid-token',
    );
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return recommendation items with required fields', async () => {
    const res = await sendGetRecommendationsRequest('?symbol=AAPL');
    expect(res.ok).toBeTruthy();
    const body = res.body as RecommendationTrend[];
    expect(body.length).toBeGreaterThan(0);
    const item = body[0];
    expect(item.symbol).toBeDefined();
    expect(item.buy).toBeDefined();
    expect(item.hold).toBeDefined();
    expect(item.period).toBeDefined();
    expect(item.sell).toBeDefined();
    expect(item.strongBuy).toBeDefined();
    expect(item.strongSell).toBeDefined();
  });

  it('should handle recommendations with no symbol parameter', async () => {
    const res = await sendGetRecommendationsRequest('');
    expect(res.ok).toBeFalsy();
  });
});
