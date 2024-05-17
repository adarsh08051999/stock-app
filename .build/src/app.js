"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressSetup = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cls_rtracer_1 = __importDefault(require("cls-rtracer"));
const cors = require("cors");
const uuid_1 = require("uuid");
const routes_1 = require("./routers/routes");
exports.app = (0, express_1.default)();
const expressSetup = () => {
    exports.app.use(cls_rtracer_1.default.expressMiddleware({
        echoHeader: true,
        requestIdFactory: uuid_1.v4,
    }));
    const corsOptions = {
        origin: true,
        methods: ['POST', 'PUT', 'GET', 'DELETE'],
        credentials: true,
        maxAge: 3600,
        optionsSuccessStatus: 200,
    };
    exports.app.use(cors(corsOptions));
    exports.app.use(express_1.default.json());
    exports.app.use('', new routes_1.Router().handle());
};
exports.expressSetup = expressSetup;
