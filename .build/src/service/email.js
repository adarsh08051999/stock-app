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
exports.EmailService = void 0;
const verror_1 = __importDefault(require("verror"));
const common_1 = __importDefault(require("../constants/common"));
var axios = require("axios");
var qs = require("qs");
class EmailService {
    constructor() {
        this.getAccessToken = () => __awaiter(this, void 0, void 0, function* () {
            let credSpace = (process.env.APP_ENV === 'prod') ? common_1.default.USERS_CREDS.VINAY : common_1.default.USERS_CREDS.ADARSH;
            var data = qs.stringify({
                client_id: credSpace.EMAIL.ClientID,
                client_secret: credSpace.EMAIL.ClientSecret,
                refresh_token: credSpace.EMAIL.RefreshToken,
                grant_type: "refresh_token",
            });
            var config = {
                method: "post",
                url: common_1.default.EMAIL_URLS.AccessTokenURL,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data: data,
            };
            try {
                let res = yield axios(config);
                this.accessToken = res.data.access_token;
            }
            catch (err) {
                throw (err);
            }
        });
        this.searchEmail = () => __awaiter(this, void 0, void 0, function* () {
            let config = {
                method: "get",
                url: common_1.default.EMAIL_URLS.SearchFromEmailURL + common_1.default.EMAIL_URLS.EmailToSearch,
                headers: {
                    Authorization: `Bearer ${this.accessToken} `,
                },
            };
            var threadId = "";
            try {
                let res = yield axios(config);
                threadId = yield res.data["messages"][0].id;
            }
            catch (err) {
                throw (err);
            }
            return threadId;
        });
        this.returnSnippet = (threadId) => __awaiter(this, void 0, void 0, function* () {
            var config = {
                method: "get",
                url: common_1.default.EMAIL_URLS.SearchForThread + `${threadId}`,
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            };
            let snippet;
            try {
                let res = yield axios(config);
                snippet = yield res.data.snippet;
            }
            catch (err) {
                throw (err);
            }
            return snippet;
        });
    }
    extractOtpFromHeading(heading) {
        let regex = /\b\d{4}\b/g;
        let matches = heading.match(regex);
        if (matches) {
            return matches[0];
        }
        throw new verror_1.default(`No matching OTP in heading ${heading}`);
    }
    ;
    getOtpFromEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getAccessToken();
            const threadId = yield this.searchEmail();
            const headingSnippet = yield this.returnSnippet(threadId);
            const otp = this.extractOtpFromHeading(headingSnippet);
            return otp;
        });
    }
    ;
}
exports.EmailService = EmailService;
