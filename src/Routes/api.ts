import { Router } from 'express';
import { getServerPort, isProduction } from '../../utils';
import * as clientio from 'socket.io-client';

export const routes = Router();
const port = getServerPort();
let socket = clientio.connect(`ws://localhost:${port}`);

routes.get('/', async(req, res) => {
});