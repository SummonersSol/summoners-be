import { LessonPage } from "./LessonPage";

export type Lesson = {
    id: number;
    name: string;
    course_id: number;
    exp: number;
}

export type ProcessedLesson = Lesson & {
    total_pages: number;
    completed_pages: number;
}

export type LessonWithPages = Lesson & {
    pages: LessonPage[];
    last_completed_page: number;
}

export const fillableColumns = [
    'id',
    'course_id',
    'name',
    'exp',
];