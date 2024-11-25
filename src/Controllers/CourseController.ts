import { formatDBParamsToStr, } from "../../utils";
import DB from "../DB"
import _ from "lodash";
import { fillableColumns, Course, ProcessedCourse } from "../Models/Course";
import { getLessonCompletionsByAddress } from "./UserController";
const table = 'courses';

// init entry for Course
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

    const result = await DB.executeQueryForSingleResult<Course>(query);

    if(!result) {
      return undefined;
    }

    return result;
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}) => {
    const params = formatDBParamsToStr(whereParams, { separator: ' AND ', isSearch: true });
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const result = await DB.executeQueryForResults<Course>(query);

    return result;
}

// list (all)
export const list = async(address: string) => {
    const query = `SELECT * FROM ${table} ORDER BY id asc`;

    const results = await DB.executeQueryForResults<Course>(query);
    if(!results) {
        return [];
    }

    let processed: ProcessedCourse[] = [];
    let courseCompletions = await getLessonCompletionsByAddress(address);
    for(const result of results) {
        let courseCompletion = courseCompletions.filter(x => x.id === result.id)[0];
        let p: ProcessedCourse = {
            ...result,
            total_pages: courseCompletion.total_pages,
            completed_pages: courseCompletion.completed_pages,
        }
        processed.push(p);
    }
    return processed;
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