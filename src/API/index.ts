import DB from "../DB"
import { BattleEncounterMetadata, BattleResult, BattleSkillsUsed, MonsterBaseMetadata } from "./types";
import {
    getRandomNumber,
    getInsertQuery,
    getRandomChance
} from "../../utils";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
    path: path.join(__dirname, '../../.env')
});
import _ from "lodash";
import effectFile from '../../assets/effects/_effect_files.json';
import * as UserController from '../Controllers/UserController';

export const getStarterMonsters = async () => {
    let query = `
                    with starter_ids AS (
                        select chain_id, element_id, min(id) + (3 * floor(min(id) / 100)) as monster_metadata_id
                        from monster_base_metadata
                        group by chain_id, element_id
                    )
                    select
                        md.id,
                        md.name,
                        e.id as element_id,
                        e.name as element_name,
                        img_file,
                        base_attack,
                        max_attack,
                        base_defense,
                        max_defense,
                        base_hp,
                        max_hp,
                        base_crit_chance,
                        max_crit_chance,
                        base_crit_multiplier,
                        max_crit_multiplier,
                        shiny_chance
                    from monster_base_metadata md
                    join elements e
                    on e.id = md.element_id
                    where md.id in (select monster_metadata_id from starter_ids)
                    order by element_id, md.id
                    limit 3`;
    let res = await DB.executeQueryForResults<MonsterBaseMetadata>(query);
    return res ? res : [];
}

export const insertClaimedAddress = async (address : string) => {
    let query = `insert into claimed_addresses (address) values ('${address}'); insert into player_locations (address) values ('${address}');`;
    await DB.executeQuery(query);
}

export const moveAddressTo = async (address: string, areaId: number) => {
    if (!areaId) {
        throw Error("Invalid location");
    }

    let user = await UserController.findByAddress(address);
    if(!user) {
        throw Error("Missing user");
    }
    let query = `update player_locations set area_id = ${areaId} where user_id = ${user.id}`;
    await DB.executeQuery(query);
}

export const getAddressArea = async (address : string) => {
    let user = await UserController.findByAddress(address);
    if(!user) {
        throw Error("Missing user");
    }

    let query = `select area_id from player_locations where user_id = ${user.id}`;

    return await DB.executeQueryForSingleResult<{ area_id: number }>(query);

}


export const insertMonster = async(metadata: number, tokenHash: string) => {
    let getMonsterMetadataQuery = `select * from monster_base_metadata where id = ${metadata}`;
    let monsterBaseMetadata = await DB.executeQueryForSingleResult<MonsterBaseMetadata>(getMonsterMetadataQuery);

    if(!monsterBaseMetadata) {
        throw Error("Unknown monster");
    }

    const table = 'monsters';
    const columns = [
        'monster_base_metadata_id',
        'attack',
        'defense',
        'hp',
        'crit_chance',
        'crit_multiplier',
        'is_shiny',
        'hash'
    ];
    let values: any[][] = [];

    let {
        base_attack,
        max_attack,
        base_defense,
        max_defense,
        base_crit_chance,
        max_crit_chance,
        base_crit_multiplier,
        max_crit_multiplier,
        base_hp,
        max_hp,
        shiny_chance,
    } = monsterBaseMetadata;

    let isShiny = getRandomChance() < shiny_chance;

    values.push([
        metadata,
        getRandomNumber(base_attack, max_attack),
        getRandomNumber(base_defense, max_defense),
        getRandomNumber(base_hp, max_hp),
        getRandomNumber(base_crit_chance, max_crit_chance),
        getRandomNumber(base_crit_multiplier, max_crit_multiplier),
        isShiny? 'true' : 'false',
        tokenHash
    ]);

    const query = getInsertQuery(columns, values, table, true);
    return await DB.executeQueryForSingleResult(query);
}

