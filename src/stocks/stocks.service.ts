import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AxiosInstance } from 'axios';
import { StockSearchResponse } from './dto/get-stocks.dto';

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
        params: { q: search },
      })
    ).data;
  }
}
