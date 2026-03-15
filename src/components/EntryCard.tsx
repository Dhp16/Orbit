
'use client'

import { Entry, Contact } from '@/types';

interface EntryCardProps {
    entry: Entry;
    contacts: Contact[];
    onDelete: (id: string) => void;
}

export function EntryCard({ entry, contacts, onDelete }: EntryCardProps) {
    const taggedPeople = entry.contactIds
        .map(id => contacts.find(c => c.id === id))
        .filter(Boolean) as Contact[];

    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300 group">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>

            {(taggedPeople.length > 0 || entry.tags.length > 0) && (
                <div className="flex gap-2 mt-4 flex-wrap">
                    {taggedPeople.map(person => (
                        <span
                            key={person.id}
                            className="px-2.5 py-1 bg-blue-500/20 text-blue-200 text-xs rounded-full border border-blue-500/20 flex items-center gap-1"
                        >
                            <span className="text-blue-400">@</span>{person.name}
                        </span>
                    ))}
                    {entry.tags.map(tag => (
                        <span
                            key={tag}
                            className="px-2.5 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full border border-purple-500/20"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <span className="text-xs text-gray-600">
                    {new Date(entry.createdAt).toLocaleString()}
                </span>
                <button
                    onClick={() => onDelete(entry.id)}
                    className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
