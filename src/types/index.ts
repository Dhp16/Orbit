export interface Note {
    id: string;
    content: string;
    createdAt: string; // ISO date string
}

export interface Contact {
    id: string;
    name: string;
    email?: string;
    tags: string[];
    notes: Note[];
    createdAt: string;
    updatedAt: string;
}

export type StorageData = {
    contacts: Contact[];
};
