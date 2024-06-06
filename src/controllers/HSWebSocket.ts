import { ApiCredentials } from "../models/common";
import {
  BinRespStat,
  BinRespTypes,
  STAT,
  RespTypeValues,
  RespCodes,
  ResponseTypes,
} from "../models/socket";
import loginServiceObj from "../service/login";
import { ByteData } from "./byteData";
import WebSocket from "ws";
const pako = require("pako");

function buf2Long(a: any) {
  let b = new Uint8Array(a),
    val = 0,
    len = b.length;
  for (let i = 0, j = len - 1; i < len; i++, j--) {
    val += b[j] << (i * 8);
  }
  return val;
}
function buf2String(a: any) {
  var enc = new TextDecoder("utf-8");
  return enc.decode(a);
}

function sendJsonArrResp(a: any) {
  let jsonArrRes = [];
  jsonArrRes.push(a);
  return JSON.stringify(jsonArrRes);
}

function _atos(a: any) {
  let newarray = [];
  for (let i = 0; i < a.length; i++) {
    newarray.push(String.fromCharCode(a[i]));
  }
  return newarray.join("");
}

function getAcknowledgementReq(a: any) {
  let buffer = new ByteData(11);
  buffer.markStartOfMsg();
  buffer.appendByte(BinRespTypes.ACK_TYPE);
  buffer.appendByte(1);
  buffer.appendByte(1);
  buffer.appendShort(4);
  buffer.appendInt(a);
  buffer.markEndOfMsg();
  return buffer.getBytes();
}

