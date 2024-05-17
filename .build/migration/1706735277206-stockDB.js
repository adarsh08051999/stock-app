"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockDB1706735277206 = void 0;
class stockDB1706735277206 {
    constructor() {
        this.name = 'stockDB1706735277206';
    }
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield queryRunner.query(`CREATE TABLE "stock_data" ("id" SERIAL NOT NULL, "stockName" character varying NOT NULL, "stockSymbol" character varying NOT NULL, "stockId" integer NOT NULL, "toBuy" boolean NOT NULL DEFAULT 'true', "budget" integer NOT NULL DEFAULT '0', "netLifetimeEarnings" integer NOT NULL DEFAULT '0', "isRemoved" boolean NOT NULL DEFAULT 'false', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1366dbd374829c34ab2dc4c661b" PRIMARY KEY ("id"))`);
            yield queryRunner.query(`CREATE UNIQUE INDEX "IDX_44bb6337ca38b01de14900bb54" ON "stock_data" ("stockId") `);
            yield queryRunner.query(`CREATE INDEX "IDX_2ea5e7a6cbd664f2f77a23ae88" ON "stock_data" ("toBuy") `);
            yield queryRunner.query(`CREATE INDEX "IDX_722dcf249446c1c987140b37d6" ON "stock_data" ("isRemoved") `);
            yield queryRunner.query(`CREATE TABLE "stock_old_data" ("id" SERIAL NOT NULL, "stockName" character varying NOT NULL, "stockSymbol" character varying NOT NULL, "stockId" integer NOT NULL, "closePrice" double precision NOT NULL, "date" character varying NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4bf995a9fce4c03136bdd0d931f" PRIMARY KEY ("id"))`);
            yield queryRunner.query(`CREATE UNIQUE INDEX "IDX_9f71f383f41b5d1e43b9e678ee" ON "stock_old_data" ("stockId", "date") `);
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield queryRunner.query(`DROP INDEX "public"."IDX_9f71f383f41b5d1e43b9e678ee"`);
            yield queryRunner.query(`DROP TABLE "stock_old_data"`);
            yield queryRunner.query(`DROP INDEX "public"."IDX_722dcf249446c1c987140b37d6"`);
            yield queryRunner.query(`DROP INDEX "public"."IDX_2ea5e7a6cbd664f2f77a23ae88"`);
            yield queryRunner.query(`DROP INDEX "public"."IDX_44bb6337ca38b01de14900bb54"`);
            yield queryRunner.query(`DROP TABLE "stock_data"`);
        });
    }
}
exports.stockDB1706735277206 = stockDB1706735277206;
