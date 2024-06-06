import { Request, Response } from 'express';
import VError from 'verror';
import { ApiCredentials, PortfolioResp } from '../models/common';
import { JData,AMO,ExchangeSegment, ProductCode, PosSqrFlg, OrderType,OrderSource } from '../models/order';
import loginServiceObj from '../service/login';
import { OrderService } from '../service/order';
import { PortfolioService } from '../service/portfolio';
import { UpdateDbService } from '../service/updateDb';

export class OrderController {
    protected orderService: OrderService;
    protected portfolioService: PortfolioService;
    protected updateDbService: UpdateDbService;
    public creds: ApiCredentials;

    constructor() {
        this.orderService = new OrderService();
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
            await this.orderService.sellOrder();
            response.status(200).send(`successfully completed sell order placing`);
        } catch (err) {
            const error: VError = new VError(`ERR in Sell Controller route ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    };

}

