import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { type Request } from 'express';
import { User } from '@/auth/entities/user.entity';
import { AuthGuard } from '@/auth/auth.guard';
import { Alert, AlertResponse } from './entities/alert.entity';
import { ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { OnEvent } from '@nestjs/event-emitter';
import { type WsStocksTradeData } from '@/stocks/dto/get-stocks.dto';

@UseGuards(AuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiCreatedResponse({ type: () => AlertResponse })
  create(
    @Body() createAlertDto: CreateAlertDto,
    @Req() request: Request,
  ): Promise<Alert> {
    return this.alertsService.create({
      ...createAlertDto,
      userId: (request['user'] as User).id,
    });
  }

  @Get()
  @ApiResponse({ status: 200, type: [AlertResponse] })
  findAll(@Req() request: Request): Promise<Alert[]> {
    const user = request['user'] as User;
    return this.alertsService.findAll(user.id);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, type: () => AlertResponse })
  remove(@Req() request: Request, @Param('id') id: string) {
    const user = request['user'] as User;
    return this.alertsService.remove(+id, user.id);
  }

  @OnEvent('trade.update')
  handleTradeUpdate(data: WsStocksTradeData) {
    // send notifications
  }
}
