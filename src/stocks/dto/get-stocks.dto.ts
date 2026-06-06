import { IsNotEmpty } from 'class-validator';

export class GetStocksDto {
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
