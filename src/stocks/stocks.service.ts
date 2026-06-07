import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AxiosInstance } from 'axios';
import {
  FinnhubQuote,
  Quote,
  RecommendationTrend,
  RecommendationWithQuote,
  StockSearchResponse,
} from './dto/get-stocks.dto';

@Injectable()
export class StocksService {
  private client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.client = axios.create({
      baseURL: this.config.getOrThrow<string>('FINNHUB_API_URL'),
      headers: {
        'X-Finnhub-Token': this.config.getOrThrow<string>('FINNHUB_API_KEY'),
      },
    });
  }

  async getStocks(search: string): Promise<StockSearchResponse> {
    return (
      await this.client.get<StockSearchResponse>('/search', {
        params: { q: search, exchange: 'US' },
      })
    ).data;
  }

  async getStockInfo(symbol: string): Promise<RecommendationWithQuote> {
    const [quote, recommendations] = await Promise.all([
      this.client.get<FinnhubQuote>('/quote', { params: { symbol } }),
      this.client.get<RecommendationTrend[]>('/stock/recommendation', {
        params: { symbol },
      }),
    ]);
    return {
      recommendations: recommendations.data,
      quote: this.toQuote(quote.data),
    };
  }

  private toQuote(fq: FinnhubQuote): Quote {
    return {
      currentPrice: fq.c,
      highPriceOfTheDay: fq.h,
      lowPriceOfTheDay: fq.l,
      openPriceOfTheDay: fq.o,
      previousClosePrice: fq.pc,
      change: fq.d,
      percentChange: fq.dp,
    };
  }
}
