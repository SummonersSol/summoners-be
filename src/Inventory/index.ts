import DB from "../DB"
import {
    getInsertQuery
} from "../../utils";
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
    path: path.join(__dirname, '../../.env')
});
import _ from "lodash";
import * as UserController from '../Controllers/UserController';

export const getInventory = async (address:string) => {
    return [];
}

export const equipMonster = async(address:string, monsterId: number) => {
    try {
        let user = await UserController.findByAddress(address);
        if(!user) {
            return false;
        }

        let table = 'player_monsters';
        let checkerQuery = `SELECT COUNT(*) as count FROM ${table} WHERE user_id = ${user.id}`;
        let checkerRes = await DB.executeQueryForSingleResult<{count: number}>(checkerQuery);

        if(
            (checkerRes && checkerRes.count >= 4)
        ) {
            // console.log(`Party full!`);
            return false;
        }

        let columns = ['address', 'monster_id'];
        let values: any[][] = [];
        values.push([address, monsterId]);
        let query = getInsertQuery(columns, values, table);
        query = `${query.replace(';', '')} returning id;`;
        const result = await DB.executeQueryForSingleResult(query);

        return true;
    }
    catch {
        return false;
    }
}

export const unequipMonster = async(address:string, monsterId: number) => {
    let removeQuery = `DELETE FROM player_monsters WHERE address = '${address}' AND monster_id = ${monsterId}`;
    try {
        const result = await DB.executeQueryForSingleResult(removeQuery);

        return true;
    }
    catch {
        return false;
    }
}