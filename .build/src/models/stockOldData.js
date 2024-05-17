"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
let StockOldData = class StockOldData extends typeorm_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)()
], StockOldData.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
    })
], StockOldData.prototype, "stockName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
    })
], StockOldData.prototype, "stockSymbol", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "int",
    })
], StockOldData.prototype, "stockId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "float",
    })
], StockOldData.prototype, "closePrice", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
    })
], StockOldData.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)()
], StockOldData.prototype, "updatedAt", void 0);
StockOldData = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)(['stockId', 'date'], { unique: true })
], StockOldData);
exports.default = StockOldData;
