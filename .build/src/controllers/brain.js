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
exports.BrainController = void 0;
const verror_1 = __importDefault(require("verror"));
const brain_1 = __importDefault(require("../service/brain"));
const marketData_1 = require("../service/marketData");
class BrainController {
    checkTimeFor3pm() {
        return true;
        let d = new Date();
        let currentOffset = d.getTimezoneOffset();
        let ISTOffset = 330; // IST offset UTC +5:30
        let ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);
        let hour = ISTTime.getHours();
        let min = ISTTime.getMinutes();
        if (hour === 15 && min < 15) {
            return true;
        }
        brain_1.default.doLog("Not 3pm");
        return false;
    }
    constructor() {
        this.start = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (brain_1.default.getIsStart()) {
                    response.status(400).send("Brain Service already running");
                }
                else {
                    brain_1.default.setKeepRunning();
                    brain_1.default.start();
                    yield new Promise((resolve) => setTimeout(resolve, 3000));
                    if (brain_1.default.getIsStart()) {
                        response.status(200).send(JSON.stringify("Invoked the service"));
                    }
                    else {
                        response.status(400).send(JSON.stringify("Not appropriate time"));
                    }
                }
                response.status(200).send(JSON.stringify("Invoked the service"));
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Invoking Brain Service ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.stop = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!brain_1.default.getIsStart()) {
                    response.status(400).send("Already inactive");
                }
                else {
                    brain_1.default.unsetKeepRunning();
                    response
                        .status(200)
                        .send(JSON.stringify("Invoked stopping the brain service"));
                }
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Stopping Brain Service ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.placeOrder3pm = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.checkTimeFor3pm()) {
                    let temp = false;
                    let niftyData = yield this.marketDataService.getMarketIndexData();
                    if (niftyData < 0) {
                        temp = yield brain_1.default.process();
                    }
                    else {
                        temp = yield brain_1.default.process(true);
                    }
                    if (temp) {
                        response.status(200).send("Order Placed");
                        return;
                    }
                    else {
                        response.status(500).send("No order place");
                        return;
                    }
                }
                response.status(501).send('time outside valid range');
            }
            catch (err) {
                const error = new verror_1.default(`ERR in placing order-3pm ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.marketDataService = new marketData_1.MarketDataService();
    }
}
exports.BrainController = BrainController;
