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
exports.LoginService = void 0;
const verror_1 = __importDefault(require("verror"));
const common_1 = __importDefault(require("../constants/common"));
const axios_1 = __importDefault(require("axios"));
const jwt_decode_1 = require("jwt-decode");
const qs_1 = __importDefault(require("qs"));
const email_1 = require("./email");
const FileSystem = require("fs");
class LoginService {
    constructor() {
        this.deleteCreds = () => __awaiter(this, void 0, void 0, function* () {
            const fileName = this.getFileName();
            const rawDataFromFile = JSON.parse(FileSystem.readFileSync(fileName));
            rawDataFromFile.date = '2024-02-01'; // any old date
            yield FileSystem.writeFile(fileName, JSON.stringify(rawDataFromFile), (error) => {
                if (error)
                    throw error;
            });
        });
        this.login = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const fileName = this.getFileName();
            let spaceName = (process.env.APP_ENV === 'prod') ? common_1.default.USERS_CREDS.VINAY.NAME : common_1.default.USERS_CREDS.ADARSH.NAME;
            try {
                const rawDataFromFile = JSON.parse(FileSystem.readFileSync(fileName));
                if (rawDataFromFile.date && rawDataFromFile.date === new Date().toISOString().split('T')[0] && rawDataFromFile.user === spaceName) {
                    delete rawDataFromFile['date'];
                    delete rawDataFromFile['user'];
                    return rawDataFromFile;
                }
            }
            catch (err) {
                console.log(`file doesn't exist for ${fileName} continuing the flow`);
            }
            let responseFromConsumerKeyForAccessToken = yield this.OAuthUsingConsumerData();
            this.accessToken = "Bearer " + responseFromConsumerKeyForAccessToken.access_token;
            let responseFromValidateReq = yield this.generateTokenUsingPassword();
            let tempToken = responseFromValidateReq.token;
            let tempSid = responseFromValidateReq.sid;
            this.userId = (_a = (0, jwt_decode_1.jwtDecode)(tempToken)) === null || _a === void 0 ? void 0 : _a.sub;
            let isOtpGenerated = false;
            isOtpGenerated = yield this.generateOtpOnEmail();
            console.log("Generated OTP");
            yield new Promise(resolve => setTimeout(resolve, 5000)); // pause of 5 sec for OTP recieve -
            let otp = yield this.emailService.getOtpFromEmail();
            console.log(`OTP IS ${otp}`);
            let responseFromValidateReqUsingOtp = yield this.generateTokenUsingOtpAndEnableOrder(otp, tempToken, tempSid);
            this.token = responseFromValidateReqUsingOtp.token;
            this.sid = responseFromValidateReqUsingOtp.sid;
            this.hsServerId = responseFromValidateReqUsingOtp.hsServerId;
            const loginCreds = { token: this.token, sid: this.sid, accessToken: this.accessToken, userId: this.userId, hsServerId: this.hsServerId };
            const dataToSave = Object.assign(Object.assign({}, loginCreds), { date: new Date().toISOString().split('T')[0], user: spaceName });
            yield FileSystem.writeFile(fileName, JSON.stringify(dataToSave), (error) => {
                if (error)
                    throw error;
            });
            return loginCreds;
        });
        this.OAuthUsingConsumerData = () => __awaiter(this, void 0, void 0, function* () {
            let credSpace = (process.env.APP_ENV === 'prod') ? common_1.default.USERS_CREDS.VINAY : common_1.default.USERS_CREDS.ADARSH;
            const reqConfig = {
                method: 'post',
                url: common_1.default.KOTAK_LOGIN_URLS.OAuth2Url,
                data: qs_1.default.stringify({
                    'grant_type': 'client_credentials'
                }),
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': credSpace.LOGIN.AuthorizationHeader
                },
            };
            const res = yield (0, axios_1.default)(reqConfig);
            if (res.status === 200) {
                return res.data;
            }
            throw (new verror_1.default(`Failed to get Access token ${res.status}`));
        });
        this.generateTokenUsingPassword = () => __awaiter(this, void 0, void 0, function* () {
            let credSpace = (process.env.APP_ENV === 'prod') ? common_1.default.USERS_CREDS.VINAY : common_1.default.USERS_CREDS.ADARSH;
            const reqConfig = {
                method: 'post',
                url: common_1.default.KOTAK_LOGIN_URLS.ValidateUrl,
                data: {
                    "mobileNumber": credSpace.LOGIN.MobileNo,
                    "password": credSpace.LOGIN.Password,
                },
                headers: {
                    'content-type': 'application/json',
                    'Authorization': this.accessToken
                },
            };
            let res;
            try {
                res = yield (0, axios_1.default)(reqConfig);
            }
            catch (err) {
                console.log(err === null || err === void 0 ? void 0 : err.message);
                throw (new verror_1.default(`Axios failed for generateTokenUsingPassword`));
            }
            if ((res === null || res === void 0 ? void 0 : res.status) === 201) {
                return res.data.data;
            }
            throw (new verror_1.default(`Failed to get Access token ${res === null || res === void 0 ? void 0 : res.status}`));
        });
        this.generateOtpOnEmail = () => __awaiter(this, void 0, void 0, function* () {
            const reqConfig = {
                method: 'post',
                url: common_1.default.KOTAK_LOGIN_URLS.GenerateOtpUrl,
                data: {
                    "userId": this.userId,
                    "sendEmail": true,
                    "isWhitelisted": true
                },
                headers: {
                    'content-type': 'application/json',
                    'Authorization': this.accessToken
                },
            };
            const res = yield (0, axios_1.default)(reqConfig);
            if (res.status === 201) {
                return true;
            }
            return false;
        });
        this.generateTokenUsingOtpAndEnableOrder = (otp, token, sid) => __awaiter(this, void 0, void 0, function* () {
            const reqConfig = {
                method: 'post',
                url: common_1.default.KOTAK_LOGIN_URLS.ValidateUrl,
                data: {
                    "userId": this.userId,
                    "otp": otp,
                },
                headers: {
                    'accept': '*/*',
                    'Content-type': 'application/json',
                    'sid': sid,
                    'Auth': token,
                    'Authorization': this.accessToken
                },
            };
            const res = yield (0, axios_1.default)(reqConfig);
            if (res.status === 201) {
                return res.data.data;
            }
            throw (new verror_1.default(`Failed to get Access token ${res.status}`));
        });
        this.emailService = new email_1.EmailService();
    }
    getFileName() {
        return `files/creds.json`;
    }
}
exports.LoginService = LoginService;
