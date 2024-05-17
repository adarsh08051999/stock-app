import { Request, Response } from "express";
import VError from "verror";
import brain from "../service/brain";
import { MarketDataService } from "../service/marketData";

export class BrainController {
  protected marketDataService: MarketDataService;
  public checkTimeFor3pm() {
    return true;
    let d = new Date();
    let currentOffset = d.getTimezoneOffset();
    let ISTOffset = 330; // IST offset UTC +5:30
    let ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);

    let hour = ISTTime.getHours();
    let min = ISTTime.getMinutes();

    if (hour === 15 && min < 15) {
      return true;
    }
    brain.doLog("Not 3pm");
    return false;
  }

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

  public placeOrder3pm = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      if (this.checkTimeFor3pm()) {
        let temp: Boolean = false;
        let niftyData: number = await this.marketDataService.getMarketIndexData();
        if (niftyData < 0) {
          temp = await brain.process();
        } else {
          temp = await brain.process(true);
        }

        if (temp) {
          response.status(200).send("Order Placed");
          return;
        }
        else{
          response.status(500).send("No order place");
          return;
        }
      }
      response.status(501).send('time outside valid range');
    } catch (err) {
      const error: VError = new VError(
        `ERR in placing order-3pm ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };
}
