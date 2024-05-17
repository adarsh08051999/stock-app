import { Request, Response } from "express";
import VError from "verror";
import { MarketDataService } from "../service/marketData";

export class MarketDataController {
  protected marketDataService: MarketDataService;

  constructor() {
    this.marketDataService = new MarketDataService();
  }


  public marketData = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let data = await this.marketDataService.getMarketIndexData();
      response.status(200).send(data);
    } catch (err) {
      const error: VError = new VError(
        `ERR in Market Data Controller route ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };
}
