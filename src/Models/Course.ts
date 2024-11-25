import { ProcessedLesson } from "./Lesson";

export type Course = {
    id: number;
    name: string;
    description: string;
}

export type CourseWithLessons = Course & {
    lessons: ProcessedLesson[];
}

export type ProcessedCourse = Course & {
    total_pages: number;
    completed_pages: number;
}

export type CourseCompletion = {
    id: number;
    total_pages: number;
    completed_pages: number;
};

export const fillableColumns = [
    'id',
    'name',
    'description',
];