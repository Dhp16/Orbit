'use server'

import { storage } from '@/lib/storage';
import { Contact } from '@/types';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const skipAuth = process.env.SKIP_AUTH === "true";

async function checkAuth(): Promise<string | null> {
    if (skipAuth) return "local";
    const session = await auth();
    return session?.user?.email || null;
}

// ── Contacts ──────────────────────────────────────────

export async function getContacts() {
    const userEmail = await checkAuth();
    if (!userEmail) return [];
    return storage.getContacts(userEmail);
}

export async function createContact(formData: FormData) {
    const userEmail = await checkAuth();
    if (!userEmail) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name) return;

    const newContact: Contact = {
        id: crypto.randomUUID(),
        name,
        email: email || undefined,
        createdAt: new Date().toISOString(),
    };

    await storage.saveContact(userEmail, newContact);
    revalidatePath('/dashboard');
}

export async function deleteContact(contactId: string) {
    const userEmail = await checkAuth();
    if (!userEmail) throw new Error('Unauthorized');

    await storage.deleteContact(userEmail, contactId);
    revalidatePath('/dashboard');
}

// ── Entries ───────────────────────────────────────────

export async function getEntries() {
    const userEmail = await checkAuth();
    if (!userEmail) return [];
    return storage.getEntries(userEmail);
}

export async function createEntry(formData: FormData) {
    const userEmail = await checkAuth();
    if (!userEmail) throw new Error('Unauthorized');

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

    await storage.addEntry(userEmail, content, contactIds, tags);
    revalidatePath('/dashboard');
}

export async function deleteEntry(entryId: string) {
    const userEmail = await checkAuth();
    if (!userEmail) throw new Error('Unauthorized');

    await storage.deleteEntry(userEmail, entryId);
    revalidatePath('/dashboard');
}
