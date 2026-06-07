import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  GetRecommendationDto,
  GetStocksDto,
  RecommendationTrend,
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

  @Get('recommendations')
  @ApiResponse({ status: HttpStatus.OK, type: [RecommendationTrend] })
  async getRecommendations(@Query() params: GetRecommendationDto) {
    return this.stocksService.getRecommendations(params.symbol);
  }
}
