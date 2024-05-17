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
exports.LoginController = void 0;
const verror_1 = __importDefault(require("verror"));
const login_1 = require("../service/login");
class LoginController {
    constructor() {
        this.login = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let res = yield this.loginService.login();
                response.status(200).send(JSON.stringify(res));
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Login ${err === null || err === void 0 ? void 0 : err.message}`);
                console.error(error.stack);
                response.status(500).send(error);
            }
        });
        this.deleteCreds = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.loginService.deleteCreds();
                response.status(200).send(JSON.stringify("done successfully"));
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Cred delete ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.loginService = new login_1.LoginService();
    }
}
exports.LoginController = LoginController;
