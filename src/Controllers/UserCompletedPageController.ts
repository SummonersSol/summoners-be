import { formatDBParamsToStr, } from "../../utils";
import DB from "../DB"
import _ from "lodash";
import { fillableColumns, UserCompletedPage } from "../Models/UserCompletedPage";
const table = 'user_completed_pages';

// init entry for UserCompletedPage
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

    const result = await DB.executeQueryForSingleResult<UserCompletedPage>(query);

    if(!result) {
      return undefined;
    }

    return result;
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}) => {
    const params = formatDBParamsToStr(whereParams, { separator: ' AND ', isSearch: true });
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const result = await DB.executeQueryForResults<UserCompletedPage>(query);

    return result;
}

export const getLastPage = async(user_id: number, lesson_id: number) => {
    const query = `SELECT lesson_page_id FROM ${table} WHERE user_id = ${user_id} and lesson_id = ${lesson_id} order by id desc limit 1`;
    const result = await DB.executeQueryForSingleResult<{lesson_page_id: number}>(query);
    return result?.lesson_page_id ?? 0;
}

export const getCompletedPages = async(user_id: number, lesson_id: number) => {
    const query = `SELECT count(*)::int as completed_pages FROM ${table} WHERE user_id = ${user_id} and lesson_id = ${lesson_id}`;
    const result = await DB.executeQueryForSingleResult<{completed_pages: number}>(query);
    return result?.completed_pages ?? 0;
}


// list (all)
export const list = async() => {
    const query = `SELECT * FROM ${table} ORDER BY id desc`;

    const result = await DB.executeQueryForResults<UserCompletedPage>(query);

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