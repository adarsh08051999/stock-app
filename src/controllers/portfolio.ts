import { Request, Response } from 'express';
import VError from 'verror';
import { ApiCredentials, PortfolioResp } from '../models/common';
import loginServiceObj from '../service/login';
import { PortfolioService } from '../service/portfolio';

export class PortfolioController {
    protected portfolioService: PortfolioService;
    public creds: ApiCredentials;

    constructor() {
        this.portfolioService = new PortfolioService();
    }

    public getPortfolio = async (request: Request, response: Response): Promise<void> => {
        try {
            this.creds = await loginServiceObj.login();
            let res: PortfolioResp[] = await this.portfolioService.getPortfolio(this.creds);
            response.status(200).send(res);
        } catch (err) {
            const error: VError = new VError(`ERR in Portfolio Controller route ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    };
}