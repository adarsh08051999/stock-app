import { Request, Response } from 'express';
import VError from 'verror';
import { EmailService } from '../service/email';

export class EmailController {
    protected emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public getOtpFromEmail = async (request: Request, response: Response): Promise<void> => {
        try {
            let res: string = await this.emailService.getOtpFromEmail();
            response.status(200).send(res);
        } catch (err) {
            const error: VError = new VError(`ERR in Email Service route ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    };
}
