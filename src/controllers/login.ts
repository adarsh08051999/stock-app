import { Request, Response } from 'express';
import VError from 'verror';
import { ApiCredentials } from '../models/common';
import loginServiceObj from '../service/login';


export class LoginController {

    constructor() {
    }

    public login = async (request: Request, response: Response): Promise<void> => {
        try{
            let res:ApiCredentials = await loginServiceObj.getLoginCreds();
            response.status(200).send(JSON.stringify(res));
        }
        catch(err){
            const error: VError = new VError(`ERR in Login ${(err as any)?.message}`);
            console.error(error.stack);
            response.status(500).send(error);
        }
    }

    public deleteCreds = async (request: Request, response: Response): Promise<void> => {
        try{
            await loginServiceObj.deleteCreds();
            response.status(200).send(JSON.stringify("done successfully"));
        }
        catch(err){
            const error: VError = new VError(`ERR in Cred delete ${(err as any)?.message}`);
            response.status(500).send(error);
        }
    }

}
