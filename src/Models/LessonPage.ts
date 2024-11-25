import { Action } from "./Action";

export type LessonPage = {
    id: number;
    lesson_id: number;
    markdown: string;
}

export type ProcessedLessonPage = LessonPage & {
    actions: Action[];
}

export const fillableColumns = [
    'id',
    'lesson_id',
    'markdown',
];