import { MonsterEquippedSkill, MonsterEquippedSkillById, MonsterStats } from "../../types/Monster";
import DB from "../DB";
import Base from "./Base";
import { PlayerMonsterConstructor } from "./types";

export default class PlayerMonster extends Base {

    onLoad;
    id;

    constructor({ onLoad, onOffCooldown, id }: PlayerMonsterConstructor) {
        super({ onOffCooldown });
        this.id = id;
        this.onLoad = onLoad;
        this.applyStats();
    }

    applyStats = async() => {
        let playerMonsterRes = await DB.executeQueryForSingleResult<MonsterStats>(`
            SELECT 
                mb."name",
                img_file,
                attack,
                defense,
                hp,
                hp as hp_left,
                element_id,
                crit_chance,
                crit_multiplier,
                e.name as element_name,
                e.icon_file as element_file,
                mt.is_shiny,
                'player' as type
            FROM monsters mt
            JOIN monster_base_metadata mb
            ON mt.monster_base_metadata_id = mb.id
            JOIN elements e
            ON mb.element_id = e.id
            WHERE mt.id = ${this.id}`);

        if(!playerMonsterRes) {
            throw Error("Unable to find player monster");
        }

        let playerMonsterEquippedSkills = await DB.executeQueryForResults<MonsterEquippedSkill>(`
            SELECT 
                ms.id,
                ms.name,
                e.id as element_id,
                e.name as element_name,
                e.icon_file as element_file,
                hits,
                accuracy,
                cooldown,
                multiplier,
                asset_file as effect_file,
                ms.icon_file as icon_file
            FROM monster_equipped_skills mes
            JOIN monster_skills ms
            ON ms.id = mes.monster_skill_id
            JOIN monster_skill_effects mse
            ON mse.id = ms.effect_id
            JOIN elements e
            ON e.id = ms.element_id
            WHERE mes.monster_id = ${this.id}`);

        if(!playerMonsterEquippedSkills || playerMonsterEquippedSkills.length === 0) {
            throw Error("Cant find player skills");
        }

        let skills: MonsterEquippedSkillById = {};
        for(let playerMonsterEquippedSkill of playerMonsterEquippedSkills) {
            skills[playerMonsterEquippedSkill.id] = playerMonsterEquippedSkill;
        }

        this._applyStats(playerMonsterRes, skills);
        this.onLoad(this);
    }
}