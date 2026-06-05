import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { dbOptionsSqlite } from '../data-source';

export const addAppConfig = (app: INestApplication) => {
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(new Reflector()));
};

export const createTestApp = async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [TypeOrmModule.forRoot(dbOptionsSqlite), AppModule],
  }).compile();
  const app = module.createNestApplication();
  addAppConfig(app);
  return app;
};
