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
exports.HSMWebSocket = void 0;
const socket_1 = require("../models/socket");
const login_1 = require("../service/login");
const byteData_1 = require("./byteData");
const ws_1 = __importDefault(require("ws"));
const pako = require("pako");
function buf2Long(a) {
    let b = new Uint8Array(a), val = 0, len = b.length;
    for (let i = 0, j = len - 1; i < len; i++, j--) {
        val += b[j] << (i * 8);
    }
    return val;
}
function buf2String(a) {
    var enc = new TextDecoder("utf-8");
    return enc.decode(a);
}
function sendJsonArrResp(a) {
    let jsonArrRes = [];
    jsonArrRes.push(a);
    return JSON.stringify(jsonArrRes);
}
function _atos(a) {
    let newarray = [];
    for (let i = 0; i < a.length; i++) {
        newarray.push(String.fromCharCode(a[i]));
    }
    return newarray.join("");
}
function getAcknowledgementReq(a) {
    let buffer = new byteData_1.ByteData(11);
    buffer.markStartOfMsg();
    buffer.appendByte(socket_1.BinRespTypes.ACK_TYPE);
    buffer.appendByte(1);
    buffer.appendByte(1);
    buffer.appendShort(4);
    buffer.appendInt(a);
    buffer.markEndOfMsg();
    return buffer.getBytes();
}
function getStatus(c, d) {
    let status = socket_1.BinRespStat.NOT_OK;
    let fieldCount = buf2Long(c.slice(d, ++d));
    if (fieldCount > 0) {
        let fld = buf2Long(c.slice(d, ++d));
        let fieldlength = buf2Long(c.slice(d, d + 2));
        d += 2;
        var enc = new TextDecoder("utf-8");
        status = enc.decode(c.slice(d, d + fieldlength));
        d += fieldlength;
    }
    return status;
}
function prepareSubsUnSubsRequestForStock(c, d, e, a) {
    let dataArr = getScripByteArray(c, e);
    let buffer = new byteData_1.ByteData(dataArr.length + 11);
    buffer.markStartOfMsg();
    buffer.appendByte(d);
    buffer.appendByte(2);
    buffer.appendByte(1);
    buffer.appendShort(dataArr.length);
    buffer.appendByteArr(dataArr, dataArr.length);
    buffer.appendByte(2);
    buffer.appendShort(1);
    buffer.appendByte(a);
    buffer.markEndOfMsg();
    return buffer.getBytes();
}
function getScripByteArray(c, a) {
    // split for multiple index scrips
    let scripArray = c.split("&");
    let scripsCount = scripArray.length; // count of index --- 
    let dataLen = 0;
    for (let index = 0; index < scripsCount; index++) {
        scripArray[index] = a + "|" + scripArray[index];
        dataLen += scripArray[index].length + 1;
    }
    let bytes = new Uint8Array(dataLen + 2);
    let pos = 0;
    bytes[pos++] = (scripsCount >> 8) & 255;
    bytes[pos++] = scripsCount & 255;
    for (let index = 0; index < scripsCount; index++) {
        let currScrip = scripArray[index];
        let scripLen = currScrip.length;
        bytes[pos++] = scripLen & 255;
        for (let strIndex = 0; strIndex < scripLen; strIndex++) {
            bytes[pos++] = currScrip.charCodeAt(strIndex);
        }
    }
    return bytes;
}
function prepareSubsUnSubsRequest(c, d, e, a) {
    c = e + "|" + c;
    let l = c.length + 1;
    let scripsCount = 1;
    let dataArr = new Uint8Array(l + 2);
    let pos = 0;
    dataArr[pos++] = (scripsCount >> 8) & 255;
    dataArr[pos++] = scripsCount & 255;
    for (let index = 0; index < scripsCount; index++) {
        let currScrip = c;
        let scripLen = currScrip.length;
        dataArr[pos++] = scripLen & 255;
        for (let strIndex = 0; strIndex < scripLen; strIndex++) {
            dataArr[pos++] = currScrip.charCodeAt(strIndex);
        }
    }
    let buffer = new byteData_1.ByteData(dataArr.length + 11);
    buffer.markStartOfMsg();
    buffer.appendByte(d);
    buffer.appendByte(2);
    buffer.appendByte(1);
    buffer.appendShort(dataArr.length);
    buffer.appendByteArr(dataArr, dataArr.length);
    buffer.appendByte(2);
    buffer.appendShort(1);
    buffer.appendByte(a);
    buffer.markEndOfMsg();
    return buffer.getBytes();
}
function getResponseForIndexSubscribe(type, e, pos) {
    let status = getStatus(e, pos);
    let jsonRes = {};
    switch (status) {
        case socket_1.BinRespStat.OK:
            jsonRes.stat = socket_1.STAT.OK;
            jsonRes.type =
                type == socket_1.BinRespTypes.SUBSCRIBE_TYPE
                    ? socket_1.RespTypeValues.SUBS
                    : socket_1.RespTypeValues.UNSUBS;
            jsonRes.msg = "successful";
            jsonRes.stCode = socket_1.RespCodes.SUCCESS;
            break;
        case socket_1.BinRespStat.NOT_OK:
            jsonRes.stat = socket_1.STAT.NOT_OK;
            if (type == socket_1.BinRespTypes.SUBSCRIBE_TYPE) {
                jsonRes.type = socket_1.RespTypeValues.SUBS;
                jsonRes.msg = "subscription failed";
                jsonRes.stCode = socket_1.RespCodes.SUBSCRIPTION_FAILED;
            }
            else {
                jsonRes.type = socket_1.RespTypeValues.UNSUBS;
                jsonRes.msg = "unsubscription  failed";
                jsonRes.stCode = socket_1.RespCodes.UNSUBSCRIPTION_FAILED;
            }
            break;
    }
    return sendJsonArrResp(jsonRes);
}
class HSMWebSocket {
    constructor() {
        this.onmessage = (msg) => {
            // console.log("[Res]: " + msg + "\n"); // commenting for log seeing 
            if (!msg) {
                return;
            }
            const result = JSON.parse(msg);
            for (const x of result) {
                if (x.stockSymbol && x.stockSymbol === 'Nifty 50') {
                    this.intermediateVariableForMarketIndex[x.stockSymbol] = x;
                }
            }
            for (const x of result) {
                if (x.stockSymbol && x.price && x.stockSymbol !== 'Nifty 50') {
                    this.intermediateVariableForStock[x.stockSymbol] = x.price;
                }
            }
        };
        this.intermediateVariableForMarketIndex = {};
        this.counter = 0;
        this.ackNum = 0;
        this.OPEN = 0;
        this.readyState = 0;
        this.url = HSMWebSocket.commonURL;
        this.loginService = new login_1.LoginService();
        this.startServer();
    }
    prepareConnectionRequest(a) {
        let userIdLen = a.length;
        let src = "JS_API";
        let srcLen = src.length;
        let buffer = new byteData_1.ByteData(userIdLen + srcLen + 10);
        buffer.markStartOfMsg();
        buffer.appendByte(socket_1.BinRespTypes.CONNECTION_TYPE);
        buffer.appendByte(2);
        buffer.appendByte(1);
        buffer.appendShort(userIdLen);
        buffer.appendString(a);
        buffer.appendByte(2);
        buffer.appendShort(srcLen);
        buffer.appendString(src);
        buffer.markEndOfMsg();
        return buffer.getBytes();
    }
    prepareConnectionRequest2(a, c) {
        let src = "JS_API";
        let srcLen = src.length;
        let jwtLen = a.length;
        let redisLen = c.length;
        let buffer = new byteData_1.ByteData(srcLen + jwtLen + redisLen + 13);
        buffer.markStartOfMsg();
        buffer.appendByte(socket_1.BinRespTypes.CONNECTION_TYPE);
        buffer.appendByte(3);
        buffer.appendByte(1);
        buffer.appendShort(jwtLen);
        buffer.appendString(a);
        buffer.appendByte(2);
        buffer.appendShort(redisLen);
        buffer.appendString(c);
        buffer.appendByte(3);
        buffer.appendShort(srcLen);
        buffer.appendString(src);
        buffer.markEndOfMsg();
        return buffer.getBytes();
    }
    getResponseForConnection(pos, e) {
        let jsonRes = {};
        let fCount = buf2Long(e.slice(pos, pos + 1));
        pos += 1;
        if (fCount >= 2) {
            let fid1 = buf2Long(e.slice(pos, pos + 1));
            pos += 1;
            let valLen = buf2Long(e.slice(pos, pos + 2));
            pos += 2;
            let status = buf2String(e.slice(pos, pos + valLen));
            pos += valLen;
            fid1 = buf2Long(e.slice(pos, pos + 1));
            pos += 1;
            valLen = buf2Long(e.slice(pos, pos + 2));
            pos += 2;
            let ackCount = buf2Long(e.slice(pos, pos + valLen));
            switch (status) {
                case socket_1.BinRespStat.OK:
                    jsonRes.stat = socket_1.STAT.OK;
                    jsonRes.type = socket_1.RespTypeValues.CONN;
                    jsonRes.msg = "successful";
                    jsonRes.stCode = socket_1.RespCodes.SUCCESS;
                    break;
                case socket_1.BinRespStat.NOT_OK:
                    jsonRes.stat = socket_1.STAT.NOT_OK;
                    jsonRes.type = socket_1.RespTypeValues.CONN;
                    jsonRes.msg = "failed";
                    jsonRes.stCode = socket_1.RespCodes.CONNECTION_FAILED;
                    break;
            }
            this.ackNum = ackCount;
        }
        else {
            if (fCount == 1) {
                let fid1 = buf2Long(e.slice(pos, pos + 1));
                pos += 1;
                let valLen = buf2Long(e.slice(pos, pos + 2));
                pos += 2;
                let status = buf2String(e.slice(pos, pos + valLen));
                pos += valLen;
                switch (status) {
                    case socket_1.BinRespStat.OK:
                        jsonRes.stat = socket_1.STAT.OK;
                        jsonRes.type = socket_1.RespTypeValues.CONN;
                        jsonRes.msg = "successful";
                        jsonRes.stCode = socket_1.RespCodes.SUCCESS;
                        break;
                    case socket_1.BinRespStat.NOT_OK:
                        jsonRes.stat = socket_1.STAT.NOT_OK;
                        jsonRes.type = socket_1.RespTypeValues.CONN;
                        jsonRes.msg = "failed";
                        jsonRes.stCode = socket_1.RespCodes.CONNECTION_FAILED;
                        break;
                }
            }
            else {
                jsonRes.stat = socket_1.STAT.NOT_OK;
                jsonRes.type = socket_1.RespTypeValues.CONN;
                jsonRes.msg = "invalid field count";
                jsonRes.stCode = socket_1.RespCodes.CONNECTION_INVALID;
            }
        }
        return sendJsonArrResp(jsonRes);
    }
    // wrapper functions called by actual web sockets afterwards--
    // triggered by us ----
    onopen() {
        return __awaiter(this, void 0, void 0, function* () {
            this.creds = yield this.loginService.login();
            let req = this.prepareConnectionRequest2(this.creds.token, this.creds.sid);
            if (this.ws && req) {
                this.ws.send(req);
                // console.log('[Socket]: Connected to "' + HSMWebSocket.commonURL + '"\n'); // commenting for log seeing 
            }
            else {
                console.log("Unable to send request !, Reason: Connection faulty or request not valid !");
            }
            return;
        });
    }
    onclose() {
        console.log("[Socket]: Disconnected !\n");
    }
    onerror() {
        console.log("[Socket]: Error !\n");
    }
    getIntermediateMarketIndexPrice() {
        return this.intermediateVariableForMarketIndex;
    }
    getIntermediateStockPrice() {
        return this.intermediateVariableForStock;
    }
    setIntermediateMarketIndexPrice() {
        this.intermediateVariableForMarketIndex = {};
    }
    setIntermediateStockPrice() {
        this.intermediateVariableForStock = {};
    }
    startServer() {
        this.ws = new ws_1.default(this.url);
        this.ws.binaryType = "arraybuffer";
        // actual web socket ----
        this.ws.onopen = () => {
            this.OPEN = 1;
            this.readyState = 1;
            this.onopen();
        };
        this.ws.onclose = () => {
            this.onclose();
        };
        this.ws.onerror = () => {
            this.OPEN = 0;
            this.readyState = 0;
            this.onerror();
        };
        this.ws.onmessage = (c) => {
            let inData = c.data;
            if (inData instanceof ArrayBuffer) {
                inData = this.parseData(inData);
            }
            else {
                let decoded = window.atob(inData);
                inData = _atos(pako.inflate(decoded));
            }
            this.onmessage(inData);
        };
    }
    close() {
        if (this.ws) {
            this.ws.close();
        }
        this.OPEN = 0;
        this.readyState = 0;
        this.ws = null;
    }
    subscribeIndexScrip() {
        return __awaiter(this, void 0, void 0, function* () {
            let req = prepareSubsUnSubsRequest("nse_cm|Nifty 50", socket_1.BinRespTypes.SUBSCRIBE_TYPE, "if", 1);
            if (this.ws && req) {
                this.ws.send(req);
            }
            else {
                console.error("Unable to send request !, Reason: Connection faulty or request not valid !");
            }
        });
    }
    subscribeStockScrip(s) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = prepareSubsUnSubsRequestForStock(s, socket_1.BinRespTypes.SUBSCRIBE_TYPE, "sf", 2);
            if (this.ws && req) {
                this.ws.send(req);
            }
            else {
                console.error("Unable to send request !, Reason: Connection faulty or request not valid !");
            }
        });
    }
    unsubscribeStockScrip(s) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = prepareSubsUnSubsRequestForStock(s, socket_1.BinRespTypes.UNSUBSCRIBE_TYPE, "sf", 2);
            // console.log(`Subscription scrip for stock is ${req}`);
            if (this.ws && req) {
                this.ws.send(req);
            }
            else {
                console.error("Unable to send request !, Reason: Connection faulty or request not valid !");
            }
        });
    }
    parseData(e) {
        let pos = 0;
        let packetsCount = buf2Long(e.slice(pos, 2));
        pos += 2;
        let type = buf2Long(e.slice(pos, pos + 1));
        pos += 1;
        if (type == socket_1.BinRespTypes.CONNECTION_TYPE) {
            return this.getResponseForConnection(pos, e);
        }
        else if (type === socket_1.BinRespTypes.SUBSCRIBE_TYPE) {
            return getResponseForIndexSubscribe(type, e, pos);
        }
        else if (type === socket_1.BinRespTypes.DATA_TYPE) {
            return this.getResponseForData(e, pos);
        }
    }
    processForIndex(e, pos, fcount) {
        let stockSymbol = "", highPrice, iv, lowPrice, openingPrice;
        let mul, prec, cng, stockExchange, ic;
        for (let index = 0; index < fcount; index++) {
            let fvalue = buf2Long(e.slice(pos, pos + 4));
            pos += 4;
            if (index === 2) {
                iv = fvalue;
            }
            else if (index === 3) {
                ic = fvalue;
            }
            else if (index === 5) {
                highPrice = fvalue; // change here---
            }
            else if (index === 6) {
                lowPrice = fvalue;
            }
            else if (index === 7) {
                openingPrice = fvalue;
            }
            else if (index === 8) {
                mul = fvalue;
            }
            else if (index === 9) {
                prec = fvalue;
            }
        }
        fcount = buf2Long(e.slice(pos, pos + 1));
        pos++;
        for (let index = 0; index < fcount; index++) {
            let fid = buf2Long(e.slice(pos, pos + 1));
            pos++;
            let dataLen = buf2Long(e.slice(pos, pos + 1));
            pos++;
            let strVal = buf2String(e.slice(pos, pos + dataLen));
            pos += dataLen;
            if (fid === 52) {
                stockSymbol = strVal;
            }
            else if (fid === 53) {
                stockExchange = strVal;
            }
        }
        return { stockSymbol, highPrice, iv, ic, lowPrice, openingPrice, mul, prec, cng, stockExchange };
    }
    processForStock(e, pos, fcount) {
        let stockSymbol;
        let price;
        for (let index = 0; index < fcount; index++) {
            let fvalue = buf2Long(e.slice(pos, pos + 4));
            pos += 4;
            if (index === 5) {
                price = fvalue;
            }
        }
        fcount = buf2Long(e.slice(pos, pos + 1));
        pos++;
        for (let index = 0; index < fcount; index++) {
            let fid = buf2Long(e.slice(pos, pos + 1));
            pos++;
            let dataLen = buf2Long(e.slice(pos, pos + 1));
            pos++;
            let strVal = buf2String(e.slice(pos, pos + dataLen));
            pos += dataLen;
            if (fid === 52) {
                stockSymbol = strVal;
            }
        }
        return { stockSymbol, price };
    }
    getResponseForData(e, pos) {
        let msgNum = buf2Long(e.slice(pos, pos + 4));
        pos += 4;
        let g = buf2Long(e.slice(pos, pos + 2));
        pos += 2;
        // g = 1 for index else more--
        let d = [];
        for (let n = 0; n < g; n++) {
            let result;
            pos += 2;
            var c = buf2Long(e.slice(pos, pos + 1));
            pos++;
            if (c == socket_1.ResponseTypes.SNAP) {
                let f = buf2Long(e.slice(pos, pos + 4));
                pos += 4;
                let nameLen = buf2Long(e.slice(pos, pos + 1));
                pos++;
                let topicName = buf2String(e.slice(pos, pos + nameLen));
                pos += nameLen;
                let fcount = buf2Long(e.slice(pos, pos + 1));
                pos++;
                // console.log(topicName);
                if (topicName === 'if|nse_cm|Nifty 50') {
                    result = this.processForIndex(e, pos, fcount);
                }
                else {
                    let price, stockSymbol;
                    for (let index = 0; index < fcount; index++) {
                        let fvalue = buf2Long(e.slice(pos, pos + 4));
                        pos += 4;
                        if (index === 5) {
                            price = fvalue;
                        }
                    }
                    fcount = buf2Long(e.slice(pos, pos + 1));
                    pos++;
                    for (let index = 0; index < fcount; index++) {
                        let fid = buf2Long(e.slice(pos, pos + 1));
                        pos++;
                        let dataLen = buf2Long(e.slice(pos, pos + 1));
                        pos++;
                        let strVal = buf2String(e.slice(pos, pos + dataLen));
                        pos += dataLen;
                        if (fid === 52) {
                            stockSymbol = strVal;
                        }
                    }
                    result = { price, stockSymbol };
                }
                d.push(result);
            }
        }
        return JSON.stringify(d);
    }
}
exports.HSMWebSocket = HSMWebSocket;
HSMWebSocket.commonURL = "wss://mlhsm.kotaksecurities.com";
HSMWebSocket.channels = [];
// const socket = new HSMWebSocket();
// export default socket;
