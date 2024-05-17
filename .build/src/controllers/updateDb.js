"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDbController = void 0;
const verror_1 = __importDefault(require("verror"));
const fs = require("fs");
const updateDb_1 = require("../service/updateDb");
class UpdateDbController {
    constructor() {
        this.parseCSV = (csv) => __awaiter(this, void 0, void 0, function* () {
            let lines = csv.split("\n");
            const headers = lines[0].split(",");
            console.log(lines.length);
            const data = [];
            let ans = [];
            for (let i = 1; i < lines.length; i++) {
                let temp = lines[i].split(",");
                if (!(temp[3] && temp[2] && temp[0])) {
                    continue;
                }
                let StockDataToInsert = {
                    stockId: temp[3],
                    stockName: temp[0],
                    stockSymbol: temp[2],
                    toBuy: true,
                    budget: 5000,
                    netLifetimeEarnings: 0,
                    isRemoved: false,
                };
                ans.push(StockDataToInsert);
            }
            yield this.updateDbService.updateDWH(ans);
        });
        this.updateDbUsingFile = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                const csvFilePath = "pcode.csv";
                yield fs.readFile(csvFilePath, "utf8", (error, csvData) => __awaiter(this, void 0, void 0, function* () {
                    if (error) {
                        console.error("Error reading the CSV file:", error);
                        return;
                    }
                    yield this.parseCSV(csvData);
                    response.status(200).send("Success");
                }));
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Update Db Controller route ${err === null || err === void 0 ? void 0 : err.message}`);
                console.error(error.stack);
                response.status(500).send(error);
            }
        });
        this.deleteOldData = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.updateDbService.deleteDb();
                response.status(200).send("Successfully Deleted");
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Deleting Db Controller ---  route ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.updateDb = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let admin = request.query.admin ? true : false;
                if (!this.isPerfectTime() && !admin) {
                    response.status(400).send("Not appropriate time to update");
                    return;
                }
                else if (!admin) {
                    let date = new Date().toISOString().split('T')[0];
                    let countOfData = yield this.updateDbService.fetchOldData(date);
                    try {
                        if (countOfData > 0) {
                            response.status(400).send(`Already added for date - ${date} date count is ${countOfData}`);
                        }
                    }
                    catch (err) {
                        console.log(`cant check data for date - ${date} during update`);
                    }
                }
                yield this.updateDbService.updateDb();
                response.status(200).send("Successfully Updated");
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Update Db Controller ---  route ${err === null || err === void 0 ? void 0 : err.message}`);
                console.error(error.stack);
                response.status(500).send(error);
            }
        });
        this.updateBought = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let res = yield this.updateDbService.updateBought();
                response.status(200).send(res);
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Syncing Db Controller ---  route ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.resetSold = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let res = yield this.updateDbService.resetSold();
                response.status(200).send(res);
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Resetting sold stocks ---  route ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.getDwh = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let res = yield this.updateDbService.getAllDWH();
                response.status(200).send(res);
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Getting DWH ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.changeDwh = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let stockId = request.body.stockId;
                let budget = request.body.budget;
                let isRemoved = (request.body.isRemoved) || false;
                if (!(stockId && budget && (budget > 10))) {
                    response.status(400).send("id,budget or isRemoved missing");
                    return;
                }
                yield this.updateDbService.updateDwh(stockId, budget, isRemoved);
                response.status(200).send("Successfully changed");
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Getting DWH ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.addDwh = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let stockId = (parseInt(request.query.stockId, 10));
                let budget = (parseInt(request.query.budget, 10)) || 100;
                let stockSymbol = request.query.stockSymbol;
                let stockName = request.query.stockName;
                let stockData = {
                    stockName,
                    stockSymbol,
                    budget,
                    stockId,
                };
                if (!(stockId && stockSymbol && stockName && budget && budget >= 10)) {
                    response.status(400).send(`id,budget or stockSymbol missing- ${JSON.stringify(stockData)}`);
                    return;
                }
                yield this.updateDbService.insertStockDWH([stockData]);
                response.status(200).send("Successfully changed");
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Getting DWH ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.countOldData = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let date = request.query.date;
                if (!date) {
                    response.status(400).send(`date missing- format : yyyy-mm-dd }`);
                    return;
                }
                let data = yield this.updateDbService.fetchOldData(date);
                console.log(data);
                response.status(200).send(`Old data Counts for ${date} are ` + JSON.stringify(data));
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Getting OldData count ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.deleteDwh = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let id = (parseInt(request.query.id, 10));
                if (!(id)) {
                    response.status(400).send(`id missing-`);
                    return;
                }
                yield this.updateDbService.deleteStockDWH(id);
                response.status(200).send("Successfully changed");
            }
            catch (err) {
                const error = new verror_1.default(`ERR in Getting DWH ${err === null || err === void 0 ? void 0 : err.message}`);
                response.status(500).send(error);
            }
        });
        this.updateDbService = new updateDb_1.UpdateDbService();
    }
    isPerfectTime() {
        let d = new Date();
        let currentOffset = d.getTimezoneOffset();
        let ISTOffset = 330; // IST offset UTC +5:30 
        let ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);
        let hour = ISTTime.getHours();
        let min = ISTTime.getMinutes();
        let day = ISTTime.getDay();
        if (day == 0 || day == 6) {
            return false;
        } // sat-sun ignore -- 
        console.log(hour);
        if (hour === 15 && min > 31) {
            return true;
        }
        else if (hour > 15 && hour <= 23) {
            return true;
        }
        return false;
    }
}
exports.UpdateDbController = UpdateDbController;
