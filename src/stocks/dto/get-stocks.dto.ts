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
