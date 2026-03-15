export interface Contact {
    id: string;
    name: string;
    email?: string;
    createdAt: string;
}

export interface Entry {
    id: string;
    content: string;
    contactIds: string[]; // tagged people
    tags: string[];       // custom freeform tags
    createdAt: string;
}

export type StorageData = {
    contacts: Contact[];
    entries: Entry[];
};
