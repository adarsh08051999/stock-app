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
exports.PortfolioController = void 0;
const verror_1 = __importDefault(require("verror"));
const login_1 = require("../service/login");
const portfolio_1 = require("../service/portfolio");
class PortfolioController {
    constructor() {
        this.getPortfolio = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.creds = yield this.loginService.login();
                let res = yield this.portfolioService.getPortfolio(this.creds);
                response.status(200).send(res);
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Portfolio Controller route ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.portfolioService = new portfolio_1.PortfolioService();
        this.loginService = new login_1.LoginService();
    }
}
exports.PortfolioController = PortfolioController;
