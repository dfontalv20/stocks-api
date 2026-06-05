import { DataSource, type DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

config();
const configService = new ConfigService();
console.log(__dirname + '/migrations/**/*{.js,.ts}');
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

export default new DataSource(dbOptions);
