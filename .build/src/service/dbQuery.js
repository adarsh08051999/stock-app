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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBQuery = void 0;
const db_1 = __importDefault(require("../db"));
const stockData_1 = __importDefault(require("../models/stockData"));
const stockOldData_1 = __importDefault(require("../models/stockOldData"));
class DBQuery {
    constructor() {
        this.connectDb = () => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (this.entityManager !== undefined && this.entityManager.connection.isConnected) {
                    resolve();
                    return;
                }
                db_1.default.Ready.then(() => {
                    this.entityManager = db_1.default.getManager();
                    resolve();
                }).catch(err => {
                    console.log(`While Getting entity manager: ${err.message}`);
                    reject(err);
                });
            });
        });
    }
    getEligibleStockToBuy() {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let temp = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .select('StockData')
                    .from(stockData_1.default, 'StockData')
                    .where('StockData.isRemoved = false')
                    .andWhere('StockData.toBuy = true')
                    .getMany();
                let result = [];
                temp.forEach(entry => {
                    let z = { stockName: entry.stockName, stockSymbol: entry.stockSymbol, budget: entry.budget, stockId: entry.stockId };
                    result.push(z);
                });
                resolve(result);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    getAllDates() {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let res = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .select('StockOldData.date')
                    .distinct(true)
                    .from(stockOldData_1.default, 'StockOldData')
                    .getRawMany();
                resolve(res);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    fetchStockSymbolFromStockIds(stockIds) {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let temp = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .select('StockData')
                    .from(stockData_1.default, 'StockData')
                    .where('StockData.stockId IN (:...ids)', { ids: stockIds })
                    .getMany();
                let result = {};
                temp.forEach(entry => {
                    result[entry.stockId] = entry.stockSymbol;
                });
                resolve(result);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    updateBoughtStock(stockIds) {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .from(stockData_1.default, 'StockData')
                    .update('StockData')
                    .set({ toBuy: false })
                    .where('stockId IN (:...ids)', { ids: stockIds })
                    .execute();
                resolve();
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    resetSoldStock(stockIds) {
        return new Promise((resolve, reject) => {
            let a = new Date();
            let days = 4;
            a.setDate(a.getDate() - days);
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let res = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .from(stockData_1.default, 'StockData')
                    .update('StockData')
                    .set({ toBuy: true })
                    .where('toBuy = false')
                    .andWhere('stockId NOT IN (:...ids)', { ids: stockIds })
                    .andWhere('updatedAt <= :a', { a })
                    .execute();
                resolve(res);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    getAllDWH() {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let temp = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .select('StockData')
                    .from(stockData_1.default, 'StockData')
                    .getMany();
                resolve(temp);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    getAll() {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let temp = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .select('StockData')
                    .from(stockData_1.default, 'StockData')
                    .getMany();
                let result = [];
                temp.forEach(entry => {
                    let z = { stockName: entry.stockName, stockSymbol: entry.stockSymbol, stockId: entry.stockId };
                    result.push(z);
                });
                resolve(result);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    updateDwh(stockId, budgetVal, isRemovedVal) {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .from(stockData_1.default, 'StockData')
                    .update('StockData')
                    .set({ budget: budgetVal, isRemoved: isRemovedVal })
                    .where('stockId IN (:...ids)', { ids: [stockId] })
                    .execute();
                resolve();
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    deleteOldData() {
        return new Promise((resolve, reject) => {
            let a = new Date();
            let days = 14;
            a.setDate(a.getDate() - days);
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let r = yield this.entityManager
                    .createQueryBuilder()
                    .delete()
                    .from(stockOldData_1.default)
                    .where('updatedAt <= :a', { a })
                    .execute();
                let count = (r === null || r === void 0 ? void 0 : r.affected) ? r.affected : 0;
                resolve(count);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    fetchOldData(date) {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let temp = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .select('StockOldData')
                    .from(stockOldData_1.default, 'StockOldData')
                    .where(`StockOldData.date = '${date}'`)
                    .getMany();
                resolve(temp === null || temp === void 0 ? void 0 : temp.length);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    deleteStockDWH(ID) {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .delete()
                    .from(stockData_1.default)
                    .where('id = :ID', { ID })
                    .execute();
                resolve();
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    insertStockDWH(stockData) {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .insert()
                    .into(stockData_1.default)
                    .values(stockData)
                    .execute();
                resolve();
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    insertOldDataOfStock(stockData) {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .insert()
                    .into(stockOldData_1.default)
                    .values(stockData)
                    .execute();
                resolve();
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    getPrevNifty(stockSymbol) {
        return new Promise((resolve, reject) => {
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let res = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .select('StockOldData')
                    .from(stockOldData_1.default, 'StockOldData')
                    .where(`StockOldData.stockSymbol = '${stockSymbol}'`)
                    .getOne();
                resolve(res);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
    getAllOldData(oldDays) {
        return new Promise((resolve, reject) => {
            let d = new Date();
            let currentOffset = d.getTimezoneOffset();
            let ISTOffset = 330;
            d = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);
            d.setDate(d.getDate() - oldDays);
            if (d.getDay() == 0) {
                d.setDate(d.getDate() - 2);
            }
            else if (d.getDay() == 6) {
                d.setDate(d.getDate() - 1);
            }
            this.connectDb()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                let res = yield db_1.default
                    .getManager()
                    .createQueryBuilder()
                    .select('StockOldData')
                    .from(stockOldData_1.default, 'StockOldData')
                    .where(`StockOldData.date = '${d.toISOString().split('T')[0]}'`)
                    .getMany();
                resolve(res);
            }))
                .catch(err => {
                reject(err);
            });
        });
    }
}
exports.DBQuery = DBQuery;
