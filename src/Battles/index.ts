import { Server, Socket } from "socket.io";
import { MonsterEquippedSkillById, MonsterStats, MonsterType } from "../../types/Monster";
import { getInsertQuery, getUTCDatetime } from "../../utils";
import DB from "../DB";
import { BossMonster, getPlayerMonsters, getRandomAreaMonsterBaseMetadataId, PlayerMonster, WildMonster } from "../Monsters";
import { BattleConstructor, RoomEvent, SkillUsage } from "./types";
import * as UserController from '../Controllers/UserController';

const BATTLE_DELAY = 5; // 5 seconds delay for wild/boss battles

const STATUS_BATTLE_ONGOING = 0;
const STATUS_BATTLE_ENDED = 1;

const BATTLE_TYPE_WILD = 0;
const BATTLE_TYPE_BOSS = 1;

export class Battle {
    io: Server;
    client: Socket;
    room: string;
    battle_id: number = 0;
    hasLogged = false;

    encounter: BossMonster | WildMonster | undefined;
    playerMonsters: { [id: number]: PlayerMonster } = {};
    playerMonsterCount: number = 0;
    address: string;
    areaId: number = 0;
    userId: number = 0;
    type: MonsterType;

    skillUsage: SkillUsage = {};

    encounterReady: boolean = false;
    playerReady: boolean = false;
    playerCumulativeHp: number = 0;

    battleEnded = false;

    onPromptDelete;

    db = new DB();

    constructor({ io, socket, address, type, onPromptDelete }: BattleConstructor) {
        this.io = io;
        this.client = socket;
        this.room = `battle_${address}`;

        this.address = address;
        this.type = type;
        this.onPromptDelete = onPromptDelete;
    }

    init = async () => {
        try {
            await this._getPlayerMonsters();
        }

        catch {
            this.client.emit('invalid_battle', 'You have 0 guardians in party');
        }

        let user = await UserController.findByAddress(this.address);
        if(!user) {
            return;
        }
        this.userId = user.id;
        let area = await DB.executeQueryForSingleResult<{id: number}>(`
            select player_locations.id from player_locations 
            join users u on u.id = player_locations.user_id 
            where lower(u.address) = lower('${this.address}')`)

        if(!area) {
            this.client.emit('invalid_battle', 'Unable to get area');
            return;
        }

        this.areaId = area.id;
        try {
            await this._getEncounter();
        }

        catch(e) {
            this.client.emit('invalid_battle', 'Unable to track monster');
        }
    
        this._joinRoom();
        this._listenToRoomDestruction();
        this._listenToPlayerLeave();
    }

    /**
     * Emits events to this room
     * 
     * @param event 
     * @param value 
     */
    _emitEvent = (event: string, value: any) => {
        if(this.battleEnded) {
            return;
        }

        this.io.to(this.room).emit(event, value);
    }

    //puts client into battle room
    _joinRoom = () => {
        if(this.io.sockets.adapter.rooms.get(this.room)) {
            throw Error("There is an ongoing battle");
        }

        this.client.join(this.room);
    }

    _destroyRoom = () => {
        // disconnect sockets after battle end
        this.io.in(this.room).disconnectSockets();
    }

    _listenToPlayerLeave = () => {
        this.client.on('disconnect', () => {
            //do nothing
        });
    }

    /**
     * Triggers when player leaves room or battle ended
     */
    _listenToRoomDestruction = () => {
        this.io.sockets.adapter.on('delete-room', async(room) => {
            //prevent dupes
            if(this.hasLogged) {
                return;
            }

            if(room === this.room) {
                this.hasLogged = true;
                this.battleEnded = true;

                /** log battle */
                let columns = ['pve_battle_id', 'skill_id', 'monster_id', 'total_damage_dealt', 'crit_damage_dealt', 'hits', 'crits', 'misses', 'total_cooldown'];
                let values: any[][] = [];

                if(Object.keys(this.skillUsage).length === 0){
                    //no battle occured
                    this.onPromptDelete();
                    return;
                }
                
                for(const [monsterId, skills] of Object.entries(this.skillUsage)) {
                    if(Object.keys(skills).length === 0) {
                        continue;
                    }

                    for(const [skillId, stats] of Object.entries(skills)) {
                        values.push([this.battle_id, skillId, monsterId, stats.damage, stats.crit_damage, stats.hit, stats.crit, stats.miss, stats.totalCd]);
                    }
                }

                if(values.length === 0) {
                    //no battle occured
                    this.onPromptDelete();
                    return;
                }

                let query = getInsertQuery(columns, values, 'pve_battle_player_skills_used');
                await DB.executeQuery(query);
                this.onPromptDelete();
            }
        });
    }

