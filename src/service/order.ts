import VError from "verror";
import constants from "../constants/common";
import { ApiCredentials } from "../models/common";
import { OrderDetails, JData } from "../models/order";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { DBQuery } from "./dbQuery";
import { LoginService } from "./login";
var qs = require("qs");

export class OrderService extends DBQuery {
  protected loginService: LoginService;
  public lastDeleted: any;
  constructor() {
    super();
    this.loginService = new LoginService();
  }

  public placeOrder = async (jData: JData): Promise<Object> => {

    let curr_date:any = new Date();
    if(!this.lastDeleted || (Math.abs(curr_date - this.lastDeleted)/60000) > 30){
      await this.loginService.deleteCreds();
      this.lastDeleted = curr_date;
      await new Promise(resolve => setTimeout(resolve, 2000));
    };
    
    let creds: ApiCredentials = await this.loginService.login();

    const reqConfig: AxiosRequestConfig = {
      method: "post",
      url: constants.KOTAK_LOGIN_URLS.OrderUrl,
      data: qs.stringify({
        jData: JSON.stringify(jData),
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "neo-fin-key": "neotradeapi",
        accept: "application/json",
        Sid: creds.sid,
        Auth: creds.token,
        Authorization: creds.accessToken,
      },
    };

    const res: AxiosResponse = await axios(reqConfig);
    console.log("Response from placeOrder API" + res);
    if (res.status === 200 && res.statusText == "OK") {
      if (jData.tt == "S" && res.data.stat != "Ok") {
      } else {
        return res.data;
      }
    }
    console.log(`Received non 2xx|not-Ok from order placing api ${res.status}`);
    throw new VError(`non 2xx|not-Ok from order placing api ${res.status}`);
  };
}
