import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule, typeOrmConfig } from '../../src/app.module';
import { dbOptionsSqlite } from '../../src/data-source';
import { addAppConfig } from '@/config';

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
