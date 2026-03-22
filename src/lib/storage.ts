import fs from 'fs/promises';
import path from 'path';
import { Contact, Entry, StorageData } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

const getFilePath = (userEmail: string) => path.join(DATA_DIR, `${userEmail}.json`);

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function readData(userEmail: string): Promise<StorageData> {
    await ensureDataDir();
    try {
        const filePath = getFilePath(userEmail);
        const data = await fs.readFile(filePath, 'utf-8');
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

async function writeData(userEmail: string, data: StorageData): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(getFilePath(userEmail), JSON.stringify(data, null, 2), 'utf-8');
}

export const storage = {
    // ── Contacts ──────────────────────────────────────────
    getContacts: async (userEmail: string): Promise<Contact[]> => {
        const data = await readData(userEmail);
        return data.contacts;
    },

    getContact: async (userEmail: string, id: string): Promise<Contact | undefined> => {
        const data = await readData(userEmail);
        return data.contacts.find((c) => c.id === id);
    },

    saveContact: async (userEmail: string, contact: Contact): Promise<void> => {
        const data = await readData(userEmail);
        const index = data.contacts.findIndex((c) => c.id === contact.id);

        if (index >= 0) {
            data.contacts[index] = contact;
        } else {
            data.contacts.push(contact);
        }

        await writeData(userEmail, data);
    },

    deleteContact: async (userEmail: string, id: string): Promise<void> => {
        const data = await readData(userEmail);
        data.contacts = data.contacts.filter((c) => c.id !== id);
        await writeData(userEmail, data);
    },

    // ── Entries ───────────────────────────────────────────
    getEntries: async (userEmail: string): Promise<Entry[]> => {
        const data = await readData(userEmail);
        return data.entries;
    },

    addEntry: async (userEmail: string, content: string, contactIds: string[], tags: string[]): Promise<void> => {
        const data = await readData(userEmail);
        const newEntry: Entry = {
            id: crypto.randomUUID(),
            content,
            contactIds,
            tags,
            createdAt: new Date().toISOString(),
        };
        data.entries.unshift(newEntry); // Newest first
        await writeData(userEmail, data);
    },

    deleteEntry: async (userEmail: string, id: string): Promise<void> => {
        const data = await readData(userEmail);
        data.entries = data.entries.filter((e) => e.id !== id);
        await writeData(userEmail, data);
    },
};
