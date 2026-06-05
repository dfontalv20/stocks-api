import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetStocksDto } from './dto/get-stocks.dto';

@UseGuards(AuthGuard)
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  async getStocks(@Query() params: GetStocksDto) {
    return this.stocksService.getStocks(params.search);
  }
}
