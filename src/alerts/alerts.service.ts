import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { In, Repository } from 'typeorm';
import { WsStocksData } from '@/stocks/dto/get-stocks.dto';
import { FirebaseService } from '@/firebase/firebase.service';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertsRepository: Repository<Alert>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async create(createAlertDto: CreateAlertDto & { userId: number }) {
    const alert = this.alertsRepository.create({
      ...createAlertDto,
      user: { id: createAlertDto.userId },
    });
    return this.alertsRepository.save(alert);
  }

  findAll(userId: number) {
    return this.alertsRepository.findBy({ user: { id: userId } });
  }

  async remove(id: number, userId: number) {
    const alert = await this.alertsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }
    if (alert.user.id !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.alertsRepository.delete(alert);
  }

  async checkTrades(info: WsStocksData) {
    if (info.type !== 'trade') {
      return;
    }
    const newPrices = new Map<string, number>();
    info.data.forEach((trade) => {
      newPrices.set(trade.s, trade.p);
    });
    const alerts = await this.alertsRepository.find({
      where: { stock: In([...newPrices.keys()]) },
      relations: { user: true },
    });
    const alertsToNotify = alerts.filter((alert) => {
      const newPrice = newPrices.get(alert.stock);
      if (newPrice === undefined) return false;
      return alert.price < newPrice;
    });

    if (alertsToNotify.length === 0) return;
    await this.notifyAlert(alertsToNotify);
  }

  async notifyAlert(alerts: Alert[]) {
    const result = await this.firebaseService.sendNotification(
      alerts
        .filter((alert) => !!alert.user.fcmToken)
        .map((alert) => ({
          to: alert.user.fcmToken,
          title: 'Trade Alert',
          body: `The stock ${alert.stock} has reached your target price of ${alert.price}`,
        })),
    );
    const successfulAlerts: Alert[] = [];
    result.responses.forEach((response, index) => {
      if (!response.success) return;
      alerts[index].notifiedAt = new Date();
      successfulAlerts.push(alerts[index]);
    });
    await this.alertsRepository.save(successfulAlerts);
  }
}
