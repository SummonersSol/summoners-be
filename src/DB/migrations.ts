export default [
    {
        name: "initial_migration",
        query: `
            CREATE TABLE migrations (
                id serial PRIMARY KEY,
                name text UNIQUE not null,
                migration_group int not null,
                migrated_at timestamp not null
            );`,
        rollback_query: `DROP TABLE migrations;`
    },
    {
        name: "create_users_table",
        query: `
            CREATE TABLE users (
                id serial PRIMARY KEY,
                name text not null,
                address text unique not null,
                profile_picture text null,
                exp integer not null default(0),
                created_at timestamp default(current_timestamp) not null,
                last_connected_at timestamp default(current_timestamp) not null
            );`,
        rollback_query: `DROP TABLE users;`
    },

    // courses
    {
        name: "create_courses_table",
        query: `
            CREATE TABLE courses (
                id serial PRIMARY KEY,
                name text not null,
                exp integer not null default(0)
            );`,
        rollback_query: `DROP TABLE courses;`
    },
    {
        name: "create_lessons_table",
        query: `
            CREATE TABLE lessons (
                id serial PRIMARY KEY,
                course_id integer not null,
                name text not null
            );`,
        rollback_query: `DROP TABLE lessons;`
    },
    {
        name: "create_lesson_pages_table",
        query: `
            CREATE TABLE lesson_pages (
                id serial PRIMARY KEY,
                lesson_id integer not null,
                markdown text -- nullable for actions only pages
            );`,
        rollback_query: `DROP TABLE lesson_pages;`
    },
    {
        // pivot table for user's last page for each lesson
        name: "create_user_completed_lessons_table",
        query: `
            CREATE TABLE user_completed_lessons (
                id serial PRIMARY KEY,
                user_id integer not null,
                lesson_id integer not null
            );`,
        rollback_query: `DROP TABLE user_completed_lessons;`
    },
    {
        // pivot table for user's last page for each lesson
        name: "create_user_last_pages_table",
        query: `
            CREATE TABLE user_last_pages (
                id serial PRIMARY KEY,
                user_id integer not null,
                lesson_id integer not null,
                lesson_page_id integer not null
            );`,
        rollback_query: `DROP TABLE user_last_pages;`
    },
    {
        name: "create_actions_table",
        query: `
            CREATE TYPE action_type AS ENUM ('tx', 'cta', 'select', 'code');
            CREATE TABLE actions (
                id serial PRIMARY KEY,
                lesson_page_id integer not null,
                markdown text not null,
                type action_type not null,
                code text, -- for code mode
                options json, -- for question select mode
                tx_verify_url text, -- to confirm transactions
                cta_url text -- for call to actions
            );`,
        rollback_query: `DROP TABLE actions;`
    },

    // game
    {
        name: "create_monster_base_metadata_table",
        query: `
            CREATE TABLE monster_base_metadata (
                id serial PRIMARY KEY,
                element_id int not null,
                name text not null,
                img_file text not null,
                shiny_img_file text not null,
                shiny_chance real not null default 0.1 check (shiny_chance >= 0),
                base_attack real not null default 0,
                max_attack real not null default 0,
                base_defense real not null default 0,
                max_defense real not null default 0,
                base_hp real not null default 0,
                max_hp real not null default 0,
                base_crit_chance real not null default 0,
                max_crit_chance real not null default 0,
                base_crit_multiplier real not null default 0,
                max_crit_multiplier real not null default 0
            );`,
        rollback_query: `DROP TABLE monster_base_metadata;`
    },
    {
        name: "create_monster_skills_table",
        query: `
            CREATE TABLE monster_skills (
                id serial PRIMARY KEY,
                element_id int not null,
                effect_id int not null,
                name varchar(255) not null,
                hits int not null default 1 check(hits >= 1),
                accuracy real not null default 95 check(accuracy >= 0),
                cooldown real not null default 5 check(cooldown >= 0),
                multiplier real not null default 1 check(multiplier >= 0)
            );`,
        rollback_query: `DROP TABLE monster_skills;`
    },
    {
        name: "create_monster_skill_effects_table",
        query: `
            CREATE TABLE monster_skill_effects (
                id serial PRIMARY KEY,
                asset_file varchar(255)
            );`,
        rollback_query: `DROP TABLE monster_skill_effects;`
    },
    {
        name: "create_elements_table",
        query: `
            CREATE TABLE elements (
                id serial PRIMARY KEY,
                name varchar(50) not null,
                icon_file varchar(50) not null
            );`,
        rollback_query: `DROP TABLE elements;`
    },
    {
        name: "create_monsters_table",
        query: `
            CREATE TABLE monsters (
                id serial PRIMARY KEY,
                monster_base_metadata_id int not null,
                attack real not null check (attack >= 0),
                defense real not null check (defense >= 0),
                hp real not null check (hp >= 0),
                crit_chance real not null default 0 check (crit_chance >= 0),
                crit_multiplier real not null default 0 check (crit_multiplier >= 1),
                is_shiny boolean not null default false
            );`,
        rollback_query: `DROP TABLE monsters;`
    },
    {
        name: "create_areas_table",
        query: `
            CREATE TABLE areas (
                id serial PRIMARY KEY,
                name varchar(255) not null
            );`,
        rollback_query: `DROP TABLE areas;`
    },
    {
        name: "create_area_monsters_table",
        query: `
            CREATE TABLE area_monsters (
                id serial PRIMARY KEY,
                monster_base_metadata_id int not null,
                area_id int not null,
                stat_modifier real not null default 1
            );`,
        rollback_query: `DROP TABLE area_monsters;`
    },
    {
        name: "create_element_multipliers_table",
        query: `
            CREATE TABLE element_multipliers (
                id serial PRIMARY KEY,
                element_id int not null,
                target_element_id int not null,
                multiplier real not null default 1
            );`,
        rollback_query: `DROP TABLE element_multipliers;`
    },

    //Rosters
    {
        name: "create_player_monsters_table",
        query: `
            CREATE TABLE player_monsters (
                id serial PRIMARY KEY,
                user_id integer not null,
                monster_id int not null,
                equipped boolean not null default(false)
            );`,
        rollback_query: `DROP TABLE player_monsters;`
    },
    {
        name: "create_player_monster_indexes",
        query: `CREATE INDEX player_monsters_user_id_idx ON player_monsters (user_id);`,
        rollback_query: `DROP INDEX player_monsters_user_id_idx;`
    },
    {
        name: "create_monster_equipped_skills_table",
        query: `
            CREATE TABLE monster_equipped_skills (
                id serial PRIMARY KEY,
                monster_id int not null,
                monster_skill_id int not null
            );`,
        rollback_query: `DROP TABLE monster_equipped_skills;`
    },
    {
        name: "create_monster_equipped_skills_indexes",
        query: `CREATE INDEX monster_equipped_skills_monster_idx ON player_monsters (monster_id);`,
        rollback_query: `DROP INDEX monster_equipped_skills_monster_idx;`
    },
    {
        name: "create_pve_battles_table",
        query: `
            CREATE TABLE pve_battles (
                id serial PRIMARY KEY,
                user_id integer not null,
                status smallint not null default 0,
                time_start timestamp not null,
                time_end timestamp
            );`,
        rollback_query: `DROP TABLE pve_battles;`
    },
    {
        name: "create_pve_battle_indexes",
        query: `CREATE INDEX pve_battles_user_id_idx ON pve_battles (user_id);`,
        rollback_query: `DROP INDEX pve_battles_user_id_idx;`
    },
    {
        name: "create_pve_battle_encounters_table",
        query: `
            CREATE TABLE pve_battle_encounters (
                id serial PRIMARY KEY,
                type smallint not null,
                pve_battle_id int not null,
                monster_base_metadata_id int not null,
                attack real not null,
                defense real not null,
                hp real not null,
                hp_left real not null,
                crit_chance real not null,
                crit_multiplier real not null,
                is_shiny boolean not null,
                is_captured boolean not null default false
            );`,
        rollback_query: `DROP TABLE pve_battle_encounters;`
    },
    {
        name: "create_battle_id_indexes",
        query: `
            CREATE INDEX pve_battle_encounters_pve_battle_id_idx ON pve_battle_encounters (pve_battle_id);
            CREATE INDEX pve_battle_encounters_monster_base_metadata_id_idx ON pve_battle_encounters (monster_base_metadata_id);
            CREATE INDEX pve_battle_encounters_is_captured_idx ON pve_battle_encounters (is_captured);
        `,
        rollback_query: `
            DROP INDEX pve_battle_encounters_pve_battle_id_idx;
            DROP INDEX pve_battle_encounters_monster_base_metadata_id_idx;
            DROP INDEX pve_battle_encounters_is_captured_idx;
        `
    },
    {
        name: "create_pve_battle_player_skills_used_table",
        query: `
            CREATE TABLE pve_battle_player_skills_used (
                id serial PRIMARY KEY,
                pve_battle_id int not null,
                skill_id int not null,
                monster_id int not null,
                total_damage_dealt real not null,
                crit_damage_dealt real not null,
                hits int not null,
                misses int not null
            );`,
        rollback_query: `DROP TABLE pve_battle_player_skills_used;`
    },
    {
        name: "create_pve_battle_player_skills_used_indexes",
        query: `
            CREATE INDEX pve_battle_player_skills_used_pve_battle_id_idx ON pve_battle_player_skills_used (pve_battle_id);
            CREATE INDEX pve_battle_player_skills_used_skill_id_idx ON pve_battle_player_skills_used (skill_id);
            CREATE INDEX pve_battle_player_skills_used_monster_id_idx ON pve_battle_player_skills_used (monster_id);
        `,
        rollback_query: `
            DROP INDEX pve_battle_player_skills_used_pve_battle_id_idx;
            DROP INDEX pve_battle_player_skills_used_skill_id_idx;
            DROP INDEX pve_battle_player_skills_used_monster_id_idx;
        `
    },
    {
        name: "create_player_locations_table",
        query: `
            CREATE TABLE player_locations (
                id serial PRIMARY KEY,
                user_id integer not null,
                area_id int not null default 1
            );`,
        rollback_query: `DROP TABLE player_locations;`
    },
    {
        name: "add_icon_file_to_monster_skills",
        query: `
            ALTER TABLE monster_skills ADD icon_file text not null default ''`,
        rollback_query: `ALTER TABLE monster_skills DROP COLUMN icon_file;`
    },
    {
        name: "add_created_at_to_monsters",
        query: `ALTER TABLE monsters ADD created_at timestamp default current_timestamp`,
        rollback_query: `ALTER TABLE monsters DROP COLUMN created_at;`
    },
    {
        name: "add_created_at_to_monster_equipped_skills",
        query: `ALTER TABLE monster_equipped_skills ADD created_at timestamp default current_timestamp`,
        rollback_query: `ALTER TABLE monster_equipped_skills DROP COLUMN created_at;`
    },
    {
        name: "add_crits_and_total_cooldown_to_pve_battle_player_skills",
        query: `ALTER TABLE pve_battle_player_skills_used ADD crits int default 0;
                ALTER TABLE pve_battle_player_skills_used ADD total_cooldown int default 0;`,
        rollback_query: `ALTER TABLE pve_battle_player_skills_used DROP COLUMN crits;
                         ALTER TABLE pve_battle_player_skills_used DROP COLUMN total_cooldown;`
    },
    {
        name: "add_created_at_to_player_monsters",
        query: `ALTER TABLE player_monsters ADD created_at timestamp default current_timestamp`,
        rollback_query: `ALTER TABLE player_monsters DROP COLUMN created_at;`
    },


    // for better logging
    {
        name: "create_logs_table",
        query: `
            CREATE TABLE logs (
                id serial PRIMARY KEY,
                created_at timestamp default current_timestamp not null,
                file text not null,
                function text not null,
                log text not null
            );
            CREATE INDEX logs_created_at_idx ON logs(created_at);
        `,
        rollback_query: `
            DROP INDEX logs_created_at_idx;
            DROP TABLE logs;
        `,
    },
]