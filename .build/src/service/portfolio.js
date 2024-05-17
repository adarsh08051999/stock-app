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
exports.PortfolioService = void 0;
const verror_1 = __importDefault(require("verror"));
const common_1 = __importDefault(require("../constants/common"));
const axios_1 = __importDefault(require("axios"));
const FileSystem = require("fs");
const fileName = 'files/portfolio.json';
class PortfolioService {
    constructor() {
        this.getPortfolio = (creds) => __awaiter(this, void 0, void 0, function* () {
            let spaceName = (process.env.APP_ENV === 'prod') ? common_1.default.USERS_CREDS.VINAY.NAME : common_1.default.USERS_CREDS.ADARSH.NAME;
            const reqConfig = {
                method: 'get',
                url: common_1.default.KOTAK_LOGIN_URLS.PortFolioUrl,
                headers: {
                    'sid': creds.sid,
                    'Auth': creds.token,
                    'Authorization': creds.accessToken,
                },
            };
            try {
                const res = yield (0, axios_1.default)(reqConfig);
                if (res.status === 200) {
                    // save data in a file with date and username ---
                    const dataToSave = { data: res.data.data, date: new Date().toISOString().split('T')[0], user: spaceName };
                    yield FileSystem.writeFile(fileName, JSON.stringify(dataToSave), (error) => {
                        if (error) {
                            console.log(error);
                        }
                        ;
                    });
                    return res.data.data;
                }
                throw (new verror_1.default(`Failed to get Portfolio- non200 from portfolio api ${JSON.stringify(res)}`));
            }
            catch (err) {
                console.log(err.message);
                // check if present in file(max 1 day old)
                const rawDataFromFile = JSON.parse(FileSystem.readFileSync(fileName));
                var yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                if (rawDataFromFile.user === spaceName && rawDataFromFile.date && (rawDataFromFile.date == new Date().toISOString().split('T')[0] || rawDataFromFile.date == yesterdayDate.toISOString().split('T')[0])) {
                    console.log("Loading old data for Portfolio - " + JSON.stringify(rawDataFromFile));
                    return rawDataFromFile.data;
                }
                throw (err);
            }
        });
    }
}
exports.PortfolioService = PortfolioService;
