import { Request, Response } from 'express';
import VError from 'verror';
import { ApiCredentials, PortfolioResp } from '../models/common';
import { JData,AMO,ExchangeSegment, ProductCode, PosSqrFlg, OrderType,OrderSource } from '../models/order';
import { LoginService } from '../service/login';
import { OrderService } from '../service/order';
import { PortfolioService } from '../service/portfolio';
import { UpdateDbService } from '../service/updateDb';

export class OrderController {
    private calculatePrice(averagePrice: number) {
        averagePrice = 1.0999* averagePrice;
        let number = Math.floor(averagePrice);
        let firstTwoDecimalDigits = (Math.floor(averagePrice*100))%100;
        if( firstTwoDecimalDigits <=15){
            averagePrice = number +  0.15;
        }
        else if(firstTwoDecimalDigits > 15){
            averagePrice = number+1.15;
        }
        return averagePrice;
    }

    protected orderService: OrderService;
    protected loginService: LoginService;
    protected portfolioService: PortfolioService;
    protected updateDbService: UpdateDbService;
    public creds: ApiCredentials;

    constructor() {
        this.orderService = new OrderService();
        this.loginService = new LoginService();
        this.portfolioService = new PortfolioService();
        this.updateDbService = new UpdateDbService();
    }
    private validateOrder(data: JData) {
        if(data)
        // validate request for budget etc.
        return true;
    }

    private prepareMktBuyJData(reqQuery:any):JData{

        let data:JData  = {
            am: AMO.NO,
            pt: OrderType.Market,
            os: OrderSource.WEB,
            dq:reqQuery.dq || "0",
            ts:reqQuery.stock,
            mp:"0",
            pr:"0",
            qt:reqQuery.quantity || "0",
            rt:"DAY",
            tp:"0",
            tt:"B",
            ig: reqQuery.customMessage,
            es:ExchangeSegment.NSE,
            pc:ProductCode.CashAndCarry,
            pf:PosSqrFlg.N,
        }
        if(!this.validateOrder(data)){
            throw new VError("Request is not properly enriched");
        }
        return data;
      }
    
      private prepareLimitSellJData(reqQuery:any):JData{

        let data:JData  = {
            am: AMO.NO,
            pt: OrderType.Limit,
            os: OrderSource.WEB,
            dq:reqQuery.dq || "0",
            ts:reqQuery.stock,
            mp:"0",
            pr: reqQuery.price,
            qt:reqQuery.quantity || "0",
            rt:"DAY",
            tp:"0",
            tt:"S",
            ig: reqQuery.customMessage,
            es:ExchangeSegment.NSE,
            pc:ProductCode.CashAndCarry,
            pf:PosSqrFlg.N,
        }
        if(!this.validateOrder(data)){
            throw new VError("Request is not properly enriched");
        }
        return data;
      }

      private async alreadyInPortfolio(stockId:any):Promise<Boolean>{
        if(!stockId){return true;}
        let portfolio:PortfolioResp[] = await this.portfolioService.getPortfolio(this.creds);
        for(const x of portfolio){
            if(x.exchangeIdentifier == stockId){return true;}
        }
        return false;
      }

    public placeOrder = async (request: Request, response: Response): Promise<void> => {
        try {
            let stockId = request.query.stockId;
            let present = await this.alreadyInPortfolio(stockId);
            if(present && (!request.query.admin)){
                response.status(400).send(`Either stock Id not passed or already bought stock ${JSON.stringify(request.query)}`);
                return;
            }

            let jData:JData;
            try{
                jData = this.prepareMktBuyJData(request.query);
            }
            catch(err){
                response.status(400).send(`invalid request ${JSON.stringify(request.query)}`);
                return;
            }
            let res: Object = await this.orderService.placeOrder(jData);
            response.status(200).send(res);
        } catch (err) {
            const error: VError = new VError(`ERR in Order Controller route ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    };

    public placeOrderFunctional = async (stockId:number,query:any): Promise<void> => {
            console.log(`Trying to place order for ${JSON.stringify(query)}`);
            try{
                let present = await this.alreadyInPortfolio(stockId);
                if(present){
                    console.log(`Stock already in portfolio ${stockId}`);
                    return;
                }
            }
            catch(err){
                console.log(`portfolio api down couldn't verify stock in portfolio ${(err as any)?.message}`);
            }
            
            let jData:JData = this.prepareMktBuyJData(query);
            await this.orderService.placeOrder(jData);
            await this.updateDbService.updateDWHSingleEntry(stockId);
    };

    public sellOrder = async (request: Request, response: Response): Promise<void> => {
        try {
            this.creds = await this.loginService.login();

            let portfolio:PortfolioResp[] = await this.portfolioService.getPortfolio(this.creds);
            let stockIds:number[] = [];
            for(let x of portfolio){
                stockIds.push(parseInt(x.exchangeIdentifier));
            }


            let stockNamesIdMap = await this.orderService.fetchStockSymbolFromStockIds(stockIds);
            let count = 0;
            for(let x of portfolio){
                let query  = {
                    dq: x.quantity,
                    quantity: x.quantity,
                    stock: stockNamesIdMap[parseInt(x.exchangeIdentifier)],
                    price: this.calculatePrice(x.averagePrice),
                    customMessage: `Sell Order for ->${x.symbol}`
                }
                if(!query.stock){continue;}
                let jData:JData = this.prepareLimitSellJData(query);
                try{
                    await this.orderService.placeOrder(jData);
                }
                catch(err){
                    count = count+1;
                    console.log(`Error in placing sell Order for ${x.symbol}`)
                }
            }

            response.status(200).send(`successfully completed sell order placing fail for ${count} stocks`);
        } catch (err) {
            const error: VError = new VError(`ERR in Sell Controller route ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    };

}

