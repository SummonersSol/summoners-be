import dotenv from 'dotenv';
import path from 'path';
import prompt from 'prompt-sync';
import { seedAreaMonsters, seedAreas, seedEffects, seedElementMultiplier, seedElements, seedMonsterMetadata, seedMonsterEquippedSkills, seedMonsters, seedMonsterSkills, seedPlayerEquippedMonsters, seedPlayers } from './src/Seeders';
import { isProduction } from './utils';

dotenv.config({ path: path.join(__dirname, '.env')});

(async() => {
    const yn = prompt({sigint: true})('Do you want to seed all tables? y/n\n');
    if(yn === 'y') {
        await seedMonsterMetadata();
        await seedMonsterSkills();
        await seedEffects();
        await seedAreas();
        await seedAreaMonsters();
        await seedElements();
        await seedElementMultiplier();
    
        //only seed these if in testnet
        if(!isProduction()){
            await seedMonsters();
            await seedMonsterEquippedSkills();
            await seedPlayers(JSON.parse(process.env.SEED_ADDRESSES!));
            await seedPlayerEquippedMonsters(JSON.parse(process.env.SEED_ADDRESSES!));
        }
        
        console.log('Seed ended, press CTRL / CMD + C');
    }
    return;
})();