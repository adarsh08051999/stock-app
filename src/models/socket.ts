export const BinRespTypes = {
  CONNECTION_TYPE: 1,
  THROTTLING_TYPE: 2,
  ACK_TYPE: 3,
  SUBSCRIBE_TYPE: 4,
  UNSUBSCRIBE_TYPE: 5,
  DATA_TYPE: 6,
  CHPAUSE_TYPE: 7,
  CHRESUME_TYPE: 8,
  SNAPSHOT: 9,
  OPC_SUBSCRIBE: 10,
};

export const  BinRespStat = { OK: "K", NOT_OK: "N" };

export const  STAT = { OK: "Ok", NOT_OK: "NotOk" };

export const  RespTypeValues = {
  CONN: "cn",
  SUBS: "sub",
  UNSUBS: "unsub",
  SNAP: "snap",
  CHANNELR: "cr",
  CHANNELP: "cp",
  OPC: "opc",
};

export const  RespCodes = {
  SUCCESS: 200,
  CONNECTION_FAILED: 11001,
  CONNECTION_INVALID: 11002,
  SUBSCRIPTION_FAILED: 11011,
  UNSUBSCRIPTION_FAILED: 11012,
  SNAPSHOT_FAILED: 11013,
  CHANNELP_FAILED: 11031,
  CHANNELR_FAILED: 11032,
};


export const  ResponseTypes = { SNAP: 83, UPDATE: 85 };