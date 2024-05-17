import {MigrationInterface, QueryRunner} from "typeorm";

export class stockDB1706735277206 implements MigrationInterface {
    name = 'stockDB1706735277206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stock_data" ("id" SERIAL NOT NULL, "stockName" character varying NOT NULL, "stockSymbol" character varying NOT NULL, "stockId" integer NOT NULL, "toBuy" boolean NOT NULL DEFAULT 'true', "budget" integer NOT NULL DEFAULT '0', "netLifetimeEarnings" integer NOT NULL DEFAULT '0', "isRemoved" boolean NOT NULL DEFAULT 'false', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1366dbd374829c34ab2dc4c661b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_44bb6337ca38b01de14900bb54" ON "stock_data" ("stockId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2ea5e7a6cbd664f2f77a23ae88" ON "stock_data" ("toBuy") `);
        await queryRunner.query(`CREATE INDEX "IDX_722dcf249446c1c987140b37d6" ON "stock_data" ("isRemoved") `);
        await queryRunner.query(`CREATE TABLE "stock_old_data" ("id" SERIAL NOT NULL, "stockName" character varying NOT NULL, "stockSymbol" character varying NOT NULL, "stockId" integer NOT NULL, "closePrice" double precision NOT NULL, "date" character varying NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4bf995a9fce4c03136bdd0d931f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9f71f383f41b5d1e43b9e678ee" ON "stock_old_data" ("stockId", "date") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_9f71f383f41b5d1e43b9e678ee"`);
        await queryRunner.query(`DROP TABLE "stock_old_data"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_722dcf249446c1c987140b37d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ea5e7a6cbd664f2f77a23ae88"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44bb6337ca38b01de14900bb54"`);
        await queryRunner.query(`DROP TABLE "stock_data"`);
    }

}
