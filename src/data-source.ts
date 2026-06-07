import { DataSource, type DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { types } from 'pg';

types.setTypeParser(types.builtins.NUMERIC, (val) => parseFloat(val));

config({ quiet: true });
const configService = new ConfigService();
export const dbOptions: DataSourceOptions = {
  entities: [__dirname + '/**/*.entity.ts'],
  synchronize: false,
  type: 'postgres',
  url: configService.getOrThrow<string>('DB_CONNECTION'),
  migrations: [__dirname + '/migrations/**/*{.js,.ts}'],
  migrationsRun: false,
  migrationsTableName: 'migrations',
  migrationsTransactionMode: 'all',
};

export const dbOptionsSqlite: DataSourceOptions = {
  entities: [__dirname + '/**/*.entity.ts'],
  synchronize: true,
  type: 'better-sqlite3',
  database: ':memory:',
  dropSchema: true,
};

export default new DataSource(dbOptions);
