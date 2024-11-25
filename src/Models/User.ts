export type User = {
    id: number;
    name: string;
    address: string;
    exp: number;
    last_connected_at: string;
}

export const fillableColumns = [
    'id',
    'name',
    'address',
    'exp',
    'last_connected_at',
];