'use server'

import { storage } from '@/lib/storage';
import { Contact } from '@/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

const skipAuth = process.env.SKIP_AUTH === "true";

async function checkAuth() {
    if (skipAuth) return true;
    const session = await auth();
    return !!session;
}

export async function getContacts() {
    if (!await checkAuth()) return [];
    return storage.getContacts();
}

export async function createContact(formData: FormData) {
    if (!await checkAuth()) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const tagsStr = formData.get('tags') as string;

    if (!name) return;

    const newContact: Contact = {
        id: crypto.randomUUID(),
        name,
        email,
        tags: tagsStr ? tagsStr.split(',').map(t => t.trim()) : [],
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await storage.saveContact(newContact);
    revalidatePath('/dashboard');
}

export async function addNote(contactId: string, content: string) {
    if (!await checkAuth()) throw new Error('Unauthorized');

    await storage.addNote(contactId, content);
    revalidatePath('/dashboard');
}

export async function deleteContact(contactId: string) {
    if (!await checkAuth()) throw new Error('Unauthorized');

    await storage.deleteContact(contactId);
    revalidatePath('/dashboard');
}
