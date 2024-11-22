import { getRandomNumber } from "../../utils";
import DB from "../DB";
import BossMonster from "./BossMonster";
import PlayerMonster from "./PlayerMonster";
import WildMonster from "./WildMonster";

const getAreaMonsterBaseMetadataIds = async(area_id: number) => {
    
    let areaMonsterBaseMetadataIds = await DB.executeQueryForResults<{ monster_base_metadata_id: number }>(`
        SELECT DISTINCT monster_base_metadata_id
        FROM area_monsters am
        JOIN monster_base_metadata mb
        ON mb.id = am.monster_base_metadata_id
        WHERE area_id = ${area_id};
    `);

    if(!areaMonsterBaseMetadataIds) {
        return [];
    }

    return areaMonsterBaseMetadataIds.map(x => x.monster_base_metadata_id);
}

const getRandomAreaMonsterBaseMetadataId = async(area_id: number) => {
    console.log(area_id);
    let areaMonsterBaseMetadataIds = await DB.executeQueryForResults<{ monster_base_metadata_id: number }>(`
        SELECT DISTINCT monster_base_metadata_id
        FROM area_monsters am
        JOIN monster_base_metadata mb
        ON mb.id = am.monster_base_metadata_id
        WHERE area_id = ${area_id};
    `);

    if(!areaMonsterBaseMetadataIds) {
        return undefined;
    }

    let ids = areaMonsterBaseMetadataIds.map(x => x.monster_base_metadata_id);
    return ids[getRandomNumber(0, ids.length - 1, true)];
}

const getPlayerMonsters = async(address: string) => {
    //only 4
    let monsterIds = await DB.executeQueryForResults<{ monster_id: number }>(`
        SELECT 
            monster_id
        FROM player_monsters pm
        JOIN monsters m
        ON m.id = pm.monster_id
        JOIN users u
        on u.id = pm.user_id
        WHERE 
            LOWER(u.address) = LOWER('${address}')
            and equipped
        LIMIT 4;
    `);

    if(!monsterIds) {
        return undefined;
    }

    return monsterIds.map(x => x.monster_id);;
}

export { 
    BossMonster, 
    PlayerMonster, 
    WildMonster,
    getAreaMonsterBaseMetadataIds, 
    getRandomAreaMonsterBaseMetadataId, 
    getPlayerMonsters,
};