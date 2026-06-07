import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFcmTokenColumn1780719067786 implements MigrationInterface {
  name = 'AddFcmTokenColumn1780719067786';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "fcmToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fcmToken"`);
  }
}
