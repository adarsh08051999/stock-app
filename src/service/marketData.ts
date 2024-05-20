import { HSMWebSocket } from '../controllers/HSWebSocket';
import { NiftyData as MarketIndexData } from '../models/common';

export class MarketDataService {

  constructor() {
  }

  private async getLowestMarketIndex(): Promise<any> {
    const socket = new HSMWebSocket();
    await new Promise(resolve => setTimeout(resolve, 9000)); // play around with this---
    await socket.onopen();
    socket.setIntermediateMarketIndexPrice();
    await new Promise(resolve => setTimeout(resolve, 5000)); // play around with this---
    socket.subscribeIndexScrip();

    let a:any = {};
    let count:number = 15;
    while(Object.keys(a).length === 0 && count > 0){
      await new Promise(resolve => setTimeout(resolve, 1000));
      a = socket.getIntermediateMarketIndexPrice();
    }

    if(Object.keys(a).length === 0){
      throw Error('Market data fail');
    }

    socket.setIntermediateMarketIndexPrice();
    return a['Nifty 50'];
}

  public getMarketIndexData = async (): Promise<any> => {
    let dayMarketIndexLowest:MarketIndexData = await this.getLowestMarketIndex();
    let change = 100*((dayMarketIndexLowest.lowPrice - dayMarketIndexLowest.ic)/(dayMarketIndexLowest.ic));
    let curr_change = 100*((dayMarketIndexLowest.iv - dayMarketIndexLowest.ic)/(dayMarketIndexLowest.ic));
    return {highest_negative_change: change, current_change: curr_change,current_price: (dayMarketIndexLowest.iv)/100, yesterday_closing_price: (dayMarketIndexLowest.ic)/100, lowest_today_price: (dayMarketIndexLowest.lowPrice)/100};
  };
}
// use LLD here --- 