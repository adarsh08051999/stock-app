export interface ApiCredentials {
  token: string;
  sid: string;
  accessToken: string;
  userId?: string;
  hsServerId?: string;
}
export interface StockDetails {
  stockName: string;
  stockSymbol: string;
  budget: number;
  currentChange?: number;
  stockId: number;
}

export interface StockDetailsExtended {
  stockName: string;
  stockSymbol: string;
  budget: number;
  currentChange?: number;
  stockId: number;
  currentPrice?: number;
  oldPrice?: number;
}

export interface FindStockResponse {
  stocks: StockDetailsExtended[];
  total_stock_dwh?: number;
  kotak_stock_data?: number;
  old_stock_data?: number;
}

export interface StockShortData {
  stockName: string;
  stockSymbol: string;
  stockId: number;
}

export interface TwoStockDetails {
  firstStock: StockDetailsExtended;
  secondStock: StockDetailsExtended;
  total_stock_dwh?: number;
  kotak_stock_data?: number;
  old_stock_data?: number;
  extras?: any;
}

export interface PortfolioResp {
  displaySymbol: string;
  averagePrice: number;
  quantity: number;
  exchangeSegment: string;
  exchangeIdentifier: string;
  holdingCost: number;
  mktValue: number;
  scripId: string;
  instrumentToken: number;
  instrumentType: string;
  isAlternateScrip: boolean;
  closingPrice: number;
  symbol: string;
}

export interface MarketData {
  ftm0?: string;
  dtm1?: string;
  ltq?: string;
  lo?: string;
  h?: string;
  lcl?: string;
  ucl?: string;
  yh?: string;
  yl?: string;
  op?: string;
  c?: string;
  mul?: string;
  prec?: string;
  cng?: string;
  nc?: string;
  name?: string;
  tk?: string;
  e?: string;
  ltp: string;
  ts: string;
}

export interface IndexData {
  ftm0?: string;
  dtm1?: string;
  highPrice?: string;
  lowPrice?: string;
  openingPrice?: string;
  mul?: string;
  prec?: string;
  cng?: string;
  nc?: string;
  name?: string;
  e?: string;

  iv?: string;
  ic?: string;
  tk: string;
}
export interface NiftyData {
  stockSymbol: string;
  highPrice?: string;
  lowPrice: number;
  openingPrice?: number;
  mul?: number;
  prec?: number;
  stockExchange?: string;
  topicName?: string;
  ic: number;
  iv: number;
}
