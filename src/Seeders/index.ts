import monsterFile from '../../assets/sprites/_monster_sprite_files.json';
import effectFile from '../../assets/effects/_effect_files.json';
import skillIconsFile from '../../assets/skills/_skill_icon_files.json';
import DB from '../DB';

import { getInsertQuery, getRandomNumber, getHash, getBeDomain } from '../../utils';
import _ from 'lodash';
import dotenv from 'dotenv';
import path from 'path';
import { MonsterBaseMetadata } from '../../types/Monster';
dotenv.config({ path: path.join(__dirname, '.env')});

const isTestnet = process.env.CHAIN_ENV === "testnet"
const SEED_MONSTER_COUNT = 100;
const SEED_EQUIPPED_SKILL_COUNT = 4;

//monsters
const MIN_ATTACK = 30;
const MAX_BASE_ATTACK = 40;
const MAX_ATTACK = 50;
const MIN_DEFENSE = 1;
const MAX_BASE_DEFENSE = 5;
const MAX_DEFENSE = 10;
const MIN_HP = 800;
const MAX_BASE_HP = 2000;
const MAX_HP = 3000;
const MIN_CRIT_CHANCE = 10;
const MAX_BASE_CRIT_CHANCE = 30;
const MAX_CRIT_CHANCE = 50;
const MIN_CRIT_MULTIPLIER = 1.25;
const MAX_BASE_CRIT_MULTIPLIER = 2;
const MAX_CRIT_MULTIPLIER = 10;

//skills
const MIN_HITS = 2;
const MAX_HITS = 10;
const MIN_CD = 2;
const MAX_CD = 5;
const MIN_ACCURACY = 80;
const MAX_ACCURACY = 100;
const MIN_SKILL_MULTIPLIER = 0.5;
const MAX_SKILL_MULTIPLIER = 5;

//areas
const MAX_AREA_ID = 8;

