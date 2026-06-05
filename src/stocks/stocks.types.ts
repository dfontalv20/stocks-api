export interface StockSearchResponse {
  result: StockSearchItem[];
  count: number;
}

export interface StockSearchItem {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}
