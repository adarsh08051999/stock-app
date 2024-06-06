import { OrderController } from "../controllers/order";
import {
  FindStockResponse,
  StockDetailsExtended,
  TwoStockDetails,
} from "../models/common";
import { FindStockService } from "./findStock";
import { LoginService } from "./login";
import { MarketDataService } from "./marketData";
const FileSystem = require("fs");
export abstract class Strategy {
  public strategyName: string;
  public todayProcessedDataFilePath: string;
  public dateToday: string;
  public stockCountToBuy: number;
  protected marketDataService: MarketDataService;
  protected findStockService: FindStockService;
  protected orderController: OrderController;
  protected loginService: LoginService;

  constructor(
    name: string,
    todayProcessedDataFilePath: string,
    stockCountToBuy: number
  ) {
    this.strategyName = name;
    this.todayProcessedDataFilePath = todayProcessedDataFilePath;
    this.stockCountToBuy = stockCountToBuy;
    this.dateToday = new Date().toISOString().split("T")[0];
    this.findStockService = new FindStockService();
    this.orderController = new OrderController();
    this.loginService = new LoginService();
    this.marketDataService = new MarketDataService(); // may make it factory design pattern
  }

  abstract process(marketData: number): Promise<Boolean | void>;

  public doLog(message: any) {
    console.log(
      `StrategyClass: ${this.strategyName}: ` + JSON.stringify(message)
    );
  }

  public async startProcess() {
    let marketData: any = await this.marketDataService.getMarketIndexData();
    this.doLog(`The Market data got is - ${JSON.stringify(marketData)}`);
    await this.process(marketData);
  }
}

export class Strategy1 extends Strategy {
  public changeProcessed: number;
  constructor(stocksToBuy: number) {
    super("Strategy1- Initial Strategy", "files/data.json", stocksToBuy); // in future name of file(arg2) we can make user dependent: LLD of user class
    this.changeProcessed = 0;
  }
  public getMaxProcessedNifty(): number {
    try {
      const MaxProcessedNiftyFromFile = JSON.parse(
        FileSystem.readFileSync(this.todayProcessedDataFilePath)
      );
      return MaxProcessedNiftyFromFile[this.dateToday] || 0;
    } catch (err) {
      console.log(`No file ${(err as any)?.message}`);
    }
    return 0;
  }

  public async changeMaxProcessedNifty(change: number): Promise<void> {
    let niftyData: any = {};
    niftyData[this.dateToday] = change;
    await FileSystem.writeFile(
      this.todayProcessedDataFilePath,
      JSON.stringify(niftyData),
      (error: any) => {
        if (error) throw error;
      }
    );
  }

  public async tryPlacingOrder(): Promise<boolean> {
    let stocks: TwoStockDetails = await this.findStockService.findStockOld(
      true,
      7 // in-order to get <= 200 current price stock---
    );
    let kData: number = stocks.kotak_stock_data || 0;
    let dwhData: number = stocks.total_stock_dwh || 0;
    let oldData: number = stocks.old_stock_data || 0;

    if (dwhData - oldData > 15 || dwhData - kData > 15) {
      throw Error(`Too few stock checked ${JSON.stringify(stocks)}`);
    }

    let count = 2;
    this.doLog("Chosen stock - " + JSON.stringify(stocks));

    try {
      await this.orderController.placeOrderFunctional(
        stocks.firstStock.stockId,
        {
          dq: stocks.firstStock.currentPrice
            ? Math.floor(500 / stocks.firstStock.currentPrice)
            : 2,
          quantity: stocks.firstStock.currentPrice
            ? Math.floor(500 / stocks.firstStock.currentPrice)
            : 2,
          stock: stocks.firstStock.stockSymbol,
          customMessage: `stock- is ${stocks.firstStock.stockName}`,
        }
      );
      this.doLog(`Order placed for -1st ${stocks.firstStock.stockId} `);
    } catch (err) {
      count = count - 1;
      this.doLog(`Failed to place order-1 ${(err as any).message}`);
    }

    try {
      await this.orderController.placeOrderFunctional(
        stocks.secondStock.stockId,
        {
          dq: stocks.secondStock.currentPrice
            ? Math.floor(600 / stocks.secondStock.currentPrice)
            : 2,
          quantity: stocks.secondStock.currentPrice
            ? Math.floor(600 / stocks.secondStock.currentPrice)
            : 2,
          stock: stocks.secondStock.stockSymbol,
          customMessage: `stock- is ${stocks.secondStock.stockName}`,
        }
      );
      this.doLog(`Order placed for -2nd  ${stocks.secondStock.stockId} `);
    } catch (err) {
      count = count - 1;
      this.doLog(`Failed to place order-2 ${(err as any).message}`);
    }

    if (count > 0) {
      return true;
    }
    return false;
  }

