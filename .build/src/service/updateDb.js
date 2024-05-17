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
exports.UpdateDbService = void 0;
const dbQuery_1 = require("./dbQuery");
const HSWebSocket_1 = require("../controllers/HSWebSocket");
const portfolio_1 = require("./portfolio");
const login_1 = require("./login");
class UpdateDbService extends dbQuery_1.DBQuery {
    constructor() {
        super();
        this.deleteDb = () => __awaiter(this, void 0, void 0, function* () {
            return yield this.deleteOldData();
        });
        this.updateDb = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let allStock = yield this.getAll();
            let finalList = [];
            let i = 0;
            while (i < allStock.length) {
                let list = [];
                for (let j = i; j < Math.min(allStock.length, i + 198); j++) {
                    list.push("nse_cm|" + allStock[j].stockId);
                }
                console.log(`Processing ${list.length} length with i as ${i} and size 198`);
                i = i + 198;
                let r = yield this.getDataOfList(list);
                for (const y in r) {
                    let index = allStock.findIndex((x) => { return x.stockId === parseInt(y); });
                    if (index === -1) {
                        continue;
                    }
                    let z = {
                        date: new Date().toISOString().split('T')[0],
                        closePrice: parseInt(r[y]) / 100,
                        stockId: parseInt(y),
                        stockSymbol: (_a = allStock[index]) === null || _a === void 0 ? void 0 : _a.stockSymbol,
                        stockName: (_b = allStock[index]) === null || _b === void 0 ? void 0 : _b.stockName,
                    };
                    finalList.push(z);
                }
            }
            console.log(`Final Length of update is ${finalList.length}`);
            yield this.insertOldDataOfStock(finalList);
        });
        this.updateBought = () => __awaiter(this, void 0, void 0, function* () {
            let creds = yield this.loginService.login();
            let portfolio = yield this.portfolioService.getPortfolio(creds);
            let stockIds = [];
            for (const x of portfolio) {
                stockIds.push(x.exchangeIdentifier);
            }
            yield this.updateBoughtStock(stockIds);
            return stockIds;
        });
        this.resetSold = () => __awaiter(this, void 0, void 0, function* () {
            let creds = yield this.loginService.login();
            let portfolio = yield this.portfolioService.getPortfolio(creds);
            let stockIds = [];
            for (const x of portfolio) {
                stockIds.push(x.exchangeIdentifier);
            }
            return yield this.resetSoldStock(stockIds);
        });
        this.updateDWH = (StockDataToInsert) => __awaiter(this, void 0, void 0, function* () {
            return yield this.insertStockDWH(StockDataToInsert);
        });
        this.updateDWHSingleEntry = (stockId) => __awaiter(this, void 0, void 0, function* () {
            return yield this.updateBoughtStock([stockId.toString()]);
        });
        this.loginService = new login_1.LoginService();
        this.portfolioService = new portfolio_1.PortfolioService();
    }
    getDataOfList(list) {
        return __awaiter(this, void 0, void 0, function* () {
            const socket = new HSWebSocket_1.HSMWebSocket(); // try this may work ---
            yield new Promise(resolve => setTimeout(resolve, 12000));
            yield socket.onopen();
            yield new Promise(resolve => setTimeout(resolve, 7000));
            let a = list.join('&');
            socket.setIntermediateStockPrice();
            socket.subscribeStockScrip(a);
            yield new Promise(resolve => setTimeout(resolve, 10000));
            socket.unsubscribeStockScrip(a);
            let r = socket.getIntermediateStockPrice();
            if (Object.keys(r).length === 0) {
                throw Error(`No data returned for length - ${list.length}`);
            }
            return r;
        });
    }
}
exports.UpdateDbService = UpdateDbService;
