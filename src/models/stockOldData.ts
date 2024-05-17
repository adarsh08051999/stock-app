import {
    BaseEntity,
    Column, Entity,
    Index,
    PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";

@Entity()
@Index(['stockId', 'date'], { unique: true })
export default class StockOldData extends BaseEntity{

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({
        type: "varchar",
    })
    public stockName?: string;

    @Column({
        type: "varchar",
    })
    public stockSymbol: string;

    @Column({
        type: "int",
    })
    public stockId: number;
    
    @Column({
        type: "float",
    })
    public closePrice: number;

    @Column({
        type: "varchar",
    })
    public date: string;

    @UpdateDateColumn()
    public updatedAt?: Date;
    
}