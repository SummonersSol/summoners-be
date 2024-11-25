import { formatDBParamsToStr, getInsertQuery, getRandomNumber, getUpsertQuery, } from "../../utils";
import DB from "../DB"
import _ from "lodash";
import { fillableColumns, User } from "../Models/User";
import { CourseCompletion } from "../Models/Course";
import * as LessonController from './LessonController';
import * as UserCompletedLessonController from './UserCompletedLessonController';
import * as UserCompletedPageController from './UserCompletedPageController';
const table = 'users';

// init entry for user
export const init = async() => { }

// create
export const create = async(insertParams: any) => {
    const filtered = _.pick(insertParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, { valueOnly: true });

    // put quote
    const insertColumns = Object.keys(filtered);

    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;
    const result = await DB.executeQueryForSingleResult<{ id: number }>(query);

    return result;
}

// view (single - id)
export const view = async(id: number) => {
    const query = `SELECT ${fillableColumns.join(",")} FROM ${table} WHERE id = ${id} LIMIT 1`;

    const result = await DB.executeQueryForSingleResult<User>(query);

    if(!result) {
      return undefined;
    }

    return result;
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}) => {
    const params = formatDBParamsToStr(whereParams, { separator: ' AND ', isSearch: true });
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const result = await DB.executeQueryForResults<User>(query);

    return result;
}

// list (all)
export const list = async() => {
    const query = `SELECT * FROM ${table} ORDER BY id desc`;

    const result = await DB.executeQueryForResults<User>(query);

    return result ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}) => {
    // filter
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered);

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

    return (await DB.executeQueryForSingleResult(query));
}

export const deleteById = async(id: number) => {
    const query = `DELETE FROM ${table} WHERE id = ${id}`;

    await DB.executeQueryForSingleResult(query);

    return;
}

// only allow user to find own profile
export const findByAddress = async(address: string) => {
    const params = formatDBParamsToStr({ address }, { separator: ' AND ', shouldLower: true, isSearch: true });

    const query = `SELECT * FROM ${table} WHERE ${params}`;

    let result = await DB.executeQueryForSingleResult<User>(query);

    if(!result) {
        return result;
    }

    return result;
}

export const completeLessonByAddress = async(address: string, lesson_id: number) => {
    let user = await findByAddress(address);
    if(!user) {
        return;
    }

    const findQuery = `select id from user_completed_lessons where user_id = ${user.id} and lesson_id = ${lesson_id}`;
    let result = await DB.executeQueryForSingleResult<{id: number}>(findQuery);
    if(result) {
        // already completed before
        return;
    }

    const lesson = await LessonController.simpleView(lesson_id);
    if(!lesson) {
        return;
    }

    await UserCompletedLessonController.create({ user_id: user.id, lesson_id, exp: lesson.exp });
    const updateQuery = `UPDATE users SET exp = exp + ${lesson.exp} WHERE id = ${user.id}`;
    await DB.executeQuery(updateQuery);

    // add monster
    let columns = ['user_id', 'monster_id', 'equipped'];
    let values: any[][] = [];

    let monsterId = getRandomNumber(1, 100, true);
    values.push([user.id, monsterId, 'false']);

    let query = getInsertQuery(columns, values, 'player_monsters');
    try {
        await DB.executeQuery(query);
        return true;
    }

    catch {
        return false;
    }
}

export const completePageByAddress = async(address: string, lesson_id: number, lesson_page_id: number) => {
    let user = await findByAddress(address);
    if(!user) {
        return;
    }

    let completedPage = await UserCompletedPageController.find({user_id: user.id, lesson_id, lesson_page_id});
    if(completedPage && completedPage.length > 0) {
        // already completed
        return;
    }

    await UserCompletedPageController.create({ lesson_page_id, lesson_id, user_id: user.id });
    return;
}

export const getLessonCompletionsByAddress = async(address: string, lesson_id: number) => {
    let user = await findByAddress(address);
    if(!user) {
        return [];
    }

    const query = `
        with user_pages as (
            select
                c.id as course_id,
                count(*) as completed_pages
            from lessons l
            join user_completed_pages p on p.lesson_id = l.id
            where p.user_id = ${user.id}
              and l.id = ${lesson_id}
        )
        select
            l.id,
            count(*) as total_pages,
            u.completed_pages
        from lessons l
        join lesson_pages p on p.lesson_id = l.id
        left join user_pages u on u.course_id = c.id
        group by l.id
        where u.id = ${user.id}
          and l.id = ${lesson_id}
    `;

    return (await DB.executeQueryForResults<CourseCompletion>(query)) ?? [];
}

export const getCourseCompletionsByAddress = async(address: string) => {
    let user = await findByAddress(address);
    if(!user) {
        return [];
    }

    const query = `
        with user_pages as (
            select
                c.id as course_id,
                count(*)::int as completed_pages
            from courses c
            join lessons l on l.course_id = c.id
            join lesson_pages p on p.lesson_id = l.id
            join user_completed_pages cp on cp.lesson_page_id = p.id
            where cp.user_id = ${user.id}
            group by c.id
        )
        select
            c.id,
            count(*)::int as total_pages,
            coalesce(u.completed_pages, 0) as completed_pages
        from courses c
        join lessons l on l.course_id = c.id
        join lesson_pages p on p.lesson_id = l.id
        left join user_pages u on u.course_id = c.id
        group by c.id, u.completed_pages
    `;

    return (await DB.executeQueryForResults<CourseCompletion>(query)) ?? [];
}