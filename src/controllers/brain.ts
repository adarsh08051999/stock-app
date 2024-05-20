import { Request, Response } from "express";
import VError from "verror";
import brain from "../service/brain";
import { MarketDataService } from "../service/marketData";

export class BrainController {
  protected marketDataService: MarketDataService;

  constructor() {
    this.marketDataService = new MarketDataService();
  }

  public start = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      if (brain.getIsStart()) {
        response.status(400).send("Brain Service already running");
      } else {
        brain.setKeepRunning();
        brain.start();
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (brain.getIsStart()) {
          response.status(200).send(JSON.stringify("Invoked the service"));
        } else {
          response.status(400).send(JSON.stringify("Not appropriate time"));
        }
      }
      response.status(200).send(JSON.stringify("Invoked the service"));
    } catch (err) {
      const error: VError = new VError(
        `ERR in Invoking Brain Service ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };

  public stop = async (request: Request, response: Response): Promise<void> => {
    try {
      if (!brain.getIsStart()) {
        response.status(400).send("Already inactive");
      } else {
        brain.unsetKeepRunning();
        response
          .status(200)
          .send(JSON.stringify("Invoked stopping the brain service"));
      }
    } catch (err) {
      const error: VError = new VError(
        `ERR in Stopping Brain Service ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };

}
