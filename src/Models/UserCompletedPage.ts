export type UserCompletedPage = {
    id: number;
    user_id: number;
    lesson_page_id: number;
}

export const fillableColumns = [
    'id',
    'user_id',
    'lesson_page_id',
];