function getStatus(c: any, d: any) {
  let status = BinRespStat.NOT_OK;
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

function prepareSubsUnSubsRequestForStock(c: string, d: any, e: any, a: any) {
  let dataArr = getScripByteArray(c, e);
  let buffer = new ByteData(dataArr.length + 11);
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
function getScripByteArray(c: string, a: any) {
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

function prepareSubsUnSubsRequest(c: string, d: number, e: string, a: number) {
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

  let buffer = new ByteData(dataArr.length + 11);
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

function getResponseForIndexSubscribe(type: number, e: string, pos: any) {
  let status = getStatus(e, pos);
  let jsonRes: any = {};
  switch (status) {
    case BinRespStat.OK:
      jsonRes.stat = STAT.OK;
      jsonRes.type =
        type == BinRespTypes.SUBSCRIBE_TYPE
          ? RespTypeValues.SUBS
          : RespTypeValues.UNSUBS;
      jsonRes.msg = "successful";
      jsonRes.stCode = RespCodes.SUCCESS;
      break;
    case BinRespStat.NOT_OK:
      jsonRes.stat = STAT.NOT_OK;
      if (type == BinRespTypes.SUBSCRIBE_TYPE) {
        jsonRes.type = RespTypeValues.SUBS;
        jsonRes.msg = "subscription failed";
        jsonRes.stCode = RespCodes.SUBSCRIPTION_FAILED;
      } else {
        jsonRes.type = RespTypeValues.UNSUBS;
        jsonRes.msg = "unsubscription  failed";
        jsonRes.stCode = RespCodes.UNSUBSCRIPTION_FAILED;
      }
      break;
  }
  return sendJsonArrResp(jsonRes);
}

export class HSMWebSocket {
  public OPEN: number;
  public readyState: number;
  private url: string;
  public ws: WebSocket | null;
  static commonURL: string = "wss://mlhsm.kotaksecurities.com";
  private creds: ApiCredentials;
  private intermediateVariableForNiftyIndex: any;
  private intermediateVariableForSensexIndex: any;
  private intermediateVariableForStock: any;
  static channels: number[] = [];
  private ackNum: number;
  private counter: number;

  constructor() {
    this.intermediateVariableForNiftyIndex = {};
    this.intermediateVariableForSensexIndex = {};
    this.counter = 0;
    this.ackNum = 0;
    this.OPEN = 0;
    this.readyState = 0;
    this.url = HSMWebSocket.commonURL;
    this.startServer();
  }

  public prepareConnectionRequest(a: any) {
    let userIdLen = a.length;
    let src = "JS_API";
    let srcLen = src.length;
    let buffer = new ByteData(userIdLen + srcLen + 10);
    buffer.markStartOfMsg();
    buffer.appendByte(BinRespTypes.CONNECTION_TYPE);
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

  public prepareConnectionRequest2(a: any, c: any) {
    let src = "JS_API";
    let srcLen = src.length;
    let jwtLen = a.length;
    let redisLen = c.length;
    let buffer = new ByteData(srcLen + jwtLen + redisLen + 13);
    buffer.markStartOfMsg();
    buffer.appendByte(BinRespTypes.CONNECTION_TYPE);
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

  public getResponseForConnection(pos: number, e: any) {
    let jsonRes: any = {};
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
        case BinRespStat.OK:
          jsonRes.stat = STAT.OK;
          jsonRes.type = RespTypeValues.CONN;
          jsonRes.msg = "successful";
          jsonRes.stCode = RespCodes.SUCCESS;
          break;
        case BinRespStat.NOT_OK:
          jsonRes.stat = STAT.NOT_OK;
          jsonRes.type = RespTypeValues.CONN;
          jsonRes.msg = "failed";
          jsonRes.stCode = RespCodes.CONNECTION_FAILED;
          break;
      }
      this.ackNum = ackCount;
    } else {
      if (fCount == 1) {
        let fid1 = buf2Long(e.slice(pos, pos + 1));
        pos += 1;
        let valLen = buf2Long(e.slice(pos, pos + 2));
        pos += 2;
        let status = buf2String(e.slice(pos, pos + valLen));
        pos += valLen;
        switch (status) {
          case BinRespStat.OK:
            jsonRes.stat = STAT.OK;
            jsonRes.type = RespTypeValues.CONN;
            jsonRes.msg = "successful";
            jsonRes.stCode = RespCodes.SUCCESS;
            break;
          case BinRespStat.NOT_OK:
            jsonRes.stat = STAT.NOT_OK;
            jsonRes.type = RespTypeValues.CONN;
            jsonRes.msg = "failed";
            jsonRes.stCode = RespCodes.CONNECTION_FAILED;
            break;
        }
      } else {
        jsonRes.stat = STAT.NOT_OK;
        jsonRes.type = RespTypeValues.CONN;
        jsonRes.msg = "invalid field count";
        jsonRes.stCode = RespCodes.CONNECTION_INVALID;
      }
    }
    return sendJsonArrResp(jsonRes);
  }

  // wrapper functions called by actual web sockets afterwards--
  // triggered by us ----
  public async onopen() {
    this.creds = await loginServiceObj.login();
    let req = this.prepareConnectionRequest2(this.creds.token, this.creds.sid);

    if (this.ws && req) {
      this.ws.send(req);
      // console.log('[Socket]: Connected to "' + HSMWebSocket.commonURL + '"\n'); // commenting for log seeing 
    } else {
      console.log(
        "Unable to send request !, Reason: Connection faulty or request not valid !"
      );
    }
    return;
  }

  public onclose() {
    console.log("[Socket]: Disconnected !\n");
  }

  public onerror() {
    console.log("[Socket]: Error !\n");
  }
  public getIntermediateNiftyIndexPrice() {
    return this.intermediateVariableForNiftyIndex;
  }
  public getIntermediateSensexIndexPrice() {
    return this.intermediateVariableForSensexIndex;
  }

  public getIntermediateStockPrice() {
    return this.intermediateVariableForStock;
  }
  public setIntermediateNiftyIndexPrice() {
    this.intermediateVariableForNiftyIndex = {};
  }
  public setIntermediateSensexIndexPrice() {
    this.intermediateVariableForSensexIndex = {};
  }

  public setIntermediateStockPrice() {
    this.intermediateVariableForStock = {};
  }

  public onmessage = (msg: string) => {
    // console.log("[Res]: " + msg + "\n"); // commenting for log seeing 
    if (!msg) { return; }
    const result = JSON.parse(msg);

    // for nifty index data
    for (const x of result) {
      if (x.stockSymbol && x.stockSymbol === 'Nifty 50') {
        this.intermediateVariableForNiftyIndex[x.stockSymbol] = x;
      }
    }

    // for sensex data
    for (const x of result) {
      if (x.stockSymbol && x.stockSymbol === 'SENSEX') {
        this.intermediateVariableForSensexIndex[x.stockSymbol] = x;
      }
    }



    // for stocks data
    for (const x of result) {
      if (x.stockSymbol && x.price && x.stockSymbol !== 'Nifty 50' && x.stockSymbol !== 'SENSEX') {
        this.intermediateVariableForStock[x.stockSymbol] = x.price;
      }
    }




  };

  public startServer() {
    this.ws = new WebSocket(this.url);
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
      let inData: any = c.data;
      if (inData instanceof ArrayBuffer) {
        inData = this.parseData(inData);
      } else {
        let decoded = window.atob(inData);
        inData = _atos(pako.inflate(decoded));
      }
      this.onmessage(inData);
    };
  }

  public close() {
    if (this.ws) {
      this.ws.close();
    }
    this.OPEN = 0;
    this.readyState = 0;
    this.ws = null;
  }

  public async subscribeNiftyIndexScrip() {
    let req = prepareSubsUnSubsRequest(
      "nse_cm|Nifty 50",
      BinRespTypes.SUBSCRIBE_TYPE,
      "if",
      1
    );
    if (this.ws && req) {
      this.ws.send(req);
    } else {
      console.error(
        "Unable to send request !, Reason: Connection faulty or request not valid !"
      );
    }
  }

  public async subscribeSensexIndexScrip() {
    let req = prepareSubsUnSubsRequest(
      "bse_cm|SENSEX",
      BinRespTypes.SUBSCRIBE_TYPE,
      "if",
      3
    );
    if (this.ws && req) {
      this.ws.send(req);
    } else {
      console.error(
        "Unable to send request !, Reason: Connection faulty or request not valid !"
      );
    }
  }



  public async subscribeStockScrip(s: string) {
    let req = prepareSubsUnSubsRequestForStock(
      s,
      BinRespTypes.SUBSCRIBE_TYPE,
      "sf",
      2
    );
    if (this.ws && req) {
      this.ws.send(req);
    } else {
      console.error(
        "Unable to send request !, Reason: Connection faulty or request not valid !"
      );
    }
  }

  public async unsubscribeStockScrip(s: string) {
    let req = prepareSubsUnSubsRequestForStock(
      s,
      BinRespTypes.UNSUBSCRIBE_TYPE,
      "sf",
      2
    );
    // console.log(`Subscription scrip for stock is ${req}`);
    if (this.ws && req) {
      this.ws.send(req);
    } else {
      console.error(
        "Unable to send request !, Reason: Connection faulty or request not valid !"
      );
    }
  }


  public parseData(e: any) {
    let pos = 0;
    let packetsCount = buf2Long(e.slice(pos, 2));
    pos += 2;
    let type = buf2Long(e.slice(pos, pos + 1));
    pos += 1;
    if (type == BinRespTypes.CONNECTION_TYPE) {
      return this.getResponseForConnection(pos, e);
    } else if (type === BinRespTypes.SUBSCRIBE_TYPE) {
      return getResponseForIndexSubscribe(type, e, pos);
    } else if (type === BinRespTypes.DATA_TYPE) {
      return this.getResponseForData(e, pos); 
    }
  }

  public processForIndex(e: string, pos: number, fcount: number) {
    let stockSymbol: string = "", highPrice: number | undefined, iv: number | undefined, lowPrice: number | undefined, openingPrice: number | undefined;
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
        stockExchange = strVal
      }
    }
    return { stockSymbol, highPrice, iv, ic, lowPrice, openingPrice, mul, prec, cng, stockExchange };
  }

  public processForStock(e: string, pos: number, fcount: number) {
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
        stockSymbol = strVal
      }
    }

    return { stockSymbol, price };
  }


  public getResponseForData(e: string, pos: number) {
    let msgNum = buf2Long(e.slice(pos, pos + 4));
    pos += 4;

    let g = buf2Long(e.slice(pos, pos + 2));
    pos += 2;
    // g = 1 for index else more--

    let d: any[] = [];
    for (let n = 0; n < g; n++) {
      let result;
      pos += 2;
      var c = buf2Long(e.slice(pos, pos + 1));
      pos++;
      if (c == ResponseTypes.SNAP) {
        let f = buf2Long(e.slice(pos, pos + 4));
        pos += 4;
        let nameLen = buf2Long(e.slice(pos, pos + 1));
        pos++;
        let topicName = buf2String(e.slice(pos, pos + nameLen));
        pos += nameLen;
        let fcount = buf2Long(e.slice(pos, pos + 1));
        pos++;
        // console.log(topicName);
        if (topicName === 'if|nse_cm|Nifty 50' || topicName === 'if|bse_cm|SENSEX') {
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

// const socket = new HSMWebSocket();
// export default socket;
