
'use client'

import { Contact } from '@/types'
import { ContactCard } from './ContactCard'
import { addNote } from '@/lib/actions'

export function ContactList({ initialContacts }: { initialContacts: Contact[] }) {
    // In a real app, I'd implement client-side search filtering here using state
    return (
        <>
            {initialContacts.map(contact => (
                <ContactCard
                    key={contact.id}
                    contact={contact}
                    onAddNote={async (id, note) => {
                        await addNote(id, note);
                    }}
                />
            ))}
            {initialContacts.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-gray-500">No contacts yet. Add your first one!</p>
                </div>
            )}
        </>
    )
}
