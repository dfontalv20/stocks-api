import { Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { RawData, WebSocket } from 'ws';
import { ConfigService } from '@nestjs/config';
import { WsStocksData } from './dto/get-stocks.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway()
export class StocksGateway {
  client: WebSocket;
  logger = new Logger(StocksGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.client = new WebSocket(
      `${this.configService.getOrThrow<string>('FINNHUB_WS_URL')}?token=${this.configService.get<string>('FINNHUB_API_KEY')}`,
    );
    this.client.on('open', () => {
      this.logger.log('WebSocket connected');
    });
    this.client.on('close', () => {
      this.logger.log('WebSocket disconnected');
    });
    this.client.on('error', (error) => {
      this.logger.log('WebSocket error', error);
    });
    this.client.on('message', (data) => {
      this.handleMessage(this.parseMessage(data));
    });
  }

  private parseMessage(data: RawData): WsStocksData {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return JSON.parse(data.toString()) as WsStocksData;
  }

  handleMessage(data: WsStocksData): void {
    this.logger.log(data);
    if (data.type === 'trade') {
      this.eventEmitter.emit('trade.update', data);
    }
  }
}
