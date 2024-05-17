import * as path from 'path';
import { ConnectionOptions } from 'typeorm';
import StockData from './src/models/stockData';
import StockOldData from './src/models/stockOldData';
const entities = [
    StockData,
    StockOldData
];
export = {
    type: 'postgres',
    host: process.env.RDS_HOSTNAME,
    port: parseInt(process.env.RDS_PORT as string, 10),
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DB_NAME,
    logging: process.env.DB_QUERY_LOGGING === 'true',
    entities,
    migrations: [path.join(__dirname, 'migration', '*.*')],
    synchronize: false,
    cli: {
        migrationsDir: 'migration',
    },
    dialect: "postgres",
    dialectOptions: {
    ssl: {
        require: true, 
        rejectUnauthorized: false,
    },
    },
} as ConnectionOptions;
