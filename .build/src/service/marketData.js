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
exports.MarketDataService = void 0;
const HSWebSocket_1 = require("../controllers/HSWebSocket");
class MarketDataService {
    constructor() {
        this.getMarketIndexData = () => __awaiter(this, void 0, void 0, function* () {
            let dayMarketIndexLowest = yield this.getLowestMarketIndex();
            let change = 100 * ((dayMarketIndexLowest.lowPrice - dayMarketIndexLowest.ic) / (dayMarketIndexLowest.ic));
            let curr_change = 100 * ((dayMarketIndexLowest.iv - dayMarketIndexLowest.ic) / (dayMarketIndexLowest.ic));
            return { highest_negative_change: change, current_change: curr_change, current_price: (dayMarketIndexLowest.iv) / 100, yesterday_closing_price: (dayMarketIndexLowest.ic) / 100, lowest_today_price: (dayMarketIndexLowest.lowPrice) / 100 };
        });
    }
    getLowestMarketIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            const socket = new HSWebSocket_1.HSMWebSocket();
            yield new Promise(resolve => setTimeout(resolve, 9000)); // play around with this---
            yield socket.onopen();
            socket.setIntermediateMarketIndexPrice();
            yield new Promise(resolve => setTimeout(resolve, 5000)); // play around with this---
            socket.subscribeIndexScrip();
            let a = {};
            let count = 15;
            while (Object.keys(a).length === 0 && count > 0) {
                yield new Promise(resolve => setTimeout(resolve, 1000));
                a = socket.getIntermediateMarketIndexPrice();
            }
            if (Object.keys(a).length === 0) {
                throw Error('Market data fail');
            }
            socket.setIntermediateMarketIndexPrice();
            return a['Nifty 50'];
        });
    }
}
exports.MarketDataService = MarketDataService;
