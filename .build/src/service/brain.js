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
const order_1 = require("../controllers/order");
const findStock_1 = require("./findStock");
const marketData_1 = require("./marketData");
const updateDb_1 = require("./updateDb");
const FileSystem = require("fs");
class BrainService {
    constructor() {
        this.dummyVal = 0;
        this.filePath = "files/data.json";
        this.keepRunning = true;
        this.dateToday = new Date().toISOString().split("T")[0];
        this.marketDataService = new marketData_1.MarketDataService();
        this.updateDbService = new updateDb_1.UpdateDbService();
        this.findStockService = new findStock_1.FindStockService();
        this.orderController = new order_1.OrderController();
    }
    doLog(mssg) {
        console.log("BrainService: " + JSON.stringify(mssg));
    }
    getMaxProcessedNifty() {
        try {
            const MaxProcessedNiftyFromFile = JSON.parse(FileSystem.readFileSync(this.filePath));
            return MaxProcessedNiftyFromFile[this.dateToday] || 0;
        }
        catch (err) {
            console.log(`No file ${err === null || err === void 0 ? void 0 : err.message}`);
        }
        return 0;
    }
    getIsStart() {
        return this.isStarted;
    }
    unsetKeepRunning() {
        this.keepRunning = false;
    }
    setKeepRunning() {
        this.keepRunning = true;
    }
    changeMaxProcessedNifty(change) {
        return __awaiter(this, void 0, void 0, function* () {
            let niftyData = {};
            niftyData[this.dateToday] = change;
            yield FileSystem.writeFile(this.filePath, JSON.stringify(niftyData), (error) => {
                if (error)
                    throw error;
            });
        });
    }
    process(onlyOne) {
        return __awaiter(this, void 0, void 0, function* () {
            let stocks = yield this.findStockService.findStockAndBudget(true, 7 // in-order to get <= 200 current price stock---
            );
            let kData = stocks.kotak_stock_data || 0;
            let dwhData = stocks.total_stock_dwh || 0;
            let oldData = stocks.old_stock_data || 0;
            if (dwhData - oldData > 15 || dwhData - kData > 15) {
                throw Error(`Too few stock checked ${JSON.stringify(stocks)}`);
            }
            let count = 2;
            // let myChosenQuantity = 2;
            this.doLog("Chosen stock - " + JSON.stringify(stocks));
            try {
                yield this.orderController.placeOrderFunctional(stocks.firstStock.stockId, {
                    dq: stocks.firstStock.currentPrice ? Math.floor(500 / (stocks.firstStock.currentPrice)) : 2,
                    quantity: stocks.firstStock.currentPrice ? Math.floor(500 / (stocks.firstStock.currentPrice)) : 2,
                    stock: stocks.firstStock.stockSymbol,
                    customMessage: `stock- is ${stocks.firstStock.stockName}`,
                });
                this.doLog(`Order placed for -1st ${stocks.firstStock.stockId} `);
            }
            catch (err) {
                count = count - 1;
                this.doLog(`Failed to place order-1 ${err.message}`);
            }
            // added to handle single stock buying --- 
            if (onlyOne) {
                if (count === 2) {
                    return true;
                }
                else {
                    return false;
                }
            }
            try {
                yield this.orderController.placeOrderFunctional(stocks.secondStock.stockId, {
                    dq: stocks.secondStock.currentPrice ? Math.floor(600 / (stocks.secondStock.currentPrice)) : 2,
                    quantity: stocks.secondStock.currentPrice ? Math.floor(600 / (stocks.secondStock.currentPrice)) : 2,
                    stock: stocks.secondStock.stockSymbol,
                    customMessage: `stock- is ${stocks.secondStock.stockName}`,
                });
                this.doLog(`Order placed for -2nd  ${stocks.secondStock.stockId} `);
            }
            catch (err) {
                count = count - 1;
                this.doLog(`Failed to place order-2 ${err.message}`);
            }
            if (count > 0) {
                return true;
            }
            return false;
        });
    }
    startProcess(change) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dummyVal < change) {
                return;
            }
            let maxProcessed = this.getMaxProcessedNifty();
            let values = [-0.5, -1, -1.5, -2];
            for (let x of values) {
                if (change <= x && maxProcessed > x) {
                    let orderPlace = yield this.process();
                    if (!orderPlace) {
                        throw Error(`No Order placed`);
                    }
                    this.dummyVal = change;
                    yield this.changeMaxProcessedNifty(change);
                    break;
                }
            }
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isStarted = true;
            try {
                yield this.updateDbService.updateBought();
                this.doLog("updated Bought stock in Portfolio Successfully");
            }
            catch (err) {
                this.doLog("Error in updateBought:please check");
            }
            while (this.keepRunning && this.isPerfectTime()) {
                try {
                    let marketData = yield this.marketDataService.getMarketIndexData();
                    this.doLog(marketData.current_change);
                    yield this.startProcess(marketData.current_change);
                }
                catch (err) {
                    console.log(`BrainService: Error - ${err === null || err === void 0 ? void 0 : err.message}`);
                }
                yield new Promise(resolve => setTimeout(resolve, 5000));
            }
            this.isStarted = false;
        });
    }
    isPerfectTime() {
        let d = new Date();
        let currentOffset = d.getTimezoneOffset();
        let ISTOffset = 330;
        let ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);
        let hour = ISTTime.getHours();
        let min = ISTTime.getMinutes();
        let day = ISTTime.getDay();
        if (day == 0 || day == 6) {
            return false;
        }
        if ((hour === 9 && min > 30) ||
            (hour > 9 && hour < 15) ||
            (hour == 15 && min <= 30)) {
            return true;
        }
        return false;
    }
}
const brain = new BrainService();
exports.default = brain;
