import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  GetStocksDto,
  RecommendationWithQuote,
  StockSearchResponse,
} from './dto/get-stocks.dto';
import { ApiResponse } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: () => StockSearchResponse })
  async getStocks(@Query() params: GetStocksDto) {
    return this.stocksService.getStocks(params.search);
  }

  @Get(':symbol')
  @ApiResponse({ status: HttpStatus.OK, type: () => RecommendationWithQuote })
  async getStockInfo(@Param('symbol') symbol: string) {
    return this.stocksService.getStockInfo(symbol);
  }
}
