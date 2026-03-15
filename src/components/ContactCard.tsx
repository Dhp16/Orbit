
'use client'

import { Contact, Entry } from '@/types';

interface ContactCardProps {
    contact: Contact;
    entryCount?: number;
    onClick?: () => void;
}

export function ContactCard({ contact, entryCount = 0, onClick }: ContactCardProps) {
    return (
        <div
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-semibold text-white">{contact.name}</h3>
                    {contact.email && <p className="text-gray-400 text-sm mt-1">{contact.email}</p>}
                </div>
                <div className="flex items-center gap-3">
                    {entryCount > 0 && (
                        <span className="px-2.5 py-1 bg-blue-500/20 text-blue-200 text-xs rounded-full border border-blue-500/20">
                            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                        </span>
                    )}
                    <span className="text-xs text-gray-600">
                        {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
