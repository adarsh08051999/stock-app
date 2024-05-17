import { Request, Response } from 'express';
import VError from 'verror';
import { TwoStockDetails } from '../models/common';
import { FindStockService } from '../service/findStock';

export class FindStockController {
    private findStockService: FindStockService;

    constructor() {
        this.findStockService = new FindStockService();
    }

    public findStockAndBudget = async (request: Request, response: Response): Promise<void> => {
        try{
            let type:boolean = request.query.filter ? true : false;
            let all:boolean = request.query.all ? true : false;
            let days:number = request.query.days ? parseInt(request.query.days as string) : 7;
            let res:TwoStockDetails = await this.findStockService.findStockAndBudget(type,days,all);
            response.status(200).send(JSON.stringify(res));
        }
        catch(err){
            const error: VError = new VError(`ERR in Finding Stock Service ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    }
    public getDates = async (request: Request, response: Response): Promise<void> => {
        try{
            let res:any = await this.findStockService.getDates();
            response.status(200).send(JSON.stringify(res));
        }
        catch(err){
            const error: VError = new VError(`ERR in Finding Dates ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    }
    
}
