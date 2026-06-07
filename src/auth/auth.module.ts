import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [AuthService, AuthGuard],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
})
export class AuthModule {}
