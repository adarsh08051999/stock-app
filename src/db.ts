import config from '../ormconfig';
import { Connection, createConnection, EntityManager } from 'typeorm';

export class Db {
    public Ready: Promise<void>;

    private conn!: Connection;

    constructor() {
        this.Ready = new Promise((resolve, reject) => {
            createConnection(config)
                .then(conn => {
                    console.log('Connected to postgres database')
                    this.conn = conn;
                    resolve();
                })
                .catch(err => {
                    console.log(`Configuration set for postgres DB are ${JSON.stringify(config)}`);
                    console.log(`!!!!Failed to connect to postgres database ${err}`)
                    reject(err);
                });
        });
    }
    public getManager(): EntityManager {
        return this.conn.manager;
    }
}

const db = new Db();
export default db;
