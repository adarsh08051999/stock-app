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
exports.OrderService = void 0;
const verror_1 = __importDefault(require("verror"));
const common_1 = __importDefault(require("../constants/common"));
const axios_1 = __importDefault(require("axios"));
const dbQuery_1 = require("./dbQuery");
var qs = require("qs");
class OrderService extends dbQuery_1.DBQuery {
    constructor() {
        super();
        this.placeOrder = (creds, jData) => __awaiter(this, void 0, void 0, function* () {
            const reqConfig = {
                method: 'post',
                url: common_1.default.KOTAK_LOGIN_URLS.OrderUrl,
                data: qs.stringify({
                    'jData': JSON.stringify(jData)
                }),
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'neo-fin-key': 'neotradeapi',
                    'accept': 'application/json',
                    'Sid': creds.sid,
                    'Auth': creds.token,
                    'Authorization': creds.accessToken,
                },
            };
            const res = yield (0, axios_1.default)(reqConfig);
            console.log("Response from placeOrder API" + res);
            if (res.status === 200 && res.statusText == 'OK') {
                if (jData.tt == 'S' && res.data.stat != 'Ok') { }
                else {
                    return res.data;
                }
            }
            console.log(`Received non 2xx|not-Ok from order placing api ${res.status}`);
            throw (new verror_1.default(`non 2xx|not-Ok from order placing api ${res.status}`));
        });
    }
}
exports.OrderService = OrderService;
