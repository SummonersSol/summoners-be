export type Course = {
    id: number;
    name: string;
    description: string;
    exp: number;
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
    'exp',
];