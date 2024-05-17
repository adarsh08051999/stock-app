import VError from 'verror';
import { OAuth2Response,ValidateResponse } from '../models/login';
import {ApiCredentials} from '../models/common'
import constants from '../constants/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { jwtDecode } from "jwt-decode";
import qs from "qs";
import { EmailService } from './email';
const FileSystem = require("fs");

export class LoginService {
    private accessToken: string;
    private token:string;
    private sid:string;
    private userId:string|undefined;
    private hsServerId: string|undefined;

    protected emailService:EmailService;
    constructor() {
        this.emailService = new EmailService();
    }
    private getFileName(){
        return `files/creds.json`;
    }

    public deleteCreds = async (): Promise<void> => {
        const fileName:string = this.getFileName();
        const rawDataFromFile = JSON.parse(FileSystem.readFileSync(fileName));
        rawDataFromFile.date = '2024-02-01'; // any old date
        await FileSystem.writeFile(fileName, JSON.stringify(rawDataFromFile), (error: any) => {
            if (error) throw error;
        });
    }


    public login = async (): Promise<ApiCredentials> => {
        const fileName:string = this.getFileName();
        let spaceName = (process.env.APP_ENV === 'prod') ? constants.USERS_CREDS.VINAY.NAME : constants.USERS_CREDS.ADARSH.NAME;

        try{
            const rawDataFromFile = JSON.parse(FileSystem.readFileSync(fileName));
            if(rawDataFromFile.date && rawDataFromFile.date === new Date().toISOString().split('T')[0] && rawDataFromFile.user === spaceName){
                delete rawDataFromFile['date'];
                delete rawDataFromFile['user'];
                return (rawDataFromFile as ApiCredentials);
            }
        }
        catch(err){
            console.log(`file doesn't exist for ${fileName} continuing the flow`)
        }

        let responseFromConsumerKeyForAccessToken: OAuth2Response = await this.OAuthUsingConsumerData();
        this.accessToken = "Bearer " + responseFromConsumerKeyForAccessToken.access_token;

        let responseFromValidateReq: ValidateResponse = await this.generateTokenUsingPassword();
        let tempToken = responseFromValidateReq.token;
        let tempSid = responseFromValidateReq.sid;
        this.userId = jwtDecode(tempToken)?.sub;
        let isOtpGenerated:Boolean = false;
        isOtpGenerated = await this.generateOtpOnEmail();
        console.log("Generated OTP");
        await new Promise(resolve => setTimeout(resolve, 5000)); // pause of 5 sec for OTP recieve -
        let otp = await this.emailService.getOtpFromEmail();
        console.log(`OTP IS ${otp}`);
        let responseFromValidateReqUsingOtp: ValidateResponse = await this.generateTokenUsingOtpAndEnableOrder(otp,tempToken,tempSid);
        this.token = responseFromValidateReqUsingOtp.token;
        this.sid = responseFromValidateReqUsingOtp.sid;
        this.hsServerId = responseFromValidateReqUsingOtp.hsServerId;
        const loginCreds: ApiCredentials = {token: this.token,sid: this.sid, accessToken: this.accessToken, userId: this.userId , hsServerId: this.hsServerId};

        const dataToSave = {...loginCreds, date: new Date().toISOString().split('T')[0],user: spaceName };

        await FileSystem.writeFile(fileName, JSON.stringify(dataToSave), (error: any) => {
            if (error) throw error;
        });

        return loginCreds;
    }

    private OAuthUsingConsumerData = async (): Promise<OAuth2Response> => {
        let credSpace = (process.env.APP_ENV === 'prod') ? constants.USERS_CREDS.VINAY : constants.USERS_CREDS.ADARSH;
        const reqConfig: AxiosRequestConfig = {
            method: 'post',
            url: constants.KOTAK_LOGIN_URLS.OAuth2Url,
            data: qs.stringify({
                'grant_type': 'client_credentials'
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': credSpace.LOGIN.AuthorizationHeader
            },
        };

        const res: AxiosResponse = await axios(reqConfig);
        if (res.status === 200) {
            return res.data;
        }
        throw(new VError(`Failed to get Access token ${res.status}`));
    }

    private generateTokenUsingPassword = async (): Promise<ValidateResponse> => {
        let credSpace = (process.env.APP_ENV === 'prod') ? constants.USERS_CREDS.VINAY : constants.USERS_CREDS.ADARSH;

        const reqConfig: AxiosRequestConfig = {
            method: 'post',
            url: constants.KOTAK_LOGIN_URLS.ValidateUrl,
            data: {
                "mobileNumber": credSpace.LOGIN.MobileNo,
                "password": credSpace.LOGIN.Password,
            },
            headers: {
                'content-type': 'application/json',
                'Authorization': this.accessToken
            },
        };
        let res;
        try{
            res = await axios(reqConfig);
        }
        catch(err){
            console.log((err as any)?.message);
            throw(new VError(`Axios failed for generateTokenUsingPassword`));
        }
        
        if (res?.status === 201) {
            return res.data.data;
        }
        throw(new VError(`Failed to get Access token ${res?.status}`));
    }

    private generateOtpOnEmail = async (): Promise<Boolean> => {

        const reqConfig: AxiosRequestConfig = {
            method: 'post',
            url: constants.KOTAK_LOGIN_URLS.GenerateOtpUrl,
            data: {
                "userId": this.userId,
                "sendEmail": true,
                "isWhitelisted": true
            },
            headers: {
                'content-type': 'application/json',
                'Authorization': this.accessToken
            },
        };

        const res: AxiosResponse = await axios(reqConfig);
        if (res.status === 201) {
            return true
        }
        return false;
    }

    private generateTokenUsingOtpAndEnableOrder = async (otp: string, token:string, sid:string): Promise<ValidateResponse> => {
        const reqConfig: AxiosRequestConfig = {
            method: 'post',
            url: constants.KOTAK_LOGIN_URLS.ValidateUrl,
            data: {
                "userId": this.userId,
                "otp": otp,
            },
            headers: {
                'accept': '*/*',
                'Content-type': 'application/json',
                'sid': sid,
                'Auth': token,
                'Authorization': this.accessToken
            },
        };

        const res: AxiosResponse = await axios(reqConfig);
        if (res.status === 201) {
            return res.data.data;
        }
        throw(new VError(`Failed to get Access token ${res.status}`));
    }

}
