import { Router } from 'express';
import * as UserController from '../Controllers/UserController';
import { contentUpload } from './Upload';
import { checkAllowedMime, verifySignature } from '../../utils';
import _ from 'lodash';
import DB from '../DB';
import moment from 'moment';
import { getAddressArea, getBattleResult, getBattleResults, getBattleSkillsUsed, getStarterMonsters, insertMonsterEquippedSkills, insertMonsterUsingBattleId, moveAddressTo } from '../API';
import { equipMonster, getInventory, unequipMonster } from '../Inventory';
export const routes = Router();

//starter endpoints
routes.get('/getStarterMonsters', async function(req, res) {
    try {
        let starters = await getStarterMonsters();

        return res.send(starters);
    }

    catch {
        return res.status(400).send("Invalid Chain");
    }
});

routes.post('/capture', async function(req, res) {
    try {
        // insert mob
        const insert1: any = await insertMonsterUsingBattleId(
            req.body.address,
            req.body.battleId,
            req.body.tokenHash,
        );

        // random skills
        const insert2 = await insertMonsterEquippedSkills(insert1.id);

        // got 4 skills and mob inserted
        if (_.has(insert1, 'id') && _.size(insert2) == 4) {
            // console.log(`success mint`);
            return res.json({ 'success': true });
        }
        // console.log(`failed mint`);
        return res.json({ 'success': false });
    }

    catch(e) {
        return res.status(400).send("Unknown Error");
    }
});

//map api
routes.get('/area/:address', async function(req, res) {
    try {

        let address = req.params['address'];
        let area = await getAddressArea(address);

        if(!area) {
            return res.status(404).send("Cant find location");
        }

        return res.send({ area_id: area.area_id });
    }

    catch (e){
        return res.status(400).send("Invalid address or location");
    }
});

routes.post('/travel', async function(req, res) {
    try {
        const address = req.body['address'];
        const areaId = req.body['areaId'];
        await moveAddressTo(address, areaId);
        return res.send("1");
    }

    catch {
        return res.status(400).send("Invalid address or location");
    }
});

//end battle api
routes.post('/battleResults', async function(req, res) {
    try {
        let address = req.body['address'];
        let results = await getBattleResults(address);

        if(!results) {
            return res.status(404).send("Cant find battle result");
        }

        return res.send(results);
    }

    catch (e){
        return res.status(400).send("Bad Request");
    }
});

routes.post('/battleResult', async function(req, res) {
    try {
        let address = req.body['address'];
        let battleId = req.body['battleId'];
        let [result, skillsUsed] = await Promise.all([getBattleResult(address, battleId), getBattleSkillsUsed(battleId)]);

        if(!result) {
            return res.status(404).send("Cant find battle result");
        }

        return res.send({result, skillsUsed});
    }

    catch (e){
        return res.status(400).send("Bad Request");
    }
});

routes.post('/inventory', async function(req, res) {
    const address = req.body['address'].toLowerCase();
    return res.send(await getInventory(address));
});

routes.post('/equipMob', async function(req, res) {
    const address = req.body['address'].toLowerCase();
    const monsterId = req.body['monsterId'];
    return res.send(await equipMonster(address, monsterId));
});

routes.post('/unequipMob', async function(req, res) {
    const address = req.body['address'].toLowerCase();
    const monsterId = req.body['monsterId'];
    return res.send(await unequipMonster(address, monsterId));
});