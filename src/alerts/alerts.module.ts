import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { AuthModule } from '@/auth/auth.module';
import { FirebaseModule } from '@/firebase/firebase.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Alert]), FirebaseModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
