export interface OrderDetails {
    quantity:number,
    stockTs: string,
}
export enum AMO {
    YES = "YES",NO = "NO"
}

export enum ExchangeSegment {
    NSE = "nse_cm", BSE = "bse_cm" , NFO = "nse_fo", BFO = "bse_fo" , CDS = "cde_fo", BCD = "bcs_fo" 
}

export enum OrderSource {
    MOB = "MOB", WEB = "WEB"
}

export enum ProductCode{
    Normal = "NRML", CashAndCarry = "CNC", MIS = "MIS", CoverOrder = "CO"
}

export enum PosSqrFlg{
    N = "N"
}

export enum OrderType{
    Limit = "L", Market ="MKT" , StopLossLimit = "SL", StopLossMarket = "SL-M", Spread = "SP", TwoLeg = "2L",ThreeLeg = "3L"
}

export interface JData {
    am?:AMO,
    es:ExchangeSegment,
    os:OrderSource,
    pc:ProductCode,
    pf:PosSqrFlg,
    pt:OrderType,
    dq?:string, //disclosed quantity- 
    qt:string, // quantity
    mp:string, //Market Protection?
    pr:string, //price
    rt:string, //Order Duration
    tp:string, //Trigger price
    ts:string, // Trading Symbol
    tt:string, //Transaction Type
    ig:string, // Remarks Field. It will return under "GUIOrdId" in Order Book
}