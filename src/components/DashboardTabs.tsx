
'use client'

import { useState, useMemo } from 'react';
import { Contact, Entry } from '@/types';
import { EntryList } from './EntryList';
import { ContactCard } from './ContactCard';

interface DashboardTabsProps {
    entries: Entry[];
    contacts: Contact[];
}

export function DashboardTabs({ entries, contacts }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<'entries' | 'people'>('entries');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterByContactId, setFilterByContactId] = useState<string | null>(null);

    const filterContact = filterByContactId
        ? contacts.find(c => c.id === filterByContactId)
        : null;

    // Count entries per contact for badges
    const entryCountByContact = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const entry of entries) {
            for (const cid of entry.contactIds) {
                counts[cid] = (counts[cid] || 0) + 1;
            }
        }
        return counts;
    }, [entries]);

    // Filter entries
    const filteredEntries = useMemo(() => {
        let result = entries;

        if (filterByContactId) {
            result = result.filter(e => e.contactIds.includes(filterByContactId));
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(e =>
                e.content.toLowerCase().includes(q) ||
                e.tags.some(t => t.toLowerCase().includes(q)) ||
                e.contactIds.some(cid => {
                    const c = contacts.find(ct => ct.id === cid);
                    return c?.name.toLowerCase().includes(q);
                })
            );
        }

        return result;
    }, [entries, searchQuery, filterByContactId, contacts]);

    // Filter people
    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return contacts;
        const q = searchQuery.toLowerCase();
        return contacts.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        );
    }, [contacts, searchQuery]);

    const handlePersonClick = (contactId: string) => {
        setFilterByContactId(contactId);
        setActiveTab('entries');
        setSearchQuery('');
    };

    const clearFilter = () => {
        setFilterByContactId(null);
    };

    const displayedEntryCount = filterByContactId ? filteredEntries.length : entries.length;

    return (
        <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
                    <button
                        onClick={() => { setActiveTab('entries'); clearFilter(); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'entries'
                                ? 'bg-white text-black'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Entries <span className="text-xs opacity-60 ml-1">{displayedEntryCount}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('people'); clearFilter(); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'people'
                                ? 'bg-white text-black'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        People <span className="text-xs opacity-60 ml-1">{contacts.length}</span>
                    </button>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white w-64 focus:w-72 transition-all focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Active person filter banner */}
            {filterContact && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <span className="text-sm text-blue-200">
                        Showing entries for <span className="font-semibold">@{filterContact.name}</span>
                    </span>
                    <button
                        onClick={clearFilter}
                        className="ml-auto text-xs text-blue-400 hover:text-blue-200 transition-colors"
                    >
                        Show all
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {activeTab === 'entries' && (
                    <EntryList entries={filteredEntries} contacts={contacts} />
                )}
                {activeTab === 'people' && (
                    <>
                        {filteredContacts.map(contact => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                entryCount={entryCountByContact[contact.id] || 0}
                                onClick={() => handlePersonClick(contact.id)}
                            />
                        ))}
                        {filteredContacts.length === 0 && (
                            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-gray-500">
                                    {searchQuery ? 'No people match your search' : 'No contacts yet. Add your first one!'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
