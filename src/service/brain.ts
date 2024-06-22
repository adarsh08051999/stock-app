import { PortfolioResp } from "../models/common";
import { Strategy2 } from "./Strategy";
import { EmailService } from "./email";
import loginServiceObj from "./login";
import { OrderService } from "./order";
import { PortfolioService } from "./portfolio";
import { UpdateDbService } from "./updateDb";

class BrainService {
  private isStarted: boolean;
  private keepRunning: boolean;
  protected updateDbService: UpdateDbService;
  protected orderService: OrderService;
  protected portfolioService: PortfolioService;
  protected emailService: EmailService;
  constructor() {
    this.keepRunning = true;
    this.updateDbService = new UpdateDbService();
    this.orderService = new OrderService();
    this.portfolioService = new PortfolioService();
    this.emailService = new EmailService();
  }
  public getIsStart() {
    return this.isStarted;
  }
  public unsetKeepRunning() {
    this.keepRunning = false;
  }
  public setKeepRunning() {
    this.keepRunning = true;
  }
  public isMarketHours(): Boolean {
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
      (hour === 9 && min >= 15) ||
      (hour > 9 && hour < 15) ||
      (hour == 15 && min <= 30)
    ) {
      return true;
    }
    return false;
  }

  public async preMarketStuff(): Promise<void> {
    // place sell Order---
    try {
      await this.orderService.sellOrder();
      console.log("BrainService: sell Order Placed successfully");
    }
    catch (err) {
      console.log("BrainService: Error in sellOrder Placing");
    }

    // update Bought Stocks---
    try {
      await this.updateDbService.updateBought();
      console.log("BrainService: updated Bought stock in Portfolio Successfully");
    } catch (err) {
      console.log("BrainService: Error in updateBought:please check");
    }

    try {
      let creds = await loginServiceObj.getLoginCreds();
      let portfolio: PortfolioResp[] = await this.portfolioService.getPortfolio(creds);
      let data: string = '<h1>Portfolio Records - </h1><br><br>';
      portfolio.forEach((stockDetails) => {
        data = data + `Stock Data: <b>${stockDetails.displaySymbol}</b> <br>Quantity: <b> ${stockDetails.quantity} <br></b> Change(%): <b> ${(Math.round(100 * 100 * (stockDetails.closingPrice - stockDetails.averagePrice) / (stockDetails.averagePrice))) / 100} </b> <br><br><br> `
      });
      this.emailService.sendEmail(data);
    } catch (err) {
      console.log("BrainService: Failed to process Sending Email");
    }
  }

  public async start(): Promise<any> {
    this.isStarted = true;
    await loginServiceObj.deleteCreds();
    const strategy = new Strategy2(3);
    let firstTime: Boolean = true;
    while (this.keepRunning && this.isMarketHours()) {
      if (firstTime) {
        await this.preMarketStuff();
        firstTime = false;
      }
      try {
        await strategy.startProcess();
      } catch (err) {
        console.log(`BrainService: Error - ${(err as any)?.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    this.isStarted = false;
  }
}
const brain = new BrainService();
export default brain;
