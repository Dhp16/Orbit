'use server'

import { storage } from '@/lib/storage';
import { Contact } from '@/types';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const skipAuth = process.env.SKIP_AUTH === "true";

async function checkAuth() {
    if (skipAuth) return true;
    const session = await auth();
    return !!session;
}

// ── Contacts ──────────────────────────────────────────

export async function getContacts() {
    if (!await checkAuth()) return [];
    return storage.getContacts();
}

export async function createContact(formData: FormData) {
    if (!await checkAuth()) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name) return;

    const newContact: Contact = {
        id: crypto.randomUUID(),
        name,
        email: email || undefined,
        createdAt: new Date().toISOString(),
    };

    await storage.saveContact(newContact);
    revalidatePath('/dashboard');
}

export async function deleteContact(contactId: string) {
    if (!await checkAuth()) throw new Error('Unauthorized');

    await storage.deleteContact(contactId);
    revalidatePath('/dashboard');
}

// ── Entries ───────────────────────────────────────────

export async function getEntries() {
    if (!await checkAuth()) return [];
    return storage.getEntries();
}

export async function createEntry(formData: FormData) {
    if (!await checkAuth()) throw new Error('Unauthorized');

    const content = formData.get('content') as string;
    const contactIdsStr = formData.get('contactIds') as string;
    const tagsStr = formData.get('tags') as string;

    if (!content?.trim()) return;

    const contactIds = contactIdsStr
        ? contactIdsStr.split(',').map(id => id.trim()).filter(Boolean)
        : [];
    const tags = tagsStr
        ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    await storage.addEntry(content, contactIds, tags);
    revalidatePath('/dashboard');
}

export async function deleteEntry(entryId: string) {
    if (!await checkAuth()) throw new Error('Unauthorized');

    await storage.deleteEntry(entryId);
    revalidatePath('/dashboard');
}
