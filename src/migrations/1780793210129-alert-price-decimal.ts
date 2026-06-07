import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertPriceDecimal1780793210129 implements MigrationInterface {
  name = 'AlertPriceDecimal1780793210129';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts"
      ALTER COLUMN "price" TYPE numeric(10, 2),
      ALTER COLUMN "price" SET NOT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts"
      ALTER COLUMN "price" TYPE integer,
      ALTER COLUMN "price" SET NOT NULL;`,
    );
  }
}
