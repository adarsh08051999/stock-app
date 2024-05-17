import { Request, response, Response } from "express";
import VError from "verror";
import { StockDetails } from "../models/common";
import StockData from "../models/stockData";
const fs = require("fs");
import { UpdateDbService } from "../service/updateDb";

export class UpdateDbController {
  protected updateDbService: UpdateDbService;

  constructor() {
    this.updateDbService = new UpdateDbService();
  }

  public parseCSV = async(csv: any) => {
    let lines = csv.split("\n");
    const headers = lines[0].split(",");
    console.log(lines.length);
    const data = [];

    let ans:any[] = [];
    for (let i = 1; i < lines.length; i++) {
      let temp = lines[i].split(",");
      if(!(temp[3] && temp[2] && temp[0])){continue;}

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
    await this.updateDbService.updateDWH(ans);
  };

  public updateDbUsingFile = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      const csvFilePath = "pcode.csv";
      await fs.readFile(csvFilePath, "utf8", async (error: any, csvData: any) => {
        if (error) {
          console.error("Error reading the CSV file:", error);
          return;
        }
        await this.parseCSV(csvData);
        response.status(200).send("Success");
      });
    } catch (err) {
      const error: VError = new VError(
        `ERR in Update Db Controller route ${(err as any)?.message}`
      );
      console.error(error.stack);
      response.status(500).send(error);
    }
  };

  public deleteOldData = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      await this.updateDbService.deleteDb();
      response.status(200).send("Successfully Deleted");
    } catch (err) {
      const error: VError = new VError(
        `ERR in Deleting Db Controller ---  route ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };

  public isPerfectTime(): boolean{

    let d = new Date();
    let currentOffset = d.getTimezoneOffset();
    let ISTOffset = 330;   // IST offset UTC +5:30 
    let ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset)*60000);

    let hour = ISTTime.getHours();
    let min = ISTTime.getMinutes();
    let day = ISTTime.getDay();

    if(day == 0 || day == 6){return false;} // sat-sun ignore -- 

    console.log(hour);
    if(hour === 15 && min>31){
      return true;
    }
    else if(hour > 15 && hour <= 23){
      return true;
    }
    return false;
  }


  public updateDb = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let admin = request.query.admin ? true : false; 
      if(!this.isPerfectTime() && !admin){
        response.status(400).send("Not appropriate time to update");
        return;
      }
      else if(!admin){
          let date = new Date().toISOString().split('T')[0];
          let countOfData = await this.updateDbService.fetchOldData(date);
        try{
          if(countOfData > 0){
            response.status(400).send(`Already added for date - ${date} date count is ${countOfData}`);
          }
        }
        catch(err){
          console.log(`cant check data for date - ${date} during update`);
        }
      }

      await this.updateDbService.updateDb();
      response.status(200).send("Successfully Updated");
    } catch (err) {
      const error: VError = new VError(
        `ERR in Update Db Controller ---  route ${(err as any)?.message}`
      );
      console.error(error.stack);
      response.status(500).send(error);
    }
  };

  public updateBought = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let res = await this.updateDbService.updateBought();
      response.status(200).send(res);
    } catch (err) {
      const error: VError = new VError(
        `ERR in Syncing Db Controller ---  route ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };

  public resetSold = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let res = await this.updateDbService.resetSold();
      response.status(200).send(res);
    } catch (err) {
      const error: VError = new VError(
        `ERR in Resetting sold stocks ---  route ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };


  public getDwh = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let res:StockData[] = await this.updateDbService.getAllDWH();
      response.status(200).send(res);
    } catch (err) {
      const error: VError = new VError(
        `ERR in Getting DWH ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };

  public changeDwh = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let stockId:number = request.body.stockId;
      let budget:number = request.body.budget;
      let isRemoved:boolean = (request.body.isRemoved) || false;
      if(!(stockId && budget && (budget > 10))){
        response.status(400).send("id,budget or isRemoved missing");
        return;
      }
      await this.updateDbService.updateDwh(stockId,budget,isRemoved);
      response.status(200).send("Successfully changed");
    } catch (err) {
      const error: VError = new VError(
        `ERR in Getting DWH ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };

  public addDwh  = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let stockId:number = (parseInt(request.query.stockId as string,10));
      let budget:number = (parseInt(request.query.budget as string,10)) || 100;
      let stockSymbol:string = (request.query.stockSymbol as string);
      let stockName:string = (request.query.stockName as string);

      let stockData: StockDetails = {
        stockName,
        stockSymbol,
        budget,
        stockId,
      }

      if(!(stockId && stockSymbol && stockName && budget && budget>=10)){
        response.status(400).send(`id,budget or stockSymbol missing- ${JSON.stringify(stockData)}`);
        return;
      }

      await this.updateDbService.insertStockDWH([stockData]);
      response.status(200).send("Successfully changed");
    } catch (err) {
      const error: VError = new VError(
        `ERR in Getting DWH ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };

  public countOldData  = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let date:string = (request.query.date as string);

      if(!date){
        response.status(400).send(`date missing- format : yyyy-mm-dd }`);
        return;
      }

      let data = await this.updateDbService.fetchOldData(date);
      console.log(data);
      response.status(200).send(`Old data Counts for ${date} are ` + JSON.stringify(data));
    } catch (err) {
      const error: VError = new VError(
        `ERR in Getting OldData count ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };

  
  
  public deleteDwh  = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    try {
      let id:number = (parseInt(request.query.id as string,10));

      if(!(id)){
        response.status(400).send(`id missing-`);
        return;
      }

      await this.updateDbService.deleteStockDWH(id);
      response.status(200).send("Successfully changed");
    } catch (err) {
      const error: VError = new VError(
        `ERR in Getting DWH ${(err as any)?.message}`
      );
      response.status(500).send(error);
    }
  };


  // public updateDWH = async (
  //   request: Request,
  //   response: Response
  // ): Promise<void> => {
  //   try {
  //     const XLSX = require('xlsx');
  //     const axios = require('axios');
  //     const workbook = XLSX.readFile('/Users/adarsh.a/Desktop/test.xls');
  //     const sheetName = workbook.SheetNames[0];
  //     const sheet = workbook.Sheets[sheetName];

  //     const data = XLSX.utils.sheet_to_json(sheet);
  //     let N = data.length;
  //     let obj:StockDetails[] = [];

  //     for(let i=0;i<N;i++){
  //         if(data[i].pGroup == 'EQ'){
  //             obj.push({
  //                 stockId: data[i].pSymbol,
  //                 stockSymbol: data[i].pTrdSymbol,
  //                 stockName: data[i].pDesc,
  //                 budget: 500,
  //             });
  //         }
  //     }
  //     for(let i=0;i<obj.length;i++){
  //       try{
  //         await this.updateDbService.insertStockDWH([obj[i]]);
  //         console.log("okk");
  //       }catch{

  //       }
        
  //     }
      //:: validate Body ---
      // this.updateDbService.updateDWH(request.body);
  //     response.status(200).send("Updated successfully");
  //   } catch (err) {
  //     const error: VError = new VError(
  //       `ERR in Update DWH Controller route ${(err as any)?.message}`
  //     );
  //     response.status(500).send(error);
  //   }
  // };
}
