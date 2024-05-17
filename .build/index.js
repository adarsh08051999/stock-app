"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./src/app");
const db_1 = __importDefault(require("./src/db"));
const brain_1 = __importDefault(require("./src/service/brain"));
db_1.default.Ready.then(() => __awaiter(void 0, void 0, void 0, function* () {
    (0, app_1.expressSetup)();
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    const HOST = process.env.HOST ? process.env.HOST : '0.0.0.0';
    app_1.app.listen(PORT, HOST, () => {
        console.log(`Started server on HOST: ${HOST}, at PORT: ${PORT}`);
    });
    brain_1.default.start();
})).catch(err => {
    console.log(`ERR while getting entity manager from db, ${err}`);
});
