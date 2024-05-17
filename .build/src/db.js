"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Db = void 0;
const ormconfig_1 = __importDefault(require("../ormconfig"));
const typeorm_1 = require("typeorm");
class Db {
    constructor() {
        this.Ready = new Promise((resolve, reject) => {
            (0, typeorm_1.createConnection)(ormconfig_1.default)
                .then(conn => {
                console.log('Connected to postgres database');
                this.conn = conn;
                resolve();
            })
                .catch(err => {
                console.log(`Configuration set for postgres DB are ${JSON.stringify(ormconfig_1.default)}`);
                console.log(`!!!!Failed to connect to postgres database ${err}`);
                reject(err);
            });
        });
    }
    getManager() {
        return this.conn.manager;
    }
}
exports.Db = Db;
const db = new Db();
exports.default = db;
