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

    // People mentioned who weren't in Orbit yet (tapped "add" on a suggestion): create them, then tag them
    let newPeople: { name: string; email?: string }[] = [];
    try { newPeople = JSON.parse((formData.get('newPeople') as string) || '[]'); } catch {}
    if (newPeople.length) {
        const existing = await storage.getContacts(userEmail);
        for (const p of newPeople.slice(0, 10)) {
            const name = String(p.name ?? '').trim().slice(0, 80);
            if (!name) continue;
            const match = existing.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (match) { contactIds.push(match.id); continue; }
            const contact: Contact = { id: crypto.randomUUID(), name, email: p.email || undefined, createdAt: new Date().toISOString() };
            await storage.saveContact(userEmail, contact);
            existing.push(contact);
            contactIds.push(contact.id);
        }
    }
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

// ── People you know who aren't in Orbit yet ───────────
// Read-only list used only for suggestions. For now it's read from data/<user>.directory.json;
// the plan is to fill it from Google Contacts (read-only) when signed in with Google.
export async function getDirectory(): Promise<{ name: string; email?: string }[]> {
    const userEmail = await checkAuth();
    if (!userEmail) return [];
    return storage.getDirectory(userEmail);
}
