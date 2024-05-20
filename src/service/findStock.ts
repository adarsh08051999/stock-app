import { HSMWebSocket } from "../controllers/HSWebSocket";
import {
  FindStockResponse,
  StockDetails,
  StockDetailsExtended,
  TwoStockDetails,
} from "../models/common";
import StockOldData from "../models/stockOldData";
import { DBQuery } from "./dbQuery";

export class FindStockService extends DBQuery {
  constructor() {
    super();
  }
  private async getDataOfList(list: string[]): Promise<any> {
    const socket = new HSMWebSocket(); // try this may work ---
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await socket.onopen();
    await new Promise((resolve) => setTimeout(resolve, 5000));

    let a: string = list.join("&");
    socket.setIntermediateStockPrice();
    socket.subscribeStockScrip(a);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    socket.unsubscribeStockScrip(a);
    let r = socket.getIntermediateStockPrice();
    if (Object.keys(r).length === 0) {
      throw Error(`No data returned for length - ${list.length}`);
    }
    return r;
  }

  private async enrichWithCurrentStat(
    eligibleStocks: StockDetails[],
    loggingObj: any,
    oldDays: number
  ): Promise<StockDetailsExtended[]> {
    let list: StockOldData[] = await this.getAllOldData(oldDays);

    if (!list || !list.length) {
      throw Error(`No Old data for today's ${oldDays} day back`);
    }

    let list1: string[] = [],
      list2: string[] = [];
    for (let i = 0; i < Math.min(eligibleStocks.length, 190); i++) {
      list1.push("nse_cm|" + eligibleStocks[i].stockId);
    }
    for (
      let i = Math.min(190, eligibleStocks.length);
      i < eligibleStocks.length;
      i++
    ) {
      list2.push("nse_cm|" + eligibleStocks[i].stockId);
    }

    let r = await this.getDataOfList(list1);
    if (Object.keys(r).length === 0) {
      throw Error(`websocket data 1 not recieved `);
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));

    if (list2.length > 0) {
      let r2 = await this.getDataOfList(list2);
      if (Object.keys(r2).length === 0) {
        throw Error(`websocket data 2 not recieved `);
      }
      r = { ...r2, ...r };
    }
    console.log(
      `total(to buy) =  ${eligibleStocks.length} \n kotak data fetch = ${
        Object.keys(r).length
      } \n old data available = ${list.length}`
    );
    loggingObj.total_stock_dwh = eligibleStocks.length;
    loggingObj.kotak_stock_data = Object.keys(r).length;
    loggingObj.old_stock_data = list.length;

    let resp: StockDetailsExtended[] = [];
    for (const stock of eligibleStocks) {
      let index1 = list.findIndex((x) => {
        return stock.stockId === x.stockId;
      });
      if (!r[stock.stockId] || !list[index1]?.closePrice) {
        continue;
      }
      let currPrice: number = parseInt(r[stock.stockId]) / 100;
      let oldPrice: number = list[index1].closePrice;
      let change: number = 100 * ((currPrice - oldPrice) / oldPrice);
      let z: StockDetailsExtended = stock;
      z.currentChange = change;
      z.currentPrice = currPrice;
      z.oldPrice = oldPrice;
      resp.push(z);
    }
    return resp;
  }

  private chooseBestStockToBuy(
    eligibleStocks: StockDetailsExtended[]
  ): TwoStockDetails {
    if (
      Math.abs(
        eligibleStocks[0].currentChange! - eligibleStocks[1].currentChange!
      ) > 10
    ) {
      return { firstStock: eligibleStocks[1], secondStock: eligibleStocks[2] };
    }
    return { firstStock: eligibleStocks[0], secondStock: eligibleStocks[1] };
  }

  public findStockOld = async (
    type: boolean,
    customDays: number
  ): Promise<TwoStockDetails> => {
    let eligibleStocks: StockDetails[] = await this.getEligibleStockToBuy();
    let loggingObj: any = {};
    //algo to fetch the drop of each stock and find the most deserving buying stock--
    let eligibleStocksUpdated = await this.enrichWithCurrentStat(
      eligibleStocks,
      loggingObj,
      customDays
    );

    // sort based on market change--
    eligibleStocksUpdated.sort((a, b) => {
      if (a.currentChange && b.currentChange) {
        if (a.currentChange < b.currentChange) {
          return -1;
        } else if (a.currentChange > b.currentChange) {
          return 1;
        }
      }
      return 0;
    });

    if (type) {
      eligibleStocksUpdated = eligibleStocksUpdated.filter(
        (x) => x.currentPrice && x.currentPrice <= 300
      );
      console.log(`Filtered all stock with cost<300`);
    }

    //pick first 3 stocks---
    let topThreeStock: StockDetailsExtended[] = eligibleStocksUpdated.slice(
      0,
      3
    );

    //get 2 selected from the 3 stocks--
    let topPickStock: TwoStockDetails = this.chooseBestStockToBuy(
      topThreeStock
    );
    topPickStock.total_stock_dwh = loggingObj?.total_stock_dwh;
    topPickStock.kotak_stock_data = loggingObj?.kotak_stock_data;
    topPickStock.old_stock_data = loggingObj?.old_stock_data;
    topPickStock.extras = eligibleStocksUpdated;

    return topPickStock;
  };

  public findStock = async (): Promise<FindStockResponse> => {
    let eligibleStocks: StockDetails[] = await this.getEligibleStockToBuy();
    let loggingObj: any = {};
    //algo to fetch the drop of each stock and find the most deserving buying stock--
    let eligibleStocksUpdated = await this.enrichWithCurrentStat(
      eligibleStocks,
      loggingObj,
      7
    );

    // sort based on market change--
    eligibleStocksUpdated.sort((a, b) => {
      if (a.currentChange && b.currentChange) {
        if (a.currentChange < b.currentChange) {
          return -1;
        } else if (a.currentChange > b.currentChange) {
          return 1;
        }
      }
      return 0;
    });

    let allStocks:FindStockResponse = {
      stocks: eligibleStocksUpdated,
      total_stock_dwh: loggingObj?.total_stock_dwh,
      kotak_stock_data: loggingObj?.kotak_stock_data,
      old_stock_data: loggingObj?.old_stock_data,
    }
    return allStocks;
  };

  public getDates = async (): Promise<any> => {
    return this.getAllDates();
  };
}
