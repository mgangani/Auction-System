import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774941825698 implements MigrationInterface {
    name = 'Init1774941825698'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "provider" character varying NOT NULL DEFAULT 'LOCAL'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);
    }

}
