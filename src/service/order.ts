import VError from 'verror';
import constants from '../constants/common'
import { ApiCredentials } from '../models/common';
import { OrderDetails,JData } from '../models/order';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { DBQuery } from './dbQuery';
var qs = require("qs");

export class OrderService extends DBQuery{

  constructor() {
    super();
  }

  public placeOrder = async (creds:ApiCredentials,jData:JData): Promise<Object> => {
    const reqConfig: AxiosRequestConfig = {
        method: 'post',
        url: constants.KOTAK_LOGIN_URLS.OrderUrl,
        data: qs.stringify({
            'jData': JSON.stringify(jData)
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'neo-fin-key': 'neotradeapi',
            'accept': 'application/json',
            'Sid': creds.sid,
            'Auth': creds.token,
            'Authorization': creds.accessToken,
        },
    };

    const res: AxiosResponse = await axios(reqConfig);
    console.log("Response from placeOrder API" + res);
    if (res.status === 200 && res.statusText == 'OK') {
        if(jData.tt == 'S' && res.data.stat != 'Ok'){}
        else{return res.data;}
    }
    console.log(`Received non 2xx|not-Ok from order placing api ${res.status}`);
    throw(new VError(`non 2xx|not-Ok from order placing api ${res.status}`));
    
  };
}