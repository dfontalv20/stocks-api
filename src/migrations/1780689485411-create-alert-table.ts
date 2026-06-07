import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertTable1780689485411 implements MigrationInterface {
  name = 'CreateAlertTable1780689485411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "alerts" ("id" SERIAL NOT NULL, "stock" character varying NOT NULL, "price" integer NOT NULL, "notifiedAt" TIMESTAMP, "userId" integer NOT NULL, CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_f2678f7b11e5128abbbc4511906" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_f2678f7b11e5128abbbc4511906"`,
    );
    await queryRunner.query(`DROP TABLE "alerts"`);
  }
}
