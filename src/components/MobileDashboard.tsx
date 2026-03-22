'use client'

import { useState, useMemo } from 'react';
import { Contact, Entry } from '@/types';
import { NewEntryForm } from './NewEntryForm';
import { EntryList } from './EntryList';
import { createContact } from '@/lib/actions';

interface Props {
    contacts: Contact[];
    entries: Entry[];
    allTags: string[];
}

export function MobileDashboard({ contacts, entries, allTags }: Props) {
    const [activeTab, setActiveTab] = useState<'write' | 'read'>('write');

    // Search / filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterContactIds, setFilterContactIds] = useState<string[]>([]);
    const [filterTags, setFilterTags] = useState<string[]>([]);

    const removeFilterContact = (id: string) => setFilterContactIds(prev => prev.filter(x => x !== id));
    const removeFilterTag = (tag: string) => setFilterTags(prev => prev.filter(x => x !== tag));

    // Suggestions: contacts and tags matching the current query, not already selected
    const q = searchQuery.trim().toLowerCase();
    const suggestedContacts = q
        ? contacts.filter(c => !filterContactIds.includes(c.id) && c.name.toLowerCase().includes(q))
        : [];
    const suggestedTags = q
        ? allTags.filter(t => !filterTags.includes(t) && t.toLowerCase().includes(q))
        : [];
    const hasSuggestions = suggestedContacts.length > 0 || suggestedTags.length > 0;

    const selectContact = (id: string) => {
        setFilterContactIds(prev => prev.includes(id) ? prev : [...prev, id]);
        setSearchQuery('');
    };
    const selectTag = (tag: string) => {
        setFilterTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
        setSearchQuery('');
    };

    const filteredEntries = useMemo(() => {
        let result = entries;

        if (filterContactIds.length > 0)
            result = result.filter(e => filterContactIds.every(id => e.contactIds.includes(id)));

        if (filterTags.length > 0)
            result = result.filter(e => filterTags.every(t => e.tags.includes(t)));

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
    }, [entries, searchQuery, filterContactIds, filterTags, contacts]);

    const hasFilters = filterContactIds.length > 0 || filterTags.length > 0 || searchQuery.trim();

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
            {/* Tab Bar */}
            <div className="sticky top-16 z-40 bg-black border-b border-white/10">
                <div className="flex max-w-2xl mx-auto w-full">
                    <button
                        onClick={() => setActiveTab('write')}
                        className={`flex-1 py-3.5 text-sm font-semibold tracking-widest uppercase transition-all ${
                            activeTab === 'write'
                                ? 'text-white border-b-2 border-white'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Write
                    </button>
                    <button
                        onClick={() => setActiveTab('read')}
                        className={`flex-1 py-3.5 text-sm font-semibold tracking-widest uppercase transition-all ${
                            activeTab === 'read'
                                ? 'text-white border-b-2 border-white'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Read
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
                {activeTab === 'write' && (
                    <>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="text-purple-400">✦</span> New Entry
                            </h2>
                            <NewEntryForm contacts={contacts} allTags={allTags} />
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="text-purple-400">+</span> New Person
                            </h2>
                            <form action={createContact} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Name</label>
                                    <input type="text" name="name" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" placeholder="Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                                    <input type="email" name="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" placeholder="jane@example.com" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors">
                                    Add to Orbit
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {activeTab === 'read' && (
                    <>
                        {/* Search + inline suggestions */}
                        <div className="relative">
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-purple-500/50 transition-all">
                                {/* Active filter chips */}
                                {(filterContactIds.length > 0 || filterTags.length > 0) && (
                                    <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
                                        {filterContactIds.map(id => {
                                            const person = contacts.find(c => c.id === id);
                                            if (!person) return null;
                                            return (
                                                <span
                                                    key={id}
                                                    onClick={() => removeFilterContact(id)}
                                                    className="px-2 py-0.5 bg-blue-500/20 text-blue-200 text-xs rounded-full border border-blue-500/20 flex items-center gap-1 cursor-pointer hover:bg-blue-500/30 transition-colors"
                                                >
                                                    <span className="text-blue-400">@</span>{person.name}
                                                    <span className="text-blue-400 ml-0.5">×</span>
                                                </span>
                                            );
                                        })}
                                        {filterTags.map(tag => (
                                            <span
                                                key={tag}
                                                onClick={() => removeFilterTag(tag)}
                                                className="px-2 py-0.5 bg-purple-500/20 text-purple-200 text-xs rounded-full border border-purple-500/20 flex items-center gap-1 cursor-pointer hover:bg-purple-500/30 transition-colors"
                                            >
                                                <span className="text-purple-400">#</span>{tag}
                                                <span className="text-purple-400 ml-0.5">×</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        placeholder={hasFilters ? 'Add another filter or search...' : 'Search entries, @people, #tags...'}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
                                        autoFocus
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="pr-3 text-gray-500 hover:text-white shrink-0"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Inline suggestions dropdown */}
                            {hasSuggestions && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-black border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
                                    {suggestedContacts.map(contact => (
                                        <button
                                            key={contact.id}
                                            type="button"
                                            onMouseDown={(e) => { e.preventDefault(); selectContact(contact.id); }}
                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                                        >
                                            <span className="text-blue-400 text-xs">@</span>
                                            <span className="text-blue-200">{contact.name}</span>
                                        </button>
                                    ))}
                                    {suggestedTags.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onMouseDown={(e) => { e.preventDefault(); selectTag(tag); }}
                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                                        >
                                            <span className="text-purple-400 text-xs">#</span>
                                            <span className="text-purple-200">{tag}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Clear all */}
                        {hasFilters && !searchQuery && (
                            <div className="flex justify-end -mt-3">
                                <button
                                    type="button"
                                    onClick={() => { setFilterContactIds([]); setFilterTags([]); setSearchQuery(''); }}
                                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        <EntryList entries={filteredEntries} contacts={contacts} />
                    </>
                )}
            </div>
        </div>
    );
}
