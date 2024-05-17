"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const express = require("express");
const brain_1 = require("../controllers/brain");
const email_1 = require("../controllers/email");
const findStock_1 = require("../controllers/findStock");
const login_1 = require("../controllers/login");
const marketData_1 = require("../controllers/marketData");
const order_1 = require("../controllers/order");
const portfolio_1 = require("../controllers/portfolio");
const updateDb_1 = require("../controllers/updateDb");
const emailController = new email_1.EmailController();
const loginController = new login_1.LoginController();
const orderController = new order_1.OrderController();
const findStockController = new findStock_1.FindStockController();
const portfolioController = new portfolio_1.PortfolioController();
const updateDbController = new updateDb_1.UpdateDbController();
const marketDataController = new marketData_1.MarketDataController();
const brainController = new brain_1.BrainController();
const router = express.Router();
class Router {
    constructor() {
        this.handle = () => {
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
}
exports.Router = Router;
