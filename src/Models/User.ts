export type User = {
    id: number;
    address: string;
    last_connected_at: string;
}

export const fillableColumns = [
    'id',
    'address',
    'last_connected_at',
];