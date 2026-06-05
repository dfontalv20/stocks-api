import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertsRepository: Repository<Alert>,
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
}
