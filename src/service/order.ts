import VError from "verror";
import constants from "../constants/common";
import { ApiCredentials, PortfolioResp } from "../models/common";
import { OrderDetails, JData, OrderType, AMO, OrderSource, ExchangeSegment, ProductCode, PosSqrFlg } from "../models/order";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { DBQuery } from "./dbQuery";
import loginServiceObj from "./login";
import { PortfolioService } from "./portfolio";
var qs = require("qs");

export class OrderService extends DBQuery {
  public lastDeleted: any;
  protected portfolioService: PortfolioService;
  constructor() {
    super();
    this.portfolioService = new PortfolioService();
  }

  private calculateSellPrice(averagePrice: number) {
    averagePrice = 1.0999 * averagePrice;
    let number = Math.floor(averagePrice);
    let firstTwoDecimalDigits = (Math.floor(averagePrice * 100)) % 100;
    if (firstTwoDecimalDigits <= 15) {
      averagePrice = number + 0.15;
    }
    else if (firstTwoDecimalDigits > 15) {
      averagePrice = number + 1.15;
    }
    return averagePrice;
  }
  private prepareLimitSellJData(reqQuery: any): JData {

    let data: JData = {
      am: AMO.NO,
      pt: OrderType.Limit,
      os: OrderSource.WEB,
      dq: reqQuery.dq || "0",
      ts: reqQuery.stock,
      mp: "0",
      pr: reqQuery.price,
      qt: reqQuery.quantity || "0",
      rt: "DAY",
      tp: "0",
      tt: "S",
      ig: reqQuery.customMessage,
      es: ExchangeSegment.NSE,
      pc: ProductCode.CashAndCarry,
      pf: PosSqrFlg.N,
    }
    return data;
  }

  public placeOrder = async (jData: JData): Promise<Object> => {

    let creds: ApiCredentials = await loginServiceObj.login();

    const reqConfig: AxiosRequestConfig = {
      method: "post",
      url: constants.KOTAK_LOGIN_URLS.OrderUrl,
      data: qs.stringify({
        jData: JSON.stringify(jData),
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "neo-fin-key": "neotradeapi",
        accept: "application/json",
        Sid: creds.sid,
        Auth: creds.token,
        Authorization: creds.accessToken,
      },
    };

    const res: AxiosResponse = await axios(reqConfig);
    console.log("Response from placeOrder API" + res);
    if (res.status === 200 && res.statusText == "OK") {
      if (jData.tt == "S" && res.data.stat != "Ok") {
      } else {
        return res.data;
      }
    }
    console.log(`Received non 2xx|not-Ok from order placing api ${res.status}`);
    throw new VError(`non 2xx|not-Ok from order placing api ${res.status}`);
  };

  public sellOrder = async (): Promise<Boolean> => {
    try {
      // loginServiceObj.deleteCreds();
      let creds = await loginServiceObj.login();

      let portfolio: PortfolioResp[] = await this.portfolioService.getPortfolio(creds);
      let stockIds: number[] = [];
      for (let x of portfolio) {
        stockIds.push(parseInt(x.exchangeIdentifier));
      }

      let stockNamesIdMap = await this.fetchStockSymbolFromStockIds(stockIds);
      let success = 0, failure = 0;
      for (let x of portfolio) {
        if (x.mktValue < 1.02 * x.holdingCost) { console.log(`Skipping placing sell Order for - ${JSON.stringify(x)} as in profit<2% !`); continue; }
        let query = {
          dq: x.quantity,
          quantity: x.quantity,
          stock: stockNamesIdMap[parseInt(x.exchangeIdentifier)],
          price: this.calculateSellPrice(x.averagePrice),
          customMessage: `Sell Order for.. ->${x.symbol}`
        }
        if (!query.stock) { continue; }
        let jData: JData = this.prepareLimitSellJData(query);
        try {
          await this.placeOrder(jData);
          success = success + 1;
        }
        catch (err) {
          failure = failure + 1;
          console.log(`Error in placing sell Order for ${x.symbol}`);
        }
      }
      console.log(`Sell Order Status : success count- ${success} , fail for ${failure} stocks`);
      return true;
    } catch (err) {
      const error: VError = new VError(`ERR in Sell Order service ${(err as any)?.message}`);
      throw error;
    }
  };
}
