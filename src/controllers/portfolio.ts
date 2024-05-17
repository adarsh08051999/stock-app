import { Request, Response } from 'express';
import VError from 'verror';
import { ApiCredentials, PortfolioResp } from '../models/common';
import { LoginService } from '../service/login';
import { PortfolioService } from '../service/portfolio';

export class PortfolioController {
    protected portfolioService: PortfolioService;
    protected loginService: LoginService;
    public creds: ApiCredentials;

    constructor() {
        this.portfolioService = new PortfolioService();
        this.loginService = new LoginService();
    }

    public getPortfolio = async (request: Request, response: Response): Promise<void> => {
        try {
            this.creds = await this.loginService.login();
            let res: PortfolioResp[] = await this.portfolioService.getPortfolio(this.creds);
            response.status(200).send(res);
        } catch (err) {
            const error: VError = new VError(`ERR in Portfolio Controller route ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    };
}