import VError from 'verror';
import constants from '../constants/common'
var axios = require("axios");
var qs = require("qs");

export class EmailService {
  private accessToken:string;

  constructor() {
  }

  private getAccessToken = async (): Promise<void> => {
    let credSpace = (process.env.APP_ENV === 'prod') ? constants.USERS_CREDS.VINAY : constants.USERS_CREDS.ADARSH;
    var data = qs.stringify({
      client_id: credSpace.EMAIL.ClientID,
      client_secret: credSpace.EMAIL.ClientSecret,
      refresh_token: credSpace.EMAIL.RefreshToken,
      grant_type: "refresh_token",
    });

    var config = {
      method: "post",
      url: constants.EMAIL_URLS.AccessTokenURL,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    };

    try{
        let res = await axios(config);
        this.accessToken = res.data.access_token;
    }
    catch(err){
        throw(err);
    }
  };

  private searchEmail = async (): Promise<string> => {
    let config = {
      method: "get",
      url:
        constants.EMAIL_URLS.SearchFromEmailURL + constants.EMAIL_URLS.EmailToSearch,
      headers: {
        Authorization: `Bearer ${this.accessToken} `,
      },
    };
    var threadId = "";
    try{
        let res = await axios(config);
        threadId = await res.data["messages"][0].id;
    }
    catch(err){
        throw(err);
    }
    return threadId;
  };

  private returnSnippet = async (threadId:string): Promise<string> => {
    var config = {
      method: "get",
      url: constants.EMAIL_URLS.SearchForThread +`${threadId}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    };

    let snippet:string;

    try{
        let res = await axios(config);
        snippet = await res.data.snippet;
    }
    catch(err){
        throw(err);
    }

    return snippet;
  };

  private extractOtpFromHeading(heading:string):string {
    let regex = /\b\d{4}\b/g;
    let matches:string[]|null = heading.match(regex);
    if(matches){
        return matches[0];
    }
    throw new VError(`No matching OTP in heading ${heading}`);
  };

  public async getOtpFromEmail():Promise<string>{
    await this.getAccessToken();
    const threadId = await this.searchEmail();
    const headingSnippet = await this.returnSnippet(threadId);
    const otp:string = this.extractOtpFromHeading(headingSnippet);
    return otp;
  };
}