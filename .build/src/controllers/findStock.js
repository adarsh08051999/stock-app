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
exports.FindStockController = void 0;
const verror_1 = __importDefault(require("verror"));
const findStock_1 = require("../service/findStock");
class FindStockController {
    constructor() {
        this.findStockAndBudget = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let type = request.query.filter ? true : false;
                let all = request.query.all ? true : false;
                let days = request.query.days ? parseInt(request.query.days) : 7;
                let res = yield this.findStockService.findStockAndBudget(type, days, all);
                response.status(200).send(JSON.stringify(res));
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Finding Stock Service ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.getDates = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let res = yield this.findStockService.getDates();
                response.status(200).send(JSON.stringify(res));
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Finding Dates ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.findStockService = new findStock_1.FindStockService();
    }
}
exports.FindStockController = FindStockController;
