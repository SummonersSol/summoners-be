import DB from "../DB"
import {
    getInsertQuery
} from "../../utils";
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
    path: path.join(__dirname, '../../.env')
});
import _, { add } from "lodash";
import * as UserController from '../Controllers/UserController';

export const getInventory = async (address:string) => {
    try {
        const mobQuery = `
            SELECT
                mob.id,
                mob.attack,
                mob.defense,
                mob.hp,
                mob.crit_chance,
                mob.crit_multiplier,
                mob.is_shiny,
                equipped,
                mbm.name,
                mbm.img_file,
                e.name as element,
                e.id as element_id
            FROM monsters mob
            JOIN player_monsters pmob
            ON mob.id = pmob.monster_id
            join users u
            on u.id = pmob.user_id
            LEFT JOIN monster_base_metadata mbm
            ON mob.monster_base_metadata_id = mbm.id
            LEFT JOIN elements e
            ON mbm.element_id = e.id
            WHERE lower(u.address) = '${address}'
        `;

        let mobRes: any = await DB.executeQueryForResults(mobQuery);

        if (_.isEmpty(mobRes)) {
            return [];
        }

        // select mob skills
        const skillQuery = `
            SELECT
                mob.id,
                e.name as element,
                e.id as element_id,
                ms.name,
                ms.icon_file,
                ms.hits,
                ms.accuracy,
                ms.cooldown,
                (ms.multiplier * 100) as damage
            FROM monsters mob
            LEFT JOIN monster_equipped_skills mes
            ON mob.id = mes.monster_id
            LEFT JOIN monster_skills ms
            ON mes.monster_skill_id = ms.id
            LEFT JOIN elements e
            ON ms.element_id = e.id
            WHERE mob.id IN (${mobRes.map((x: any) => `${x.id}`).join(",")})
        `;

        let skillRes: any = await DB.executeQueryForResults(skillQuery);
        // assign skills
        _.map(mobRes, (ms, index) => {
            mobRes[index].attack = mobRes[index].attack.toFixed(0);
            mobRes[index].defense = mobRes[index].defense.toFixed(0);
            mobRes[index].hp = mobRes[index].hp.toFixed(0);
            mobRes[index].crit_chance = mobRes[index].crit_chance.toFixed(0);

            mobRes[index]['skills'] = _.filter(skillRes, {'id': ms.id });

            // remove unused id
            _.map(mobRes[index]['skills'], (currMs, currIndex) => {
                mobRes[index]['skills'][currIndex].hits = mobRes[index]['skills'][currIndex].hits.toFixed(0);
                mobRes[index]['skills'][currIndex].accuracy = mobRes[index]['skills'][currIndex].accuracy.toFixed(0);
                mobRes[index]['skills'][currIndex].cooldown = mobRes[index]['skills'][currIndex].cooldown.toFixed(0);
                mobRes[index]['skills'][currIndex].damage = mobRes[index]['skills'][currIndex].damage.toFixed(0);
                mobRes[index]['skills'][currIndex] = _.omit(mobRes[index]['skills'][currIndex], 'id');
            })
        });

        return mobRes;
    } catch(e) {
        // console.log(e);
        return [];
    }
}

export const equipMonster = async(address:string, monsterId: number) => {
    try {
        let user = await UserController.findByAddress(address);
        if(!user) {
            return false;
        }

        let table = 'player_monsters';
        let checkerQuery = `SELECT COUNT(*) as count FROM ${table} WHERE user_id = ${user.id} and equipped`;
        let checkerRes = await DB.executeQueryForSingleResult<{count: number}>(checkerQuery);

        if(
            (checkerRes && checkerRes.count >= 4)
        ) {
            // console.log(`Party full!`);
            return false;
        }
        let query = `UPDATE player_monsters set equipped = true WHERE user_id = '${user.id}' AND monster_id = ${monsterId}`;
        const result = await DB.executeQueryForSingleResult(query);
        return true;
    }
    catch {
        return false;
    }
}

export const unequipMonster = async(address:string, monsterId: number) => {
    let user = await UserController.findByAddress(address);
    if(!user) {
        return false;
    }

    let removeQuery = `UPDATE player_monsters set equipped = false WHERE user_id = '${user.id}' AND monster_id = ${monsterId}`;
    try {
        const result = await DB.executeQueryForSingleResult(removeQuery);

        return true;
    }
    catch {
        return false;
    }
}