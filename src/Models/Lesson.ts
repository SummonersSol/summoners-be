import { LessonPage } from "./LessonPage";

export type Lesson = {
    id: number;
    name: string;
    course_id: number;
    exp: number;
}

export type ProcessedLesson = Lesson & {
    pages: LessonPage[];
}

export const fillableColumns = [
    'id',
    'course_id',
    'name',
    'exp',
];