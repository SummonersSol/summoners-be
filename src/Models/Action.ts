export type Action = {
    id: number;
    lesson_page_id: number;
    markdown: string;
    type: ActionType; 
    code?: string;
    options?: string;
    tx_verify_url?: string;
    cta_url?: string;
}

export type ActionType = 'tx' | 'cta' | 'select' | 'code';

export const fillableColumns = [
    'id',
    'name',
    'description',
    'exp',
];