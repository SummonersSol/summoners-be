export type User = {
    id: number;
    address: string;
    exp: number;
    last_connected_at: string;
}

export const fillableColumns = [
    'id',
    'address',
    'exp',
    'last_connected_at',
];