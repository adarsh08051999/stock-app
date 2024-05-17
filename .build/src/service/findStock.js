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
exports.FindStockService = void 0;
const HSWebSocket_1 = require("../controllers/HSWebSocket");
const dbQuery_1 = require("./dbQuery");
class FindStockService extends dbQuery_1.DBQuery {
    constructor() {
        super();
        this.findStockAndBudget = (type, customDays, all) => __awaiter(this, void 0, void 0, function* () {
            let eligibleStocks = yield this.getEligibleStockToBuy();
            let loggingObj = {};
            //algo to fetch the drop of each stock and find the most deserving buying stock--
            let eligibleStocksUpdated = yield this.enrichWithCurrentStat(eligibleStocks, loggingObj, customDays);
            // sort based on market change--
            eligibleStocksUpdated.sort((a, b) => {
                if (a.currentChange && b.currentChange) {
                    if (a.currentChange < b.currentChange) {
                        return -1;
                    }
                    else if (a.currentChange > b.currentChange) {
                        return 1;
                    }
                }
                return 0;
            });
            if (type) {
                eligibleStocksUpdated = eligibleStocksUpdated.filter((x) => x.currentPrice && x.currentPrice <= 300);
                console.log(`Filtered all stock with cost<300`);
            }
            //pick first 3 stocks---
            let topThreeStock = eligibleStocksUpdated.slice(0, 3);
            //get 2 selected from the 3 stocks--
            let topPickStock = this.chooseBestStockToBuy(topThreeStock);
            topPickStock.total_stock_dwh = loggingObj === null || loggingObj === void 0 ? void 0 : loggingObj.total_stock_dwh;
            topPickStock.kotak_stock_data = loggingObj === null || loggingObj === void 0 ? void 0 : loggingObj.kotak_stock_data;
            topPickStock.old_stock_data = loggingObj === null || loggingObj === void 0 ? void 0 : loggingObj.old_stock_data;
            if (all) {
                topPickStock.extras = eligibleStocksUpdated;
            }
            return topPickStock;
        });
        this.getDates = () => __awaiter(this, void 0, void 0, function* () {
            return this.getAllDates();
        });
    }
    getDataOfList(list) {
        return __awaiter(this, void 0, void 0, function* () {
            const socket = new HSWebSocket_1.HSMWebSocket(); // try this may work ---
            yield new Promise((resolve) => setTimeout(resolve, 10000));
            yield socket.onopen();
            yield new Promise((resolve) => setTimeout(resolve, 5000));
            let a = list.join("&");
            socket.setIntermediateStockPrice();
            socket.subscribeStockScrip(a);
            yield new Promise((resolve) => setTimeout(resolve, 5000));
            socket.unsubscribeStockScrip(a);
            let r = socket.getIntermediateStockPrice();
            if (Object.keys(r).length === 0) {
                throw Error(`No data returned for length - ${list.length}`);
            }
            return r;
        });
    }
    enrichWithCurrentStat(eligibleStocks, loggingObj, oldDays) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let list = yield this.getAllOldData(oldDays);
            if (!list || !list.length) {
                throw Error(`No Old data for today's ${oldDays} day back`);
            }
            let list1 = [], list2 = [];
            for (let i = 0; i < Math.min(eligibleStocks.length, 190); i++) {
                list1.push("nse_cm|" + eligibleStocks[i].stockId);
            }
            for (let i = Math.min(190, eligibleStocks.length); i < eligibleStocks.length; i++) {
                list2.push("nse_cm|" + eligibleStocks[i].stockId);
            }
            let r = yield this.getDataOfList(list1);
            if (Object.keys(r).length === 0) {
                throw Error(`websocket data 1 not recieved `);
            }
            yield new Promise((resolve) => setTimeout(resolve, 10000));
            if (list2.length > 0) {
                let r2 = yield this.getDataOfList(list2);
                if (Object.keys(r2).length === 0) {
                    throw Error(`websocket data 2 not recieved `);
                }
                r = Object.assign(Object.assign({}, r2), r);
            }
            console.log(`total(to buy) =  ${eligibleStocks.length} \n kotak data fetch = ${Object.keys(r).length} \n old data available = ${list.length}`);
            loggingObj.total_stock_dwh = eligibleStocks.length;
            loggingObj.kotak_stock_data = Object.keys(r).length;
            loggingObj.old_stock_data = list.length;
            let resp = [];
            for (const stock of eligibleStocks) {
                let index1 = list.findIndex((x) => {
                    return stock.stockId === x.stockId;
                });
                if (!r[stock.stockId] || !((_a = list[index1]) === null || _a === void 0 ? void 0 : _a.closePrice)) {
                    continue;
                }
                let currPrice = parseInt(r[stock.stockId]) / 100;
                let oldPrice = list[index1].closePrice;
                let change = 100 * ((currPrice - oldPrice) / oldPrice);
                let z = stock;
                z.currentChange = change;
                z.currentPrice = currPrice;
                z.oldPrice = oldPrice;
                resp.push(z);
            }
            return resp;
        });
    }
    chooseBestStockToBuy(eligibleStocks) {
        if (Math.abs(eligibleStocks[0].currentChange - eligibleStocks[1].currentChange) > 10) {
            return { firstStock: eligibleStocks[1], secondStock: eligibleStocks[2] };
        }
        return { firstStock: eligibleStocks[0], secondStock: eligibleStocks[1] };
    }
}
exports.FindStockService = FindStockService;
