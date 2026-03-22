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
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEntries = useMemo(() => {
        if (!searchQuery.trim()) return entries;
        const q = searchQuery.toLowerCase();
        return entries.filter(e =>
            e.content.toLowerCase().includes(q) ||
            e.tags.some(t => t.toLowerCase().includes(q)) ||
            e.contactIds.some(cid => {
                const c = contacts.find(ct => ct.id === cid);
                return c?.name.toLowerCase().includes(q);
            })
        );
    }, [entries, searchQuery, contacts]);

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
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search entries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <EntryList entries={filteredEntries} contacts={contacts} />
                    </>
                )}
            </div>
        </div>
    );
}