export const seedMonsterMetadata = async() => {
    
    let table = 'monster_base_metadata';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = [
        'element_id',
        'name',
        'img_file',
        'shiny_img_file',
        'shiny_chance',
        'base_attack',
        'max_attack',
        'base_defense',
        'max_defense',
        'base_hp',
        'max_hp',
        'base_crit_chance',
        'max_crit_chance',
        'base_crit_multiplier',
        'max_crit_multiplier',
    ];
    let values: any[][] = [];
    let nMonsters = monsterFile.file_names.length;

    for(let elementId = 1; elementId <= 4; elementId++) {
        for(let i = 0; i < nMonsters; i++) {
            let {name, file} = monsterFile.file_names[i];

            //currently unused
            let shinyImageFile = file.replace(".png", "_shiny.png");
            let shinyChance = getRandomNumber(0, 5); //5% chance max
            let baseAttack = getRandomNumber(MIN_ATTACK, MAX_BASE_ATTACK);
            let maxAttack = getRandomNumber(MAX_BASE_ATTACK, MAX_ATTACK);
            let baseDefense = getRandomNumber(MIN_DEFENSE, MAX_BASE_DEFENSE);
            let maxDefense = getRandomNumber(MAX_BASE_DEFENSE, MAX_DEFENSE);
            let baseHp = getRandomNumber(MIN_HP, MAX_BASE_HP);
            let maxHp = getRandomNumber(MAX_BASE_HP, MAX_HP);
            let baseCritChance = getRandomNumber(MIN_CRIT_CHANCE, MAX_BASE_CRIT_CHANCE);
            let maxCritChance = getRandomNumber(MAX_BASE_CRIT_CHANCE, MAX_CRIT_CHANCE);
            let baseCritMultiplier = getRandomNumber(MIN_CRIT_MULTIPLIER, MAX_BASE_CRIT_MULTIPLIER);
            let maxCritMultiplier = getRandomNumber(MAX_BASE_CRIT_MULTIPLIER, MAX_CRIT_MULTIPLIER);

            values.push([
                elementId,
                name,
                file,
                shinyImageFile,
                shinyChance,
                baseAttack,
                maxAttack,
                baseDefense,
                maxDefense,
                baseHp,
                maxHp,
                baseCritChance,
                maxCritChance,
                baseCritMultiplier,
                maxCritMultiplier,
            ]);
        }
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch (e){
        console.log(e);
        return false;
    }
}

export const seedMonsterSkills = async() => {
    
    let table = 'monster_skills';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['element_id', 'effect_id', 'name', 'hits', 'accuracy', 'cooldown', 'multiplier', 'icon_file'];
    let values: any[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let elementTypeId = getRandomNumber(1, 4, true); // type 1 - 4
        let effectId = i + 1; // reference current effect

        let skillName = effectFile.file_names[i].name;
        let hits = getRandomNumber(MIN_HITS, MAX_HITS, true);
        let accuracy = getRandomNumber(MIN_ACCURACY, MAX_ACCURACY, true);
        let cooldown = getRandomNumber(MIN_CD, MAX_CD, true);
        let multiplier = getRandomNumber(MIN_SKILL_MULTIPLIER, MAX_SKILL_MULTIPLIER);

        let iconFileIndex = getRandomNumber(0, skillIconsFile.file_names.length - 1, true);
        let iconFile = skillIconsFile.file_names[iconFileIndex];

        values.push([elementTypeId, effectId.toString(), skillName, hits, accuracy, cooldown, multiplier, iconFile]);
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch (e){
        console.log(e);
        return false;
    }
}

export const seedEffects = async() => {
    
    let table = 'monster_skill_effects';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let effectColumns = ['asset_file'];
    let effectValues: any[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let assetFile = effectFile.file_names[i].effect_file;
        effectValues.push([assetFile]);
    }

    let query = getInsertQuery(effectColumns, effectValues, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedMonsters = async() => {
    
    let table = 'monsters';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['monster_base_metadata_id', 'attack', 'defense', 'hp', 'crit_chance', 'crit_multiplier', 'is_shiny'];
    let values: any[][] = [];
    let maxMonsterId = monsterFile.file_names.length * 4;

    for(let i = 0; i < SEED_MONSTER_COUNT; i++) {
        let monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
        let attack = getRandomNumber(MIN_ATTACK, MAX_ATTACK);
        let defense = getRandomNumber(MIN_DEFENSE, MAX_DEFENSE);
        let hp = getRandomNumber(MIN_HP, MAX_HP);
        let crit_chance = getRandomNumber(MIN_CRIT_CHANCE, MAX_CRIT_CHANCE);
        let crit_multiplier = getRandomNumber(MIN_CRIT_MULTIPLIER, MAX_CRIT_MULTIPLIER);
        let isShiny = getRandomNumber(0, 1, true) === 1? 'true' : 'false';
        values.push([monsterBaseMetadataId, attack, defense, hp, crit_chance, crit_multiplier, isShiny]);
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedMonsterEquippedSkills = async() => {
    
    let table = 'monster_equipped_skills';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['monster_id', 'monster_skill_id'];
    let values: any[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < SEED_MONSTER_COUNT; i++) {
        let monsterId = (i + 1).toString();
        let skills: number[] = [];

        for(let j = 0; j < SEED_EQUIPPED_SKILL_COUNT; j++) {
            let skillId = 0;

            do {
                skillId = getRandomNumber(1, nEffects, true);
            } while(skills.includes(skillId));

            skills.push(skillId);
            values.push([monsterId, skillId]);
        }
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedAreas = async() => {
    
    let table = 'areas';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['name'];
    let values = [
        ['Novice Village'],
        ['Haunted Forest'],
        ['Big Grassland'],
        ['Volcano Sideway'],
        ['Underworld'],
        ['Sunken City'],
        ['Island'],
        ['Sky City'],
    ];

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedAreaMonsters = async() => {
    
    let table = 'area_monsters';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let monstersQuery = `select * from monster_base_metadata order by max_hp, max_attack, max_defense`;
    let monsterRes = await DB.executeQueryForResults<MonsterBaseMetadata>(monstersQuery);

    if(!monsterRes) {
        return false;
    }

    let columns = ['monster_base_metadata_id', 'area_id', 'stat_modifier'];
    let values: any[][] = [];
    let numMonsters = monsterRes.length;

    for(let areaId = 1; areaId <= MAX_AREA_ID; areaId++) {
        // area per monster + if area id = 1 then add remainder
        let thisAreaNumMonter = Math.floor(numMonsters / MAX_AREA_ID) + (areaId === 1? numMonsters % MAX_AREA_ID : 0);
        for(let index = 0; index < thisAreaNumMonter; index++) {
            values.push([monsterRes[index].id, areaId, '1']);
        }
    }


    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
    }

    catch (e) {
        console.log('Error seeding area monsters');
        return false;
    }

    console.log(`Seeded ${table}`);
    return true;
}

export const seedElementMultiplier = async() => {
    
    let table = 'element_multipliers';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['element_id', 'target_element_id', 'multiplier'];
    let values = [
        ['1', '1', '0.5'],
        ['1', '2', '0.25'],
        ['1', '3', '2'],
        ['1', '4', '1'],

        ['2', '1', '2'],
        ['2', '2', '0.5'],
        ['2', '3', '0.25'],
        ['2', '4', '1'],

        ['3', '1', '0.25'],
        ['3', '2', '2'],
        ['3', '3', '0.5'],
        ['3', '4', '1'],

        ['4', '1', '1'],
        ['4', '2', '1'],
        ['4', '3', '1'],
        ['4', '4', '1'],
    ];

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedElements = async() => {
    
    let table = 'elements';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['name', 'icon_file'];
    let values = [
        ['Grass', ''],
        ['Fire', ''],
        ['Water', ''],
        ['Chaos', ''],
    ];

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedPlayers = async(addresses: string[]) => {
    let table = 'users';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }
    let columns = ['name', 'address'];
    let values: any[][] = [];


    for(let address of addresses) {
        values.push([address, address]);
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        await DB.executeQuery('insert into player_locations (user_id) select id from users');
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedPlayerEquippedMonsters = async(addresses: string[]) => {
    let table = 'player_monsters';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }
    let columns = ['user_id', 'monster_id', 'equipped'];
    let values: any[][] = [];

    let monsterIds: number[] = [];

    for(let address of addresses) {
        // 4 monsters for each chain for each address
        let user = await DB.executeQueryForSingleResult<{id: number}>(`select id from users where address = '${address}'`);
        for(let i = 0; i < 4; i++){
            let monsterId = 0;
            do {
                monsterId = getRandomNumber(1, 100, true);
            } while(monsterIds.includes(monsterId));

            monsterIds.push(monsterId);
            values.push([user?.id, monsterId, 'true']);
        }
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedCourses = async() => {
    let table = 'courses';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }
    let columns = ['name', 'description'];
    let values: any[][] = [];

    values.push(['Introduction', 'In this course, you will learn all the basic Solana developer tools and essentials.']);

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedLessons = async() => {
    let table = 'lessons';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }
    let columns = ['name', 'course_id', 'exp'];
    let values: any[][] = [];

    values.push(['Introduction', 1, 100]);

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedLessonPages = async() => {
    let table = 'lesson_pages';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }
    let columns = ['lesson_id', 'markdown'];
    let values: any[][] = [];

    values.push([1, `# Chapter 1: Developer Networks

In Solana, there are three types of developer networks, namely testnet, devnet, and localnet. These networks serve a similar purpose - which is to allow developers to deploy their smart contracts and interact with them as a way to test their behavior before it's deployed to the mainnet, we don't want to have a buggy user experience now do we?

Although their main function is essentially the same, these networks are used by different groups of developers, where:

- Devnet

Devnet is where you can access all functions on the main net for testing and development purposes without actually interacting or risking real assets on the mainnet. **Tokens on Devnet are not real assets and cannot be transferred over to mainnet in any way.**

- Testnet

Testnet is similar to Devnet, but focuses on network performance and stability, it is oriented to be used by validators. **Tokens on Testnet are not real assets and cannot be transferred over to mainnet in any way.**

- Localnet

Localnet is also similar to Devnet, but the network is hosted locally, it is oriented to be used by projects that are in its earliest stages.

<small><a href="https://help.solflare.com/en/articles/6328814-differences-between-mainnet-devnet-and-testnet-and-how-to-switch-between-on-solflare" target="_blank">Read More</a></small>

Now that we know the differences, how do we communicate these networks? Let's find out!`]);

    values.push([1, `# Chapter 2: RPCs

In order to communicate with the networks, first we must set up RPCs. There are a few free Solana RPCs that you can sign up to, for example <a href="https://www.helius.dev/" target="_blank">Helius</a>, <a href="https://www.quicknode.com/" target="_blank">QuickNode</a>, and <a href="https://www.hellomoon.io/" target="_blank">HelloMoon</a>.

In this lesson, we're going to set up a Helius RPC.

1. First, go to the <a href="https://dashboard.helius.dev" target="_blank">developer login page</a>.

![image](/assets/courses/basics/helius_1.png)

2. Sign up using any of the options. In this example, we will be signing up using a Solana Wallet.

![image](/assets/courses/basics/helius_2.png)

![image](/assets/courses/basics/helius_3.png)

3. Choose the Free Plan and you're set!

![image](/assets/courses/basics/helius_4.png)

4. To get the API key for your project, go to the Endpoints tab on the left, and switch it to Devnet.

![image](/assets/courses/basics/helius_5.png)

![image](/assets/courses/basics/helius_6.png)

![image](/assets/courses/basics/helius_7.png)

Easy, isn't it? Next, we'll learn how to point our wallet to Solana's Testnet.`]);

    values.push([1, `# Chapter 3: Phantom Testnet

In this chapter, we will set up Phantom's testnet mode.

1. Click the circle at the top right corner, right next to your wallet's name.

![image](/assets/courses/basics/phantom_1.png)

2. Go to settings.

![image](/assets/courses/basics/phantom_2.png)

3. Scroll to the bottom, select Developer Settings.

![image](/assets/courses/basics/phantom_3.png)

4. Click on Testnet Mode and select Solana.

![image](/assets/courses/basics/phantom_4.png)

5. Select Solana Devnet and you're done!

![image](/assets/courses/basics/phantom_5.png)

Next, let's find out how to set it up on Backpack.`]);

    values.push([1, `# Chapter 4: Backpack Testnet

In this chapter, we will set up Backpack's testnet mode.

1. Click the circle at the top right corner, right next to your wallet's name.

![image](/assets/courses/basics/backpack_1.png)

2. Click on Settings.

3. Click on Solana.

![image](/assets/courses/basics/backpack_2.png)

4. Select RPC Connection.

![image](/assets/courses/basics/backpack_3.png)

5. Select Custom.

![image](/assets/courses/basics/backpack_4.png)

6. Paste the devnet RPC url from Helius.

![image](/assets/courses/basics/backpack_5.png)

7. Update and you're done!`]);

    values.push([1, `# Chapter 5: Faucets

We need SOLs to use Solana, even in testnet mode. However, we require testnet SOLs, not real SOLs, to do stuff in Solana's testnet.

To acquire SOLs on testnet (they have no value), you will need to request an airdrop. To do this, you will need to visit a faucet, or request it programatically.

For starters, I'll demonstrate on how to request an airdrop from a faucet.

1. First, go to this <a href="https://solfaucet.com/" target="_blank">site</a>.

![image](/assets/courses/basics/solfaucet_1.png)

2. Paste your wallet address.

![image](/assets/courses/basics/solfaucet_2.png)

3. Airdrop SOLs to Devnet, and you're done!

Easy!`]);

    values.push([1, `# Chapter 6: Explorers

What's the use of a public ledger when you have no idea what's happening right? Luckily for us, there are gigachads who chew glass all day that records all on chain transactions. In Solana, we have [Solscan](https://solscan.io) and [SolanaFM](https://solana.fm) to name a couple.

Using these explorers, users are able to see all on chain transactions and get all the important info of the transactions, such as transaction status, logs, events, and many more. Without these explorers, we are handicapped when trying to figure out the errors in our codes.

Similar to wallets, we will need to point the explorers to testnet if we want to get testnet transactions. Follow these instructions to set up the explorers.

- Solscan

1. Click on the Solana icon on the top right corner and select Solscan RPC - Devnet.

![image](/assets/courses/basics/solscan_1.png)

- Solana FM

1. Turn on Developer Mode using the bar at the bottom.

![image](/assets/courses/basics/solanafm_1.png)

2. Click on the Settings button on the bottom bar.

3. In Preferred RPC, select devnet-solana.

![image](/assets/courses/basics/solanafm_2.png)`]);

    values.push([1, `# Chapter 7: Finalizing

Now that that's done, let's make use of our knowledge and send a transaction in testnet mode.

To make things simple, let's send 0.01 testnet SOLs to this address: BFVoLdTw1hd6Ly9KTAPWYie9NeFcbce5evKFRQqpgxvm

We are using Phantom for this example.

1. Open up Phantom, if you haven't requested for an airdrop, please request from the faucet (Chapter 5).

![image](/assets/courses/basics/send_1.png)

2. Make sure it's in Testnet mode!!!

3. Click on Solana.

![image](/assets/courses/basics/send_2.png)

4. Click on Send.

![image](/assets/courses/basics/send_3.png)

5. Paste the address and follow the steps.

![image](/assets/courses/basics/send_4.png)

6. Once again, make sure it shows that the network is Solana Devnet (Backpack doesn't show this, but it will show that a custom RPC is being used).

![image](/assets/courses/basics/send_5.png)

7. Click on the View Transaction to view the transaction details.

![image](/assets/courses/basics/send_6.png)

Congratulations! You've made it to the end, now let's move on to the next courses shall we?`]);

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedActions = async() => {
    // id: number;
    // lesson_page_id: number;
    // markdown: string;
    // type: ActionType; 
    // code?: string;
    // options?: string;
    // tx_verify_url?: string;
    // cta_url?: string;
    let table = 'actions';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await DB.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }
    let columns = ['lesson_page_id', 'markdown', 'type', 'code', 'options', 'tx_verify_url', 'cta_url'];
    let values: any[][] = [];

    values.push([1, 'How many types of developer networks are there?', 'select', null, '{"options": ["1","2","3"], "answer": 2}', null, null]);
    values.push([7, 'Enter the tx hash to complete the lesson!', 'tx', null, null, `${getBeDomain()}/courses/verifyFirstTestnetTx`, null]);

    let query = getInsertQuery(columns, values, table);
    try {
        await DB.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}