import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import cors from 'cors';
import _, { add, groupBy } from 'lodash';
import path from 'path';
import dotenv from 'dotenv';
import { routes as apiRoutes } from './src/Routes/api';
import { routes as userRoutes } from './src/Routes/user';
import { routes as gameRoutes } from './src/Routes/game';
import { getServerPort, } from './utils';
import { Battle } from './src/Battles';
import { StartBattleParams } from './types';
dotenv.config({ path: path.join(__dirname, '.env')});

process.on('uncaughtException', function (err) {
    //dont stop on uncaught exception
    console.log('Caught exception: ', err);
});

process.on('unhandledRejection', function (reason, promise) {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

//create app
const port = getServerPort();
const whitelists = JSON.parse(process.env.CORS_WHITELIST!);

let app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(async(req, res, next) => {
    // we need to check the multipart in their respective paths
    if(req.is('multipart/form-data')) {
        next();
        return;
    }

    if(req.path === "/user") {
        next();
        return;
    }

    // const { address, signature, message } = req.body;
    // if(!signature || !address) {
    //     console.log('invalid params');
    //     return res.status(400).send('Invalid params');
    // }

    // let verified = verifySignature(address, signature, message);
    // if(!verified) {
    //     return res.status(401).send("Unauthorized");
    // }

    next();
});

app.use('/api', apiRoutes);
app.use('/user', userRoutes);
app.use('/game', gameRoutes);

//connect app to websocket
let http = createServer(app);

let io = new Server(http, {
    cors: {
        origin: "*",
        credentials: true
    }
});

instrument(io, {
    auth: false
    // {
    //   type: "basic",
    //   username: "admin",
    //   password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS" // "changeit" encrypted with bcrypt
    // },
});

//websocket functions
io.on('connection', (socket: Socket) => {
    socket.on('start_battle', async({ address }: StartBattleParams) => {
        if(!address) {
            socket.emit("invalid_battle");
            return;
        }

        // console.log('starting battle for ' + socket.id);
        let battle: Battle | null = null;
        let onPromptDelete = () => {
            battle = null;
            // console.log('room destroyed');
        };
        try {
            battle = new Battle({io, socket, address, type: "wild", onPromptDelete});
            await battle.init();
        }

        catch (e){
            // do nothing
        }
    });
});

//api endpoints
app.get('/', function(req, res) {
    res.send('Hello World');
});

// start the server
http.listen(port, () => {
    console.log(`I'm alive! Port: ${port}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});