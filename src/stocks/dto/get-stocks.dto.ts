import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class StockSearchItem {
  @ApiProperty()
  description: string;
  @ApiProperty()
  displaySymbol: string;
  @ApiProperty()
  symbol: string;
  @ApiProperty()
  type: string;
}

export class StockSearchResponse {
  @ApiProperty({ type: [StockSearchItem] })
  result: StockSearchItem[];
  @ApiProperty()
  count: number;
}

export class GetStocksDto {
  @ApiProperty()
  @IsNotEmpty()
  search: string;
}

export class RecommendationTrend {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  buy: number;

  @ApiProperty()
  hold: number;

  @ApiProperty()
  period: string;

  @ApiProperty()
  sell: number;

  @ApiProperty()
  strongBuy: number;

  @ApiProperty()
  strongSell: number;
}

export class Quote {
  @ApiProperty()
  currentPrice: number;

  @ApiProperty()
  highPriceOfTheDay: number;

  @ApiProperty()
  lowPriceOfTheDay: number;

  @ApiProperty()
  openPriceOfTheDay: number;

  @ApiProperty()
  previousClosePrice: number;

  @ApiProperty()
  change: number;

  @ApiProperty()
  percentChange: number;
}

export class RecommendationWithQuote {
  @ApiProperty({ type: () => [RecommendationTrend] })
  recommendations: RecommendationTrend[];

  @ApiProperty({ type: () => Quote })
  quote: Quote;
}

export interface WsStocksTradeData {
  /** Last price */
  p: number;
  /** Stock symbol */
  s: string;
  /** Timestamp */
  t: number;
  /** Volume */
  v: number;
}

export interface WsStocksResponse<T extends string = string, D = undefined> {
  data: D;
  type: T;
}

export type WsStocksData =
  | WsStocksResponse<'ping'>
  | WsStocksResponse<'trade', WsStocksTradeData[]>;

export type FinnhubQuote = {
  c: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  d: number;
  dp: number;
};