  public async process(marketData: any): Promise<Boolean | void> {
    let marketChange = marketData.current_change;
    if (marketChange > this.changeProcessed) {
      return;
    }

    let maxProcessed = this.getMaxProcessedNifty();
    let values: number[] = [-0.5, -1, -1.5, -2];

    for (let x of values) {
      if (marketChange <= x && maxProcessed > x) {
        let orderPlace: boolean = await this.tryPlacingOrder();

        if (!orderPlace) {
          this.doLog(`Order placing fail for marketChange - ${marketChange}`);
          throw Error(`No Order placed`);
        }
        this.changeProcessed = marketChange;
        await this.changeMaxProcessedNifty(marketChange);
        return true;
      }
    }
    return false;
  }
}

export class Strategy2 extends Strategy {
  constructor(stocksToBuy: number) {
    super("Strategy-2 every day Order", "files/data2.json", stocksToBuy);
  }

  public checkTimeFor3pm() {
    let d = new Date();
    let currentOffset = d.getTimezoneOffset();
    let ISTOffset = 330; // IST offset UTC +5:30
    let ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);

    let hour = ISTTime.getHours();
    let min = ISTTime.getMinutes();

    if (hour === 15 && min < 30) {
      return true;
    }
    this.doLog(`Not 3pm ${hour}: ${min}`);
    return false;
  }

  public getCachingDataForStockBoughtToday(): number {
    try {
      const StocksBoughtCount = JSON.parse(
        FileSystem.readFileSync(this.todayProcessedDataFilePath)
      );

      return StocksBoughtCount[this.dateToday] || 0;
    } catch (err) {
      console.log(`No file ${(err as any)?.message}`);
    }
    return 0;
  }

  public async updateCachingDataForTheDay(
    alreadyBought: number
  ): Promise<void> {
    let stocksBoughtCount: any = {};
    stocksBoughtCount[this.dateToday] = alreadyBought;
    await FileSystem.writeFile(
      this.todayProcessedDataFilePath,
      JSON.stringify(stocksBoughtCount),
      (error: any) => {
        if (error) throw error;
      }
    );
  }

  public async tryPlacingOrder(countOfStock: number): Promise<number> {
    let stocks: FindStockResponse = await this.findStockService.findStock();
    let kData: number = stocks.kotak_stock_data || 0;
    let dwhData: number = stocks.total_stock_dwh || 0;
    let oldData: number = stocks.old_stock_data || 0;

    if (dwhData - oldData > 15 || dwhData - kData > 15) {
      throw Error(`Too few stock checked ${JSON.stringify(stocks)}`);
    }
    if (
      Math.abs(
        stocks.stocks[0].currentChange! - stocks.stocks[1].currentChange!
      ) > 10
    ) {
      stocks.stocks.shift();
    }

    let chosenStocks: StockDetailsExtended[] = stocks.stocks.slice(
      0,
      countOfStock
    );
    this.doLog("Chosen stock - " + JSON.stringify(chosenStocks));
    await this.loginService.deleteCreds();
    let successOrderCount = 0;
    for (const stock of chosenStocks) {
      try {
        successOrderCount = successOrderCount + 1;
        await this.orderController.placeOrderFunctional(stock.stockId, {
          dq: 1,
          quantity: 1,
          stock: stock.stockSymbol,
          customMessage: `stock using strategy ${this.strategyName} - is ${stock.stockName}`,
        });
        this.doLog(`Order placed for -1st ${stock.stockId} `);
      } catch (err) {
        this.doLog(
          `Failed to place order-1 for ${stock.stockId}: error-  ${
            (err as any).message
          }`
        );
        successOrderCount = successOrderCount - 1;
      }
    }
    return successOrderCount;
  }

  public async process(marketData: any): Promise<Boolean | void> {
    //check if already full for the day ?
    let stockAlreadyBought: number = this.getCachingDataForStockBoughtToday();
    if (stockAlreadyBought >= this.stockCountToBuy) {
      return;
    }

    let leftToBuy: number = this.stockCountToBuy - stockAlreadyBought;

    let maxFall: number = marketData.highest_negative_change;
    let successOrderCount: number = 0;
    if (maxFall <= -0.15) {
      successOrderCount = await this.tryPlacingOrder(leftToBuy);
    } else if (this.checkTimeFor3pm()) {
      successOrderCount = await this.tryPlacingOrder(leftToBuy);
    }
    if (successOrderCount === 0) {
      return false;
    }

    await this.updateCachingDataForTheDay(
      stockAlreadyBought + successOrderCount
    );
    return true;
  }
}
