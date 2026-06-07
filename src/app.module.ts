import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { dbOptions } from './data-source';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { StocksModule } from './stocks/stocks.module';
import { AlertsModule } from './alerts/alerts.module';
import { StocksGateway } from './stocks/stocks.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ global: true }),
    TypeOrmModule.forRoot({ ...dbOptions, autoLoadEntities: true }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '1h') as StringValue,
        },
      }),
    }),
    AuthModule,
    FirebaseModule,
    StocksModule,
    AlertsModule,
  ],
  providers: [StocksGateway],
})
export class AppModule {}
