import dotenv from 'dotenv';
dotenv.config();
import { app, expressSetup } from './src/app';
import db from './src/db';
import brain from './src/service/brain'
db.Ready.then(async () => {
    expressSetup();
    const PORT = process.env.PORT ? parseInt(process.env.PORT as string, 10) : 3001;
    const HOST = process.env.HOST ? (process.env.HOST as string) : '0.0.0.0';
    app.listen(PORT, HOST, () => {
        console.log(`Started server on HOST: ${HOST}, at PORT: ${PORT}`);
    });
    brain.start();
}).catch(err => {
    console.log(`ERR while getting entity manager from db, ${err}`);
});
