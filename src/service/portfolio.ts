import VError from 'verror';
import constants from '../constants/common'
import { ApiCredentials, PortfolioResp } from '../models/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
const FileSystem = require("fs");
const fileName = 'files/portfolio.json';
export class PortfolioService {

  constructor() {
  }

  public getPortfolio = async (creds:ApiCredentials): Promise<PortfolioResp[]> => {
    let spaceName = (process.env.APP_ENV === 'prod') ? constants.USERS_CREDS.VINAY.NAME : constants.USERS_CREDS.ADARSH.NAME;
    const reqConfig: AxiosRequestConfig = {
        method: 'get',
        url: constants.KOTAK_LOGIN_URLS.PortFolioUrl,
        headers: {
            'sid': creds.sid,
            'Auth': creds.token,
            'Authorization': creds.accessToken,
        },
    };
    try{
      const res: AxiosResponse = await axios(reqConfig);
      if (res.status === 200) {
          // save data in a file with date and username ---

          const dataToSave = {data: res.data.data, date: new Date().toISOString().split('T')[0],user: spaceName };

          await FileSystem.writeFile(fileName, JSON.stringify(dataToSave), (error: any) => {
              if (error) {console.log(error);};
          });

          return (res.data.data as PortfolioResp[]);
      }
      throw(new VError(`Failed to get Portfolio- non200 from portfolio api ${JSON.stringify(res)}`));
    }
    catch(err){
      console.log((err as any).message);
      // check if present in file(max 1 day old)
      const rawDataFromFile = JSON.parse(FileSystem.readFileSync(fileName));
      var yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      if(rawDataFromFile.user === spaceName && rawDataFromFile.date && (rawDataFromFile.date ==  new Date().toISOString().split('T')[0] || rawDataFromFile.date == yesterdayDate.toISOString().split('T')[0])){
        console.log("Loading old data for Portfolio - " + JSON.stringify(rawDataFromFile));
        return rawDataFromFile.data;
      }
      throw(err);
    }

    
  };
}