    _listenToRoomEvents = () => {
        this.client.on(this.room, async({ type, value }: RoomEvent) => {
            if(this.battleEnded) {
                return;
            }

            switch(type) {
                case "player_attack":
                    //player attack
                    let monsterId = value.id;
                    let skillId = value.skill_id;
                    let playerMonster = this.playerMonsters[monsterId];

                    if(!playerMonster) {
                        //dont throw error to make sure battle doesn't break
                        return;
                    }

                    let attackRes = await playerMonster.attack(this.encounter!, skillId);
                    let { attacks, hits, misses, crit, totalDamage, critDamage, cd } = attackRes;

                    if(attacks.length === 0) {
                        //on cooldown
                        return;
                    }

                    this._emitEvent('encounter_damage_received', { monsterId, skillId, attacks, encounterHpLeft: this.encounter!.stats.hp_left });
                    
                    if(!this.skillUsage[monsterId]) {
                        this.skillUsage[monsterId] = {};
                    }

                    if(!this.skillUsage[monsterId][skillId]) {
                        this.skillUsage[monsterId][skillId] = {
                            hit: 0,
                            miss: 0,
                            crit: 0,
                            damage: 0,
                            crit_damage: 0,
                            totalCd: 0,
                        };
                    }

                    this.skillUsage[monsterId][skillId].hit += hits;
                    this.skillUsage[monsterId][skillId].miss += misses;
                    this.skillUsage[monsterId][skillId].crit += crit;
                    this.skillUsage[monsterId][skillId].damage += totalDamage;
                    this.skillUsage[monsterId][skillId].crit_damage += critDamage;
                    this.skillUsage[monsterId][skillId].totalCd += cd * 1000; // in ms

                    if(this.encounter!.isDead()) {
                        this._sendWinMessage();
                        this.endBattle();
                        return;
                    }

                    break;

                case "flee":
                    this._sendLoseMessage();
                    this.endBattle();
                    return;

                default:
                    break;
            }
        });
    }

    _sendBattleStats = () => {
        this._emitEvent('end_battle_skill_usage', this.skillUsage);
        this._emitEvent('end_battle_encounter_hp', this.encounter!.stats.hp_left);
    }

    _sendLoseMessage = () => {
        this._emitEvent('battle_lost', 'true');
    }

    _sendWinMessage = () => {
        this._emitEvent('battle_won', 'true');
    }

    _onEncounterLoad = () => {
        this.encounterReady = true;
        if(this.playerReady) {
            this._start();
        }
    }

    //encounter attack
    _onEncounterOffCooldown = async() => {
        if(this.battleEnded) {
            return;
        }

        // attack random player monster
        let {totalDamage, cd} = await this.encounter!.attackPlayer(Object.values(this.playerMonsters));
        this.playerCumulativeHp -= totalDamage;
        this._emitEvent('encounter_hit', {damage: totalDamage, cd, playerHpLeft: this.playerCumulativeHp});

        if(this.playerCumulativeHp < 0) {
            this._sendLoseMessage();
            this.endBattle();
        }
    }

    _onPlayerMonsterLoad = (playerMonster: PlayerMonster) => {
        this.playerMonsters[playerMonster.id] = playerMonster;
        this.playerCumulativeHp += playerMonster.getStats().hp;

        if(this.playerMonsterCount === Object.keys(this.playerMonsters).length) {
            this.playerReady = true;
            if(this.encounterReady) {
                this._start();
            }
        }
    }

