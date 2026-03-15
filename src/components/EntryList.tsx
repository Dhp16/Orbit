
'use client'

import { Entry, Contact } from '@/types';
import { EntryCard } from './EntryCard';
import { deleteEntry } from '@/lib/actions';

interface EntryListProps {
    entries: Entry[];
    contacts: Contact[];
}

export function EntryList({ entries, contacts }: EntryListProps) {
    return (
        <>
            {entries.map(entry => (
                <EntryCard
                    key={entry.id}
                    entry={entry}
                    contacts={contacts}
                    onDelete={async (id) => {
                        await deleteEntry(id);
                    }}
                />
            ))}
            {entries.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-gray-500">No entries yet. Add your first one!</p>
                </div>
            )}
        </>
    );
}
