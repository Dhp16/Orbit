import fs from 'fs/promises';
import path from 'path';
import { Contact, StorageData } from '@/types';

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
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is invalid, return empty state
        return { contacts: [] };
    }
}

async function writeData(data: StorageData): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export const storage = {
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

    // Helper to add note directly
    addNote: async (contactId: string, content: string): Promise<void> => {
        const data = await readData();
        const contact = data.contacts.find(c => c.id === contactId);
        if (contact) {
            const newNote = {
                id: crypto.randomUUID(),
                content,
                createdAt: new Date().toISOString()
            };
            contact.notes.unshift(newNote); // Newest first
            contact.updatedAt = new Date().toISOString();
            await writeData(data);
        }
    }
};
