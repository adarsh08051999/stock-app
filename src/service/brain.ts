import { OrderController } from "../controllers/order";
import { TwoStockDetails } from "../models/common";
import { FindStockService } from "./findStock";
import { MarketDataService } from "./marketData";
import { UpdateDbService } from "./updateDb";

const FileSystem = require("fs");
class BrainService {
  public dummyVal: number;
  public filePath: string;
  public dateToday: string;
  private isStarted: boolean;
  private keepRunning: boolean;
  protected marketDataService: MarketDataService;
  protected updateDbService: UpdateDbService;
  protected findStockService: FindStockService;
  protected orderController: OrderController;
  constructor() {
    this.dummyVal = 0;
    this.filePath = "files/data.json";
    this.keepRunning = true;
    this.dateToday = new Date().toISOString().split("T")[0];
    this.marketDataService = new MarketDataService();
    this.updateDbService = new UpdateDbService();
    this.findStockService = new FindStockService();
    this.orderController = new OrderController();
  }
  public doLog(mssg: any) {
    console.log("BrainService: " + JSON.stringify(mssg));
  }

  public getMaxProcessedNifty(): number {
    try {
      const MaxProcessedNiftyFromFile = JSON.parse(
        FileSystem.readFileSync(this.filePath)
      );
      return MaxProcessedNiftyFromFile[this.dateToday] || 0;
    } catch (err) {
      console.log(`No file ${(err as any)?.message}`);
    }
    return 0;
  }
  public getIsStart(){
    return this.isStarted;
  }
  public unsetKeepRunning(){
    this.keepRunning = false;
  }
  public setKeepRunning(){
    this.keepRunning = true;
  }

  public async changeMaxProcessedNifty(change: number): Promise<void> {
    let niftyData: any = {};
    niftyData[this.dateToday] = change;
    await FileSystem.writeFile(
      this.filePath,
      JSON.stringify(niftyData),
      (error: any) => {
        if (error) throw error;
      }
    );
  }

  public async process(onlyOne?:boolean): Promise<boolean> {
    let stocks: TwoStockDetails = await this.findStockService.findStockAndBudget(
      true,7 // in-order to get <= 200 current price stock---
    );
    let kData: number = stocks.kotak_stock_data || 0;
    let dwhData: number = stocks.total_stock_dwh || 0;
    let oldData: number = stocks.old_stock_data || 0;
    if (dwhData - oldData > 15 || dwhData - kData > 15) {
      throw Error(`Too few stock checked ${JSON.stringify(stocks)}`);
    }
    let count = 2;
    // let myChosenQuantity = 2;
    this.doLog("Chosen stock - " + JSON.stringify(stocks));
    try {
      await this.orderController.placeOrderFunctional(
        stocks.firstStock.stockId,
        {
          dq: stocks.firstStock.currentPrice ? Math.floor(500/(stocks.firstStock.currentPrice)): 2,
          quantity: stocks.firstStock.currentPrice ? Math.floor(500/(stocks.firstStock.currentPrice)): 2,
          stock: stocks.firstStock.stockSymbol,
          customMessage: `stock- is ${stocks.firstStock.stockName}`,
        }
      );
      this.doLog(`Order placed for -1st ${stocks.firstStock.stockId} `);
    } catch (err) {
      count = count - 1;
      this.doLog(`Failed to place order-1 ${(err as any).message}`);
    }

    // added to handle single stock buying --- 
    if(onlyOne){
      if(count === 2){return true;}
      else{return false;}
    }

    try {
      await this.orderController.placeOrderFunctional(
        stocks.secondStock.stockId,
        {
          dq: stocks.secondStock.currentPrice ? Math.floor(600/(stocks.secondStock.currentPrice)): 2,
          quantity: stocks.secondStock.currentPrice ? Math.floor(600/(stocks.secondStock.currentPrice)): 2,
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

  public async startProcess(change: number): Promise<void> {
    if (this.dummyVal < change) {
      return;
    }
    let maxProcessed = this.getMaxProcessedNifty();
    let values: number[] = [-0.5, -1, -1.5, -2];
    for (let x of values) {
      if (change <= x && maxProcessed > x) {
        let orderPlace: boolean = await this.process();
        if (!orderPlace) {
          throw Error(`No Order placed`);
        }
        this.dummyVal = change;
        await this.changeMaxProcessedNifty(change);
        break;
      }
    }
  }

  public async start(): Promise<any> {
    this.isStarted = true;
    try{
      await this.updateDbService.updateBought();
      this.doLog("updated Bought stock in Portfolio Successfully");
    }
    catch(err){
      this.doLog("Error in updateBought:please check");
    }

    while (this.keepRunning && this.isPerfectTime() ) {
      try {
        let marketData: any = await this.marketDataService.getMarketIndexData();
        this.doLog(marketData.current_change);
        await this.startProcess(marketData.current_change);
      } catch (err) {
        console.log(`BrainService: Error - ${(err as any)?.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    this.isStarted = false;
  }
  public isPerfectTime(): Boolean {
    let d = new Date();
    let currentOffset = d.getTimezoneOffset();
    let ISTOffset = 330;
    let ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);

    let hour = ISTTime.getHours();
    let min = ISTTime.getMinutes();
    let day = ISTTime.getDay();

    if (day == 0 || day == 6) {
      return false;
    }

    if (
      (hour === 9 && min > 30) ||
      (hour > 9 && hour < 15) ||
      (hour == 15 && min <= 30)
    ) {
      return true;
    }
    return false;
  }
}
const brain = new BrainService();
export default brain;