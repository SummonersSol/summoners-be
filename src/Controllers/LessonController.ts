import { formatDBParamsToStr, } from "../../utils";
import DB from "../DB"
import _ from "lodash";
import { fillableColumns, Lesson, LessonWithPages, ProcessedLesson } from "../Models/Lesson";
import * as LessonPageController from './LessonPageController';
import * as UserCompletedPageController from './UserCompletedPageController';
const table = 'lessons';

// init entry for Lesson
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
export const view = async(id: number, user_id: number) => {
    const query = `SELECT ${fillableColumns.join(",")} FROM ${table} WHERE id = ${id} LIMIT 1`;

    const result = await DB.executeQueryForSingleResult<Lesson>(query);

    if(!result) {
      return undefined;
    }

    let p: LessonWithPages = {
        ...result,
        pages: await LessonPageController.find({ lesson_id: result.id }),
        last_completed_page: await UserCompletedPageController.getLastPage(user_id, result.id),
    }

    return p;
}
export const simpleView = async(id: number) => {
    const query = `SELECT ${fillableColumns.join(",")} FROM ${table} WHERE id = ${id} LIMIT 1`;

    const result = await DB.executeQueryForSingleResult<Lesson>(query);
    return result;
}

// find (all match)
export const find = async(user_id: number, whereParams: {[key: string]: any}) => {
    const params = formatDBParamsToStr(whereParams, { separator: ' AND ', isSearch: true });
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const results = await DB.executeQueryForResults<Lesson>(query);
    if(!results) {
        return [];
    }

    let processed: ProcessedLesson[] = [];
    for(const result of results) {
        let p: ProcessedLesson = {
            ...result,
            total_pages: await LessonPageController.getLessonTotalPages(result.id),
            completed_pages: await UserCompletedPageController.getCompletedPages(user_id, result.id),
        }
        processed.push(p);
    }
    return processed;
}

// list (all)
export const list = async() => {
    const query = `SELECT * FROM ${table} ORDER BY id desc`;

    const result = await DB.executeQueryForResults<Lesson>(query);

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