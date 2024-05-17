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
exports.OrderController = void 0;
const verror_1 = __importDefault(require("verror"));
const order_1 = require("../models/order");
const login_1 = require("../service/login");
const order_2 = require("../service/order");
const portfolio_1 = require("../service/portfolio");
const updateDb_1 = require("../service/updateDb");
class OrderController {
    calculatePrice(averagePrice) {
        averagePrice = 1.08 * averagePrice;
        let number = Math.floor(averagePrice);
        let firstTwoDecimalDigits = (Math.floor(averagePrice * 100)) % 100;
        if (firstTwoDecimalDigits <= 15) {
            averagePrice = number + 0.15;
        }
        else if (firstTwoDecimalDigits > 15) {
            averagePrice = number + 1.15;
        }
        return averagePrice;
    }
    constructor() {
        this.placeOrder = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.creds = yield this.loginService.login();
                let stockId = request.query.stockId;
                let present = yield this.alreadyInPortfolio(stockId);
                if (present && (!request.query.admin)) {
                    response.status(400).send(`Either stock Id not passed or already bought stock ${JSON.stringify(request.query)}`);
                    return;
                }
                let jData;
                try {
                    jData = this.prepareMktBuyJData(request.query);
                }
                catch (err) {
                    response.status(400).send(`invalid request ${JSON.stringify(request.query)}`);
                    return;
                }
                let res = yield this.orderService.placeOrder(this.creds, jData);
                response.status(200).send(res);
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Order Controller route ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.placeOrderFunctional = (stockId, query) => __awaiter(this, void 0, void 0, function* () {
            this.creds = yield this.loginService.login();
            console.log(`Trying to place order for ${JSON.stringify(query)}`);
            try {
                let present = yield this.alreadyInPortfolio(stockId);
                if (present) {
                    console.log(`Stock already in portfolio ${stockId}`);
                    return;
                }
            }
            catch (err) {
                console.log(`portfolio api down couldn't verify stock in portfolio ${err === null || err === void 0 ? void 0 : err.message}`);
            }
            let jData = this.prepareMktBuyJData(query);
            yield this.orderService.placeOrder(this.creds, jData);
            yield this.updateDbService.updateDWHSingleEntry(stockId);
        });
        this.sellOrder = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.creds = yield this.loginService.login();
                let portfolio = yield this.portfolioService.getPortfolio(this.creds);
                let stockIds = [];
                for (let x of portfolio) {
                    stockIds.push(parseInt(x.exchangeIdentifier));
                }
                let stockNamesIdMap = yield this.orderService.fetchStockSymbolFromStockIds(stockIds);
                let count = 0;
                for (let x of portfolio) {
                    let query = {
                        dq: x.quantity,
                        quantity: x.quantity,
                        stock: stockNamesIdMap[parseInt(x.exchangeIdentifier)],
                        price: this.calculatePrice(x.averagePrice),
                        customMessage: `Sell Order for ->${x.symbol}`
                    };
                    if (!query.stock) {
                        continue;
                    }
                    let jData = this.prepareLimitSellJData(query);
                    try {
                        yield this.orderService.placeOrder(this.creds, jData);
                    }
                    catch (err) {
                        count = count + 1;
                        console.log(`Error in placing sell Order for ${x.symbol}`);
                    }
                }
                response.status(200).send(`successfully completed sell order placing fail for ${count} stocks`);
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Sell Controller route ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.orderService = new order_2.OrderService();
        this.loginService = new login_1.LoginService();
        this.portfolioService = new portfolio_1.PortfolioService();
        this.updateDbService = new updateDb_1.UpdateDbService();
    }
    validateOrder(data) {
        if (data)
            // validate request for budget etc.
            return true;
    }
    prepareMktBuyJData(reqQuery) {
        let data = {
            am: order_1.AMO.NO,
            pt: order_1.OrderType.Market,
            os: order_1.OrderSource.WEB,
            dq: reqQuery.dq || "0",
            ts: reqQuery.stock,
            mp: "0",
            pr: "0",
            qt: reqQuery.quantity || "0",
            rt: "DAY",
            tp: "0",
            tt: "B",
            ig: reqQuery.customMessage,
            es: order_1.ExchangeSegment.NSE,
            pc: order_1.ProductCode.CashAndCarry,
            pf: order_1.PosSqrFlg.N,
        };
        if (!this.validateOrder(data)) {
            throw new verror_1.default("Request is not properly enriched");
        }
        return data;
    }
    prepareLimitSellJData(reqQuery) {
        let data = {
            am: order_1.AMO.NO,
            pt: order_1.OrderType.Limit,
            os: order_1.OrderSource.WEB,
            dq: reqQuery.dq || "0",
            ts: reqQuery.stock,
            mp: "0",
            pr: reqQuery.price,
            qt: reqQuery.quantity || "0",
            rt: "DAY",
            tp: "0",
            tt: "S",
            ig: reqQuery.customMessage,
            es: order_1.ExchangeSegment.NSE,
            pc: order_1.ProductCode.CashAndCarry,
            pf: order_1.PosSqrFlg.N,
        };
        if (!this.validateOrder(data)) {
            throw new verror_1.default("Request is not properly enriched");
        }
        return data;
    }
    alreadyInPortfolio(stockId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!stockId) {
                return true;
            }
            let portfolio = yield this.portfolioService.getPortfolio(this.creds);
            for (const x of portfolio) {
                if (x.exchangeIdentifier == stockId) {
                    return true;
                }
            }
            return false;
        });
    }
}
exports.OrderController = OrderController;
