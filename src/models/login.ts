export interface OAuth2Response {
    access_token: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
}

export interface ValidateResponse {
    token:string,
    sid:string,
    rid?: string,
    hsServerId?: string,
    isUserPwdExpired?: boolean,
    caches?: any,
    ucc?: string,
    greetingName?: string,
    isTrialAccount?: string,
    dataCenter?: string,
    searchAPIKey?: string,
    derivativesRiskDisclosure?: string,
    mfAccess?: number,
    dataCenterMap?: any,
    dormancyStatus?: string
}