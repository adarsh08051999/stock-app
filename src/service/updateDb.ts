import { DBQuery } from "./dbQuery";
import {PortfolioResp, StockShortData} from "../models/common";
import  {HSMWebSocket} from '../controllers/HSWebSocket';
import { PortfolioService } from "./portfolio";
import { LoginService } from "./login";

export class UpdateDbService extends DBQuery {
  protected portfolioService: PortfolioService;
  protected loginService: LoginService;
  constructor() {
    super();
    this.loginService = new LoginService();
    this.portfolioService = new PortfolioService();

  }

  private async getDataOfList(list: string[]): Promise<any>{
    const socket = new HSMWebSocket(); // try this may work ---
    await new Promise(resolve => setTimeout(resolve, 12000));
    await socket.onopen();
    await new Promise(resolve => setTimeout(resolve, 7000));


    let a:string = list.join('&');
    socket.setIntermediateStockPrice();
    socket.subscribeStockScrip(a);
    await new Promise(resolve => setTimeout(resolve, 10000));
    socket.unsubscribeStockScrip(a);
    let r = socket.getIntermediateStockPrice();
    if(Object.keys(r).length === 0){
      throw Error(`No data returned for length - ${list.length}`);
    }
    return r;
  }
  public deleteDb = async (): Promise<number> => {
    return await this.deleteOldData();
  };
  
  public updateDb = async (): Promise<void> => {
    let allStock: StockShortData[] = await this.getAll();
    let finalList: any[] = [];
    let i=0;
    while(i<allStock.length){
      let list:string[] = [];
      for(let j =i;j< Math.min(allStock.length,i+198);j++){
        list.push("nse_cm|" + allStock[j].stockId);
      }
      console.log(`Processing ${list.length} length with i as ${i} and size 198`);
      i=i+198;
      let r = await this.getDataOfList(list);

      for(const y in r){
        let index = allStock.findIndex((x) =>{return x.stockId === parseInt(y);});
        if(index === -1){continue;}
        let z = {
            date: new Date().toISOString().split('T')[0],
            closePrice: parseInt(r[y]) / 100,
            stockId: parseInt(y),
            stockSymbol: allStock[index]?.stockSymbol,
            stockName: allStock[index]?.stockName,
        };
        finalList.push(z);
      }
    }
    console.log(`Final Length of update is ${finalList.length}`);
    await this.insertOldDataOfStock(finalList); 
  };

  public updateBought = async (): Promise<string[]> => {
    let creds = await this.loginService.login();
    let portfolio:PortfolioResp[] = await this.portfolioService.getPortfolio(creds);
    let stockIds:string[]=[];
    for(const x of portfolio){
      stockIds.push(x.exchangeIdentifier);
    }
    await this.updateBoughtStock(stockIds);
    return stockIds;
  };

  public resetSold = async (): Promise<any> => {
    let creds = await this.loginService.login();
    let portfolio:PortfolioResp[] = await this.portfolioService.getPortfolio(creds);
    let stockIds:string[]=[];
    for(const x of portfolio){
      stockIds.push(x.exchangeIdentifier);
    }
    return await this.resetSoldStock(stockIds);
  };

  public updateDWH = async (StockDataToInsert: any): Promise<void> => {
    return await this.insertStockDWH(StockDataToInsert);
  };

  public updateDWHSingleEntry = async (stockId: number): Promise<void> => {
    return await this.updateBoughtStock([stockId.toString()]);
  };

}