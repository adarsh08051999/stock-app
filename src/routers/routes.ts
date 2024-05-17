import express = require("express");
import { BrainController } from "../controllers/brain";
import { EmailController } from "../controllers/email";
import { FindStockController } from "../controllers/findStock";
import { LoginController } from "../controllers/login";
import { MarketDataController } from "../controllers/marketData";
import { OrderController } from "../controllers/order";
import { PortfolioController } from "../controllers/portfolio";
import { UpdateDbController } from "../controllers/updateDb";
const emailController: EmailController = new EmailController();
const loginController: LoginController = new LoginController();
const orderController: OrderController = new OrderController();
const findStockController: FindStockController = new FindStockController();
const portfolioController: PortfolioController = new PortfolioController();
const updateDbController: UpdateDbController = new UpdateDbController();
const marketDataController: MarketDataController = new MarketDataController();
const brainController: BrainController = new BrainController();
const router = express.Router();
export class Router {
  public handle: any = () => {
    router.get("/status", (req, resp) => {
      resp
        .status(200)
        .json({
          success: true,
        })
        .end();
      return;
    });

    // route for email and stock broker verifications
    router.get("/getOtpFromEmail", emailController.getOtpFromEmail);
    router.get("/login", loginController.login);
    router.get("/deleteCreds", loginController.deleteCreds);
    // ----

    // start stop brain service
    router.get("/start", brainController.start);
    router.get("/stop", brainController.stop);
    // ----

    // developer monitoring route
    router.get("/marketChange", marketDataController.marketData);
    router.get("/getPortfolio", portfolioController.getPortfolio);
    router.get("/oldDataDates", findStockController.getDates);
    router.get("/getCountOfOldData", updateDbController.countOldData);
    // ----

    // cron route to manage data
    router.get("/updateBought", updateDbController.updateBought);
    router.get("/sellOrder", orderController.sellOrder);
    router.get("/resetSold", updateDbController.resetSold);
    router.get("/updateDb", updateDbController.updateDb);
    router.get("/3pm", brainController.placeOrder3pm);
    router.get("/deleteOld", updateDbController.deleteOldData);

    // ----

    // deep stock horizon table CRUDS
    router.get("/getDwh", updateDbController.getDwh);
    router.post("/Dwh", updateDbController.changeDwh);
    router.put("/Dwh", updateDbController.addDwh);
    router.delete("/Dwh", updateDbController.deleteDwh);
    // ----

    // developer placing order or analyzing stock picks
    router.get("/buyOrder", orderController.placeOrder);
    router.get("/findStock", findStockController.findStockAndBudget);
    // ----

    // router.get('/populateDwh',updateDbController.updateDbUsingFile);

    return router;
  };
}
