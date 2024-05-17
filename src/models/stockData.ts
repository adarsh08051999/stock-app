import {
    BaseEntity,
    Column, Entity,
    Index,
    PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";

@Entity()
export default class StockData extends BaseEntity{

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({
        type: "varchar",
    })
    public stockName: string;

    @Column({
        type: "varchar",
    })
    public stockSymbol: string;

    @Index({unique: true})
    @Column({
        type: "int",
    })
    public stockId: number;

    @Index()
    @Column({
        type: "boolean",
        default: "true",
    })
    public toBuy: boolean;

    @Column({
        type: "int",
        default: "0",
    })
    public budget: number;

    @Column({
        type: "int",
        default: "0"
    })
    public netLifetimeEarnings?: number;

    @Index()
    @Column({
        type: "boolean", 
        default: "false",
    })
    public isRemoved: boolean;

    @UpdateDateColumn()
    public updatedAt?: Date;
    
}