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
    return [];
}

export { 
    BossMonster, 
    PlayerMonster, 
    WildMonster,
    getAreaMonsterBaseMetadataIds, 
    getRandomAreaMonsterBaseMetadataId, 
    getPlayerMonsters,
};