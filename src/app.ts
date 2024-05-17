import express from 'express';
import rTracer from 'cls-rtracer';
import cors = require('cors');
import { v4 as uuidv4 } from 'uuid';
import { Router } from './routers/routes';

export const app = express();

export const expressSetup = () => {
    app.use(
        rTracer.expressMiddleware({
            echoHeader: true,
            requestIdFactory: uuidv4,
        }),
    );
    const corsOptions = {
        origin: true,
        methods: ['POST', 'PUT', 'GET', 'DELETE'],
        credentials: true,
        maxAge: 3600,
        optionsSuccessStatus: 200,
    };
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use('', new Router().handle());
};

