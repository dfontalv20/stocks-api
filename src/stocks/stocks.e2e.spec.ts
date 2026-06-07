import { addAppConfig, createTestModule } from '../utils/app';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import {
  Quote,
  RecommendationTrend,
  RecommendationWithQuote,
  StockSearchResponse,
} from './dto/get-stocks.dto';
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

  const sendGetStockInfoRequest = (symbol: string, token = accessToken) => {
    return request(app.getHttpServer())
      .get(`/stocks/${symbol}`)
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
    const quote: Quote = {
      currentPrice: 261.74,
      highPriceOfTheDay: 263.31,
      lowPriceOfTheDay: 260.68,
      openPriceOfTheDay: 261.07,
      previousClosePrice: 259.45,
      change: 2.29,
      percentChange: 0.8828,
    };
    const recommendationsWithQuote: RecommendationWithQuote = {
      recommendations,
      quote,
    };
    const mockStocksService = {
      getStocks: jest.fn(() => Promise.resolve(result)),
      getStockInfo: jest.fn(() => Promise.resolve(recommendationsWithQuote)),
    } satisfies Partial<StocksService>;
    const module = await createTestModule()
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

  it('should return stock info for a given symbol', async () => {
    const res = await sendGetStockInfoRequest('AAPL');
    expect(res.ok).toBeTruthy();
    const body = res.body as RecommendationWithQuote;
    expect(body).toBeDefined();
    expect(Array.isArray(body.recommendations)).toBeTruthy();
  });

  it('should return unauthorized for stock info when no token is provided', async () => {
    const res = await request(app.getHttpServer()).get('/stocks/AAPL');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return unauthorized for stock info when an invalid token is provided', async () => {
    const res = await sendGetStockInfoRequest('AAPL', 'invalid-token');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should return recommendation and quote items with required fields', async () => {
    const res = await sendGetStockInfoRequest('AAPL');
    expect(res.ok).toBeTruthy();
    const body = res.body as RecommendationWithQuote;
    expect(body.recommendations.length).toBeGreaterThan(0);
    const item = body.recommendations[0];
    expect(item.symbol).toBeDefined();
    expect(item.buy).toBeDefined();
    expect(item.hold).toBeDefined();
    expect(item.period).toBeDefined();
    expect(item.sell).toBeDefined();
    expect(item.strongBuy).toBeDefined();
    expect(item.strongSell).toBeDefined();
    expect(body.quote).toBeDefined();
    expect(body.quote.currentPrice).toBeDefined();
    expect(body.quote.highPriceOfTheDay).toBeDefined();
    expect(body.quote.lowPriceOfTheDay).toBeDefined();
    expect(body.quote.openPriceOfTheDay).toBeDefined();
    expect(body.quote.previousClosePrice).toBeDefined();
    expect(body.quote.change).toBeDefined();
    expect(body.quote.percentChange).toBeDefined();
  });
});
