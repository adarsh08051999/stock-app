"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
let StockData = class StockData extends typeorm_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)()
], StockData.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
    })
], StockData.prototype, "stockName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
    })
], StockData.prototype, "stockSymbol", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({
        type: "int",
    })
], StockData.prototype, "stockId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: "boolean",
        default: "true",
    })
], StockData.prototype, "toBuy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "int",
        default: "0",
    })
], StockData.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "int",
        default: "0"
    })
], StockData.prototype, "netLifetimeEarnings", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: "boolean",
        default: "false",
    })
], StockData.prototype, "isRemoved", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)()
], StockData.prototype, "updatedAt", void 0);
StockData = __decorate([
    (0, typeorm_1.Entity)()
], StockData);
exports.default = StockData;