export const insertMonsterUsingBattleId= async(address: string, battleId: number, tokenHash: string) => {
    // get battle
    let getMonsterMetadataQuery = `select
	                                    address,
                                        monster_base_metadata_id,
                                        attack,
                                        defense,
                                        hp,
                                        crit_chance,
                                        crit_multiplier,
                                        is_shiny
                                    from pve_battles b
                                    join pve_battle_encounters e
                                    on b.id = e.pve_battle_id
                                    where b.status = 1
                                    and lower(b.address) = lower('${address}')
                                    and b.id = ${battleId}`;
    let monsterBaseMetadata = await DB.executeQueryForSingleResult<BattleEncounterMetadata>(getMonsterMetadataQuery);

    if(!monsterBaseMetadata) {
        throw Error("Unknown battle");
    }

    const table = 'monsters';
    const columns = ['monster_base_metadata_id', 'attack', 'defense', 'hp', 'crit_chance', 'crit_multiplier', 'is_shiny', 'hash'];
    let values: any[][] = [];

    //insert
    let {
        monster_base_metadata_id,
        attack,
        defense,
        hp,
        crit_chance,
        crit_multiplier,
        is_shiny
    } = monsterBaseMetadata;

    values.push([
        monster_base_metadata_id,
        attack,
        defense,
        hp,
        crit_chance,
        crit_multiplier,
        is_shiny? 'true' : 'false',
        tokenHash
    ]);

    const query = getInsertQuery(columns, values, table, true);
    let res = await DB.executeQueryForSingleResult(query);

    //update battle captured
    const updateQuery = `update pve_battle_encounters set is_captured = true where pve_battle_id = ${battleId}`;
    await DB.executeQuery(updateQuery);

    return res;
}

export const insertMonsterEquippedSkills = async(monsterId: number) => {
    const SEED_EQUIPPED_SKILL_COUNT = 4;

    
    let table = 'monster_equipped_skills';
    let columns = ['monster_id', 'monster_skill_id'];
    let values: any[][] = [];
    let nEffects = effectFile.file_names.length;

    let skills: number[] = [];

    for (let j = 0; j < SEED_EQUIPPED_SKILL_COUNT; j++) {
        let skillId = 0;

        do {
            skillId = getRandomNumber(1, nEffects, true);
        } while (skills.includes(skillId));

        skills.push(skillId);
        values.push([monsterId, skillId]);
    }

    let query = getInsertQuery(columns, values, table, true);

    return await DB.executeQueryForResults(query);
}

// battles
export const getBattleResults = async(address: string) => {
    //sanitize battle id
    let query = `select
                    b.id as battle_id,
                    time_start,
                    time_end,
                    type,
                    mb.name,
                    mb.img_file,
                    mb.element_id,
                    attack,
                    defense,
                    hp,
                    hp_left,
                    crit_chance,
                    crit_multiplier,
                    is_shiny,
                    is_captured
                from pve_battles b
                join pve_battle_encounters e
                on b.id = e.pve_battle_id
                join monster_base_metadata mb
                on mb.id = e.monster_base_metadata_id
                where lower(address) = lower('${address}')
                and status = 1 -- battle ended
                order by b.id desc
                `;
    let res = await DB.executeQueryForResults<BattleResult>(query);
    return res ?? [];
}

export const getBattleResult = async(address: string, battleId: string) => {
    //sanitize battle id
    let battleIdInt = parseInt(battleId);

    let user = await UserController.findByAddress(address);
    if(!user) {
        throw Error("Missing user");
    }

    let query = `select
                    b.id as battle_id,
                    time_start,
                    time_end,
                    type,
                    mb.name,
                    mb.img_file,
                    mb.element_id,
                    attack,
                    defense,
                    hp,
                    hp_left,
                    crit_chance,
                    crit_multiplier,
                    is_shiny,
                    is_captured
                from pve_battles b
                join pve_battle_encounters e
                on b.id = e.pve_battle_id
                join monster_base_metadata mb
                on mb.id = e.monster_base_metadata_id
                where user_id = ${user.id}
                and b.id = ${battleIdInt}
                and status = 1 -- battle ended
                `;
    let res = await DB.executeQueryForSingleResult<BattleResult>(query);
    return res;
}

export const getBattleSkillsUsed = async(battleId: string) => {
    //sanitize battle id
    let battleIdInt = parseInt(battleId);

    let query = `select
                    m.id as monster_id,
                    mb.name as monster_name,
                    mb.img_file as monster_img,
                    mb.element_id as monster_element_id,
                    ms.name as skill_name,
                    ms.element_id,
                    ms.icon_file as skill_icon,
                    su.total_damage_dealt,
                    su.crit_damage_dealt,
                    CASE WHEN su.total_cooldown = 0 THEN 1 ELSE su.total_cooldown END as total_cooldown,
                    su.hits,
                    su.crits,
                    su.misses,
                    m.is_shiny,
					m.attack as monster_attack,
					m.defense as monster_defense,
					m.hp as monster_hp,
					m.crit_chance as monster_crit_chance,
					m.crit_multiplier as monster_crit_multiplier
                from pve_battle_player_skills_used su
                join monsters m
                on m.id = su.monster_id
                join monster_base_metadata mb
                on mb.id = m.monster_base_metadata_id
                join monster_skills ms
                on ms.id = su.skill_id
                where pve_battle_id = ${battleIdInt}
                `;
    let res = await DB.executeQueryForResults<BattleSkillsUsed>(query);
    return res ?? [];
}