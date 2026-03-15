
'use client'

import { Contact } from '@/types'
import { ContactCard } from './ContactCard'

export function ContactList({ initialContacts }: { initialContacts: Contact[] }) {
    return (
        <>
            {initialContacts.map(contact => (
                <ContactCard
                    key={contact.id}
                    contact={contact}
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