    _onPlayerMonsterOffCooldown = (id: number) => {
        this._emitEvent("player_monster_off_cd", id);
    }

    _getPlayerMonsters = async() => {
        let monsterIds = await getPlayerMonsters(this.address);
        if(!monsterIds || monsterIds.length === 0) {
            throw Error("Unable to get player monsters");
        }

        this.playerMonsterCount = monsterIds.length;

        monsterIds.forEach(id => {
            new PlayerMonster({ onOffCooldown: () => this._onPlayerMonsterOffCooldown(id), onLoad: this._onPlayerMonsterLoad, id });
        });
    }

    _getEncounter = async() => {
        let randomMonsterMetadataId = await getRandomAreaMonsterBaseMetadataId(this.areaId);
        if(!randomMonsterMetadataId) {
            throw Error("Unable to get monster metadata");
        }

        switch(this.type) {
            case "boss":
                this.encounter = new BossMonster({ 
                    onOffCooldown: this._onEncounterOffCooldown, 
                    onLoad: this._onEncounterLoad, 
                    metadataId: randomMonsterMetadataId,
                    areaId: this.areaId
                });
                break;
            case "wild":
                this.encounter = new WildMonster({ 
                    onOffCooldown: this._onEncounterOffCooldown, 
                    onLoad: this._onEncounterLoad, 
                    metadataId: randomMonsterMetadataId,
                    areaId: this.areaId
                });
                break;
            default:
                throw Error("Unknown type");
        }
    }

    /**
     * Starts the battle.
     * Sends all required info like player monsters and encounter
     */
    _start = async() => {
        let now = getUTCDatetime();
        let columns = ['user_id', 'status', 'time_start'];
        let values: any[][] = [[this.userId, STATUS_BATTLE_ONGOING, now]];

        let query = getInsertQuery(columns, values, 'pve_battles', true);
        let ret = await DB.executeQueryForSingleResult<{ id: number }>(query);
        if(!ret || !ret.id) {
            throw Error("Unable to create session");
        }
        this.battle_id = ret.id;

        let playerMonsters: { [id: string]: MonsterStats } = {};
        let playerMonsterSkills: {[id: string]: MonsterEquippedSkillById } = {};
        for(const[monsterId, playerMonster] of Object.entries(this.playerMonsters)) {
            playerMonsters[monsterId] = playerMonster.getStats();
            playerMonsterSkills[monsterId] = playerMonster.getSkills();
        }

        this._listenToRoomEvents();
        this._emitEvent('battle_start', {
            playerMonsters,
            playerMonsterSkills,
            encounter: this.encounter!.getStats(),
            battle_id: this.battle_id,
        });

        setTimeout(() => {
            this._onEncounterOffCooldown();
        }, BATTLE_DELAY * 1000);
    }

    /**
     * Triggers when the battle ended.
     */
    endBattle = async() => {
        this.battleEnded = true;
        this._sendBattleStats();

        let now = getUTCDatetime();
        let query = `UPDATE pve_battles SET time_end = '${now}', status = ${STATUS_BATTLE_ENDED} WHERE id = ${this.battle_id}`;
        await DB.executeQuery(query);

        let columns = ['pve_battle_id', 'type', 'monster_base_metadata_id', 'attack', 'defense', 'hp', 'hp_left', 'crit_chance', 'crit_multiplier', 'is_shiny', 'is_captured'];
        
        let stats = this.encounter!.getBaseStats();
        
        let values: any[][] = [[
            this.battle_id,
            BATTLE_TYPE_WILD, // or boss
            this.encounter!.metadataId,
            stats.attack,
            stats.defense,
            stats.hp,
            stats.hp_left,
            stats.crit_chance,
            stats.crit_multiplier,
            stats.is_shiny,
            'false',
        ]];
        await DB.executeQuery(getInsertQuery(columns, values, 'pve_battle_encounters'));

        this._destroyRoom();
    }
}