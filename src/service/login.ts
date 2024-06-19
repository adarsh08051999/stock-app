import VError from 'verror';
import { OAuth2Response, ValidateResponse } from '../models/login';
import { ApiCredentials } from '../models/common'
import constants from '../constants/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { jwtDecode } from "jwt-decode";
import qs from "qs";
import { EmailService } from './email';

class LoginService {
    static accessToken: string | null;
    static token: string | null;
    static sid: string | null;
    static userId: string | undefined | null;
    static hsServerId: string | undefined | null;

    protected emailService: EmailService;
    constructor() {
        this.emailService = new EmailService();
    }

    public generateNewCreds = async (count: number): Promise<void> => {
        if (count === 0) { console.log(`Could not refresh credentials`); return; }

        try {
            let responseFromConsumerKeyForAccessToken: OAuth2Response = await this.OAuthUsingConsumerData();
            let newAccessToken: string = "Bearer " + responseFromConsumerKeyForAccessToken.access_token;

            let responseFromValidateReq: ValidateResponse = await this.generateTokenUsingPassword(newAccessToken);
            let tempToken = responseFromValidateReq.token;
            let tempSid = responseFromValidateReq.sid;
            let newUserId = jwtDecode(tempToken)?.sub;

            console.log("Requesting OTP Generation...");
            let isOtpGenerated: Boolean = false;
            try {
                isOtpGenerated = await this.generateOtpOnEmail(newUserId, newAccessToken);
            }
            catch (err) {
                console.log(`OTP generate API threw error`);
            }

            console.log("OTP Generation req made finished...");
            await new Promise(resolve => setTimeout(resolve, 12000)); // pause of 45 sec for OTP recieve -
            let otp = await this.emailService.getOtpFromEmail();
            console.log(`OTP IS ${otp}`);
            let responseFromValidateReqUsingOtp: ValidateResponse = await this.generateTokenUsingOtpAndEnableOrder(otp, tempToken, tempSid, newUserId, newAccessToken);

            LoginService.accessToken = newAccessToken;
            LoginService.userId = newUserId;
            LoginService.token = responseFromValidateReqUsingOtp.token;
            LoginService.sid = responseFromValidateReqUsingOtp.sid;
            LoginService.hsServerId = responseFromValidateReqUsingOtp.hsServerId;

        } catch (err) {
            console.log(`Trying to generate new Credentials again`);
            console.log(`Cred refresh Error - ${(err as any)?.message}`);
            await new Promise(resolve => setTimeout(resolve, 20000));
            await this.generateNewCreds(count - 1);
        }

    }



    public deleteCreds = async (): Promise<void> => {
        await this.generateNewCreds(2);
    }


    public getLoginCreds = async (): Promise<ApiCredentials> => {
        let accessToken: string | null = LoginService.accessToken || '';
        let token: string = LoginService.token || '';
        let sid: string = LoginService.sid || '';
        let userId: string = LoginService.userId || '';
        let hsServerId: string = LoginService.hsServerId || '';

        // if (!(accessToken && token && sid && userId && hsServerId)) {
        //     await this.generateNewCreds(2);
        // }
        return { token, sid, accessToken, userId, hsServerId };
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
        throw (new VError(`Failed to get Access token ${res.status}`));
    }

    private generateTokenUsingPassword = async (access_token: string): Promise<ValidateResponse> => {
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
                'Authorization': access_token
            },
        };
        let res;
        try {
            res = await axios(reqConfig);
        }
        catch (err) {
            console.log((err as any)?.message);
            throw (new VError(`Axios failed for generateTokenUsingPassword`));
        }

        if (res?.status === 201) {
            return res.data.data;
        }
        throw (new VError(`Failed to get Access token ${res?.status}`));
    }

    private generateOtpOnEmail = async (userId: string | undefined, access_token: string): Promise<Boolean> => {

        const reqConfig: AxiosRequestConfig = {
            method: 'post',
            url: constants.KOTAK_LOGIN_URLS.GenerateOtpUrl,
            data: {
                "userId": userId,
                "sendEmail": true,
                "isWhitelisted": true
            },
            headers: {
                'content-type': 'application/json',
                'Authorization': access_token
            },
        };

        const res: AxiosResponse = await axios(reqConfig);
        if (res.status === 201) {
            return true
        }
        return false;
    }

    private generateTokenUsingOtpAndEnableOrder = async (otp: string, token: string, sid: string, userId: string | undefined, accessToken: string): Promise<ValidateResponse> => {
        const reqConfig: AxiosRequestConfig = {
            method: 'post',
            url: constants.KOTAK_LOGIN_URLS.ValidateUrl,
            data: {
                "userId": userId,
                "otp": otp,
            },
            headers: {
                'accept': '*/*',
                'Content-type': 'application/json',
                'sid': sid,
                'Auth': token,
                'Authorization': accessToken
            },
        };

        const res: AxiosResponse = await axios(reqConfig);
        if (res.status === 201) {
            return res.data.data;
        }
        throw (new VError(`Failed to get Access token ${res.status}`));
    }

}
const loginServiceObj = new LoginService();
export default loginServiceObj;
// use LLD to have a HAS A Relation with User service -- 