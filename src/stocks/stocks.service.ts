import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AxiosInstance } from 'axios';
import { StockSearchResponse } from './stocks.types';

@Injectable()
export class StocksService {
  private client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.client = axios.create({
      headers: {
        'X-Finnhub-Token': this.config.getOrThrow<string>('FINNHUB_API_KEY'),
      },
    });
  }

  async getStocks(search: string): Promise<StockSearchResponse> {
    return (
      await this.client.get<StockSearchResponse>(
        'https://finnhub.io/api/v1/search',
        {
          params: { q: search },
        },
      )
    ).data;
  }
}
