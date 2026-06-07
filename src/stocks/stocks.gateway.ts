import { Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { RawData, WebSocket } from 'ws';
import { ConfigService } from '@nestjs/config';
import { WsStocksData } from './dto/get-stocks.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

@WebSocketGateway()
export class StocksGateway {
  client: WebSocket;
  logger = new Logger(StocksGateway.name);
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.connect();
  }

  private connect(): void {
    this.client = new WebSocket(
      `${this.configService.getOrThrow<string>('FINNHUB_WS_URL')}?token=${this.configService.get<string>('FINNHUB_API_KEY')}`,
    );
    this.client.on('open', () => {
      this.reconnectAttempts = 0;
      this.logger.log('WebSocket connected');
    });
    this.client.on('close', () => {
      this.logger.log('WebSocket disconnected');
      this.scheduleReconnect();
    });
    this.client.on('error', (error) => {
      this.logger.log('WebSocket error', error);
      this.scheduleReconnect();
    });
    this.client.on('message', (data) => {
      this.handleMessage(this.parseMessage(data));
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts += 1;
    this.logger.log(`Reconnecting to WebSocket in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
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
