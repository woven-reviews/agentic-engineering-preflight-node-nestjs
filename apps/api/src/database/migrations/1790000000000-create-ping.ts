import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePing1790000000000 implements MigrationInterface {
  name = "CreatePing1790000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE "ping" ("id" serial PRIMARY KEY)');
    await queryRunner.query('INSERT INTO "ping" DEFAULT VALUES');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "ping"');
  }
}
