export type UserCompletedLesson = {
    id: number;
    lesson_id: number;
    user_id: number;
    exp: number;
}

export const fillableColumns = [
    'id',
    'lesson_id',
    'user_id',
    'exp',
];