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
exports.MarketDataController = void 0;
const verror_1 = __importDefault(require("verror"));
const marketData_1 = require("../service/marketData");
class MarketDataController {
    constructor() {
        this.marketData = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let data = yield this.marketDataService.getMarketIndexData();
                response.status(200).send(data);
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Market Data Controller route ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.marketDataService = new marketData_1.MarketDataService();
    }
}
exports.MarketDataController = MarketDataController;
