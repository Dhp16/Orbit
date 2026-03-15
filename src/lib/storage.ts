import fs from 'fs/promises';
import path from 'path';
import { Contact, Entry, StorageData } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'contacts.json');

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function readData(): Promise<StorageData> {
    await ensureDataDir();
    try {
        const data = await fs.readFile(FILE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        // Ensure both arrays exist for backward compat
        return {
            contacts: parsed.contacts ?? [],
            entries: parsed.entries ?? [],
        };
    } catch (error) {
        return { contacts: [], entries: [] };
    }
}

async function writeData(data: StorageData): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export const storage = {
    // ── Contacts ──────────────────────────────────────────
    getContacts: async (): Promise<Contact[]> => {
        const data = await readData();
        return data.contacts;
    },

    getContact: async (id: string): Promise<Contact | undefined> => {
        const data = await readData();
        return data.contacts.find((c) => c.id === id);
    },

    saveContact: async (contact: Contact): Promise<void> => {
        const data = await readData();
        const index = data.contacts.findIndex((c) => c.id === contact.id);

        if (index >= 0) {
            data.contacts[index] = contact;
        } else {
            data.contacts.push(contact);
        }

        await writeData(data);
    },

    deleteContact: async (id: string): Promise<void> => {
        const data = await readData();
        data.contacts = data.contacts.filter((c) => c.id !== id);
        await writeData(data);
    },

    // ── Entries ───────────────────────────────────────────
    getEntries: async (): Promise<Entry[]> => {
        const data = await readData();
        return data.entries;
    },

    addEntry: async (content: string, contactIds: string[], tags: string[]): Promise<void> => {
        const data = await readData();
        const newEntry: Entry = {
            id: crypto.randomUUID(),
            content,
            contactIds,
            tags,
            createdAt: new Date().toISOString(),
        };
        data.entries.unshift(newEntry); // Newest first
        await writeData(data);
    },

    deleteEntry: async (id: string): Promise<void> => {
        const data = await readData();
        data.entries = data.entries.filter((e) => e.id !== id);
        await writeData(data);
    },
};
