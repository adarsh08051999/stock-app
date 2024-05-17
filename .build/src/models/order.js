"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderType = exports.PosSqrFlg = exports.ProductCode = exports.OrderSource = exports.ExchangeSegment = exports.AMO = void 0;
var AMO;
(function (AMO) {
    AMO["YES"] = "YES";
    AMO["NO"] = "NO";
})(AMO = exports.AMO || (exports.AMO = {}));
var ExchangeSegment;
(function (ExchangeSegment) {
    ExchangeSegment["NSE"] = "nse_cm";
    ExchangeSegment["BSE"] = "bse_cm";
    ExchangeSegment["NFO"] = "nse_fo";
    ExchangeSegment["BFO"] = "bse_fo";
    ExchangeSegment["CDS"] = "cde_fo";
    ExchangeSegment["BCD"] = "bcs_fo";
})(ExchangeSegment = exports.ExchangeSegment || (exports.ExchangeSegment = {}));
var OrderSource;
(function (OrderSource) {
    OrderSource["MOB"] = "MOB";
    OrderSource["WEB"] = "WEB";
})(OrderSource = exports.OrderSource || (exports.OrderSource = {}));
var ProductCode;
(function (ProductCode) {
    ProductCode["Normal"] = "NRML";
    ProductCode["CashAndCarry"] = "CNC";
    ProductCode["MIS"] = "MIS";
    ProductCode["CoverOrder"] = "CO";
})(ProductCode = exports.ProductCode || (exports.ProductCode = {}));
var PosSqrFlg;
(function (PosSqrFlg) {
    PosSqrFlg["N"] = "N";
})(PosSqrFlg = exports.PosSqrFlg || (exports.PosSqrFlg = {}));
var OrderType;
(function (OrderType) {
    OrderType["Limit"] = "L";
    OrderType["Market"] = "MKT";
    OrderType["StopLossLimit"] = "SL";
    OrderType["StopLossMarket"] = "SL-M";
    OrderType["Spread"] = "SP";
    OrderType["TwoLeg"] = "2L";
    OrderType["ThreeLeg"] = "3L";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
