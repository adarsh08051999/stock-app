import { EntityManager } from 'typeorm';
import db from '../db';
import StockData from '../models/stockData';
import { StockDetails, StockShortData } from '../models/common';
import StockOldData from '../models/stockOldData';

export class DBQuery {
    protected entityManager!: EntityManager;

    public getEligibleStockToBuy(): Promise<StockDetails[]> {
        return new Promise<StockDetails[]>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                    let temp = await db
                        .getManager()
                        .createQueryBuilder()
                        .select('StockData')
                        .from(StockData, 'StockData')
                        .where('StockData.isRemoved = false')
                        .andWhere('StockData.toBuy = true')
                        .getMany();

                    let result: StockDetails[] = [];

                    temp.forEach(entry => { 
                        let z:StockDetails = {stockName: entry.stockName , stockSymbol: entry.stockSymbol , budget: entry.budget, stockId: entry.stockId};
                        result.push(z);
                    })
                    resolve(result);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
    public getAllDates(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                    let res =  await db
                     .getManager()
                     .createQueryBuilder()
                     .select('StockOldData.date')
                     .distinct(true)
                     .from(StockOldData, 'StockOldData')
                     .getRawMany();
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }


    public fetchStockSymbolFromStockIds(stockIds: number[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                    let temp = await db
                        .getManager()
                        .createQueryBuilder()
                        .select('StockData')
                        .from(StockData, 'StockData')
                        .where('StockData.stockId IN (:...ids)', { ids: stockIds })
                        .getMany();

                    let result:any = {};
                    temp.forEach(entry => { 
                        result[entry.stockId] = entry.stockSymbol;
                    })
                    resolve(result);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
    

    public updateBoughtStock(stockIds: string[]): Promise<void>{
        return new Promise<void>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                    await db
                        .getManager()
                        .createQueryBuilder()
                        .from(StockData, 'StockData')
                        .update('StockData')
                        .set({ toBuy: false })
                        .where('stockId IN (:...ids)', { ids: stockIds })
                        .execute();

                        resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public resetSoldStock(stockIds: string[]): Promise<any>{
        return new Promise<any>((resolve, reject) => {
            let a = new Date();
            let days = 4;
            a.setDate(a.getDate() - days);

            this.connectDb()
                .then(async () => {
                    let res = await db
                        .getManager()
                        .createQueryBuilder()
                        .from(StockData, 'StockData')
                        .update('StockData')
                        .set({ toBuy: true })
                        .where('toBuy = false')
                        .andWhere('stockId NOT IN (:...ids)', { ids: stockIds })
                        .andWhere('updatedAt <= :a', { a })
                        .execute();

                        resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    
    public getAllDWH(): Promise<StockData[]> {
        return new Promise<StockData[]>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                    let temp:StockData[] = await db
                        .getManager()
                        .createQueryBuilder()
                        .select('StockData')
                        .from(StockData, 'StockData')
                        .getMany();

                    resolve(temp);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public getAll(): Promise<StockShortData[]> {
        return new Promise<StockShortData[]>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                    let temp = await db
                        .getManager()
                        .createQueryBuilder()
                        .select('StockData')
                        .from(StockData, 'StockData')
                        .getMany();

                    let result: StockShortData[] = [];

                    temp.forEach(entry => { 
                        let z:StockShortData = {stockName: entry.stockName , stockSymbol: entry.stockSymbol , stockId: entry.stockId};
                        result.push(z);
                    })
                    resolve(result);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public updateDwh(stockId:number ,budgetVal:number, isRemovedVal: boolean): Promise<void>{
        return new Promise<void>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                    await db
                        .getManager()
                        .createQueryBuilder()
                        .from(StockData, 'StockData')
                        .update('StockData')
                        .set({ budget: budgetVal, isRemoved: isRemovedVal })
                        .where('stockId IN (:...ids)', { ids: [stockId] })
                        .execute();
                        
                        resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }


    public deleteOldData(): Promise<number> {
        return new Promise<number>((resolve, reject) => {

            let a = new Date();
            let days = 14;
            a.setDate(a.getDate() - days);

            this.connectDb()
                .then(async () => {
                    let r = await this.entityManager
                        .createQueryBuilder()
                        .delete()
                        .from(StockOldData)
                        .where('updatedAt <= :a', { a })
                        .execute();

                    let count = (r?.affected)? r.affected : 0;
                    resolve(count);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    
    public fetchOldData(date:string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                     let temp = await db
                        .getManager()
                        .createQueryBuilder()
                        .select('StockOldData')
                        .from(StockOldData, 'StockOldData')
                        .where(`StockOldData.date = '${date}'`)
                        .getMany();
                        
                    resolve(temp?.length);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    
    public deleteStockDWH(ID:number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                     await db
                        .getManager()
                        .createQueryBuilder()
                        .delete()
                        .from(StockData)
                        .where('id = :ID',{ID})
                        .execute();
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public insertStockDWH(stockData: StockDetails[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.connectDb()
                .then(async () => {
                     await db
                        .getManager()
                        .createQueryBuilder()
                        .insert()
                        .into(StockData)
                        .values(stockData)
                        .execute();

                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public insertOldDataOfStock(stockData: StockOldData[]|any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            
            this.connectDb()
                .then(async () => {
                     await db
                        .getManager()
                        .createQueryBuilder()
                        .insert()
                        .into(StockOldData)
                        .values(stockData)
                        .execute();

                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public getPrevNifty(stockSymbol: string): Promise<StockOldData|undefined> {
        return new Promise<StockOldData|undefined>((resolve, reject) => {
 
            this.connectDb()
                .then(async () => {
                    let res =  await db
                     .getManager()
                     .createQueryBuilder()
                     .select('StockOldData')
                     .from(StockOldData, 'StockOldData')
                     .where(`StockOldData.stockSymbol = '${stockSymbol}'`)
                     .getOne();

                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public getAllOldData(oldDays:number): Promise<StockOldData[]> {
        return new Promise<StockOldData[]>((resolve, reject) => {
            let d = new Date();
            let currentOffset = d.getTimezoneOffset();
            let ISTOffset = 330;
            d = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);
            
            d.setDate(d.getDate() - oldDays);
            if(d.getDay() == 0){
                d.setDate(d.getDate() - 2);
            }
            else if(d.getDay() == 6){
                d.setDate(d.getDate() - 1);
            }

            this.connectDb()
                .then(async () => {
                    let res =  await db
                     .getManager()
                     .createQueryBuilder()
                     .select('StockOldData')
                     .from(StockOldData, 'StockOldData')
                     .where(`StockOldData.date = '${d.toISOString().split('T')[0]}'`)
                     .getMany();

                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    protected connectDb = async (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            if (this.entityManager !== undefined && this.entityManager.connection.isConnected) {
                resolve();
                return;
            }
            db.Ready.then(() => {
                this.entityManager = db.getManager();
                resolve();
            }).catch(err => {
                console.log(`While Getting entity manager: ${err.message}`)
                reject(err);
            });
        });
    };

}
