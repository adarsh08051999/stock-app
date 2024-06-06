import VError from 'verror';
import { OAuth2Response,ValidateResponse } from '../models/login';
import {ApiCredentials} from '../models/common'
import constants from '../constants/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { jwtDecode } from "jwt-decode";
import qs from "qs";
import { EmailService } from './email';

class LoginService {
    static accessToken: string|null;
    static token:string|null;
    static sid:string|null;
    static userId:string|undefined|null;
    static hsServerId: string|undefined|null;

    protected emailService:EmailService;
    constructor() {
        this.emailService = new EmailService();
    }

    public deleteCreds = async (): Promise<void> => {
        LoginService.accessToken = null;
        LoginService.token = null;
        LoginService.sid = null;
        LoginService.userId = null;
        LoginService.hsServerId = null;
    }


    public login = async (): Promise<ApiCredentials> => {
        let accessToken:string|null = LoginService.accessToken;
        let token:string|null = LoginService.token;
        let sid:string|null = LoginService.sid;
        let userId:string|null|undefined = LoginService.userId;
        let hsServerId:string|null|undefined = LoginService.hsServerId;

        if(accessToken && token && sid && userId && hsServerId){
            return {token,sid, accessToken, userId, hsServerId};
        }
        try{
            let responseFromConsumerKeyForAccessToken: OAuth2Response = await this.OAuthUsingConsumerData();
            LoginService.accessToken = "Bearer " + responseFromConsumerKeyForAccessToken.access_token;

            let responseFromValidateReq: ValidateResponse = await this.generateTokenUsingPassword();
            let tempToken = responseFromValidateReq.token;
            let tempSid = responseFromValidateReq.sid;
            LoginService.userId = jwtDecode(tempToken)?.sub;

            console.log("Requesting OTP Generation...");
            let isOtpGenerated:Boolean = false;
            try{
                isOtpGenerated = await this.generateOtpOnEmail();
            }
            catch(err){
                console.log(`OTP generate API threw error`);
            }
            console.log("OTP Generation req made finished...");
            await new Promise(resolve => setTimeout(resolve, 8000)); // pause of 5 sec for OTP recieve -
            let otp = await this.emailService.getOtpFromEmail();
            console.log(`OTP IS ${otp}`);
            let responseFromValidateReqUsingOtp: ValidateResponse = await this.generateTokenUsingOtpAndEnableOrder(otp,tempToken,tempSid);
            LoginService.token = responseFromValidateReqUsingOtp.token;
            LoginService.sid = responseFromValidateReqUsingOtp.sid;
            LoginService.hsServerId = responseFromValidateReqUsingOtp.hsServerId; 
            return {token: LoginService.token,sid: LoginService.sid, accessToken: LoginService.accessToken, userId: LoginService.userId , hsServerId: LoginService.hsServerId};
        }
        catch(err){
            console.log(`DANGER IF TOO MANY REPEATAION AS IT IS IN RECURSION LOOP`);
            console.log(`Login Service Error - ${(err as any)?.message}`);
            return this.login();
        }
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
                'Authorization': LoginService.accessToken
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
                "userId": LoginService.userId,
                "sendEmail": true,
                "isWhitelisted": true
            },
            headers: {
                'content-type': 'application/json',
                'Authorization': LoginService.accessToken
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
                "userId": LoginService.userId,
                "otp": otp,
            },
            headers: {
                'accept': '*/*',
                'Content-type': 'application/json',
                'sid': sid,
                'Auth': token,
                'Authorization': LoginService.accessToken
            },
        };

        const res: AxiosResponse = await axios(reqConfig);
        if (res.status === 201) {
            return res.data.data;
        }
        throw(new VError(`Failed to get Access token ${res.status}`));
    }

}
const loginServiceObj = new LoginService();
export default loginServiceObj;
// use LLD to have a HAS A Relation with User service -- 