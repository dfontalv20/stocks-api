import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule, typeOrmConfig } from '../app.module';
import { dbOptionsSqlite } from '../data-source';
export const addAppConfig = (app: INestApplication) => {
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(new Reflector()));
};

export const createTestModule = () => {
  const module = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(typeOrmConfig)
    .useModule(TypeOrmModule.forRoot(dbOptionsSqlite));
  return module;
};

export const createTestApp = async () => {
  const module = await createTestModule().compile();
  const app = module.createNestApplication();
  addAppConfig(app);
  return app;
};
