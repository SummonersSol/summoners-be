import { Router } from 'express';
import { getServerPort, isProduction } from '../../utils';
import * as clientio from 'socket.io-client';
import * as UserController from '../Controllers/UserController';
import * as CourseController from '../Controllers/CourseController';
import * as LessonController from '../Controllers/LessonController';
import * as LessonPageController from '../Controllers/LessonPageController';
import * as ActionController from '../Controllers/ActionController';

export const routes = Router();
const port = getServerPort();
// let socket = clientio.connect(`ws://localhost:${port}`);

routes.post('/', async(req, res) => {
    let { address } = req.body;
    let courses = await CourseController.list(address);
    // let courseCompletions = await UserController.getCourseCompletionsByAddress(address);
    return res.send(courses);
});

routes.post('/lastPage', async(req, res) => {
    let { lesson_id, lesson_page_id, address } = req.body;
    if(!lesson_page_id || !lesson_id) {
        return res.status(400).send("Bad Request");
    }
    await UserController.completePageByAddress(address, lesson_id, lesson_page_id);
    return res.send("Success");
});

routes.post('/verifyFirstTestnetTx', async(req, res) => {
    let action = await ActionController.find({tx_verify_url: 'http://localhost:8081/courses/verifyFirstTestnetTx'});
    if(!action || !action[0]) {
        return res.send(500);
    }

    let lessonPage = await LessonPageController.find({id: action[0].lesson_page_id});
    if(!lessonPage || !lessonPage[0]) {
        return res.send(500);
    }

    let { address } = req.body;
    await UserController.completeLessonByAddress(address, lessonPage[0].lesson_id);
    await UserController.completePageByAddress(address, lessonPage[0].lesson_id, action[0].lesson_page_id);
    return res.send("Success");
});

routes.post('/:id', async(req, res) => {
    let { id } = req.params;
    let { address } = req.body;
    let user = await UserController.findByAddress(address);
    if(!user) {
        return res.send(404);
    }

    let course = await CourseController.view(Number(id), user.id);
    return res.send(course);
});

routes.post('/lesson/:id', async(req, res) => {
    let { id } = req.params;
    let { address } = req.body;
    let user = await UserController.findByAddress(address);
    if(!user) {
        return res.send(404);
    }

    let lesson = await LessonController.view(Number(id), user.id);
    return res.send(lesson);
});

routes.post('/lesson_page/:lesson_id/:lesson_page_id/complete', async(req, res) => {
    let { lesson_id, lesson_page_id } = req.params;
    let { address } = req.body;
    let user = await UserController.findByAddress(address);
    if(!user) {
        return res.send(404);
    }

    await UserController.completePageByAddress(address, Number(lesson_id), Number(lesson_page_id));
    return res.send("Success");
});