import { Router } from 'express';
import { getServerPort, isProduction } from '../../utils';
import * as clientio from 'socket.io-client';
import * as UserController from '../Controllers/UserController';
import * as CourseController from '../Controllers/CourseController';
import * as ActionController from '../Controllers/ActionController';

export const routes = Router();
const port = getServerPort();
// let socket = clientio.connect(`ws://localhost:${port}`);

routes.post('/', async(req, res) => {
    let { address } = req.body;
    let courses = await CourseController.list(address);
    let courseComletions = await UserController.getLessonCompletionsByAddress(address);
    return res.send(courses);
});

routes.post('/lastPage', async(req, res) => {
    let { lesson_id, lesson_page_id, address } = req.body;
    if(!lesson_page_id || !lesson_id) {
        return res.status(400).send("Bad Request");
    }
    await UserController.setLastPageByAddress(address, lesson_id, lesson_page_id);
    return res.send("Success");
});

routes.post('/verifyFirstTestnetTx', async(req, res) => {
    let action = await ActionController.find({tx_verify_url: '/courses/verifyFirstTestnetTx'});
    if(!action || !action[0]) {
        return res.send(500);
    }

    let { address } = req.body;
    await UserController.setLessonPageCompleteByAddress(address, action[0].lesson_page_id);
    return res.send("Success");
});