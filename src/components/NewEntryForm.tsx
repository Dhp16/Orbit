
'use client'

import { useState } from 'react';
import { Contact } from '@/types';
import { createEntry } from '@/lib/actions';

export function NewEntryForm({ contacts }: { contacts: Contact[] }) {
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [showPeoplePicker, setShowPeoplePicker] = useState(false);
    const [peopleSearch, setPeopleSearch] = useState('');

    const togglePerson = (id: string) => {
        setSelectedPeople(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const availableContacts = contacts.filter(c =>
        !selectedPeople.includes(c.id) &&
        (!peopleSearch.trim() || c.name.toLowerCase().includes(peopleSearch.toLowerCase()))
    );

    return (
        <form
            action={async (formData: FormData) => {
                formData.set('contactIds', selectedPeople.join(','));
                await createEntry(formData);
                setSelectedPeople([]);
                setShowPeoplePicker(false);
                setPeopleSearch('');
                // Reset form fields
                const form = document.getElementById('entry-form') as HTMLFormElement;
                form?.reset();
            }}
            id="entry-form"
            className="space-y-4"
        >
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                    What&apos;s on your mind?
                </label>
                <textarea
                    name="content"
                    required
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                    placeholder="Met with Sarah about the Q2 roadmap..."
                />
            </div>

            {/* People Tagger */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                    Tag People
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedPeople.map(id => {
                        const person = contacts.find(c => c.id === id);
                        if (!person) return null;
                        return (
                            <span
                                key={id}
                                className="px-2.5 py-1 bg-blue-500/20 text-blue-200 text-xs rounded-full border border-blue-500/20 flex items-center gap-1 cursor-pointer hover:bg-blue-500/30 transition-colors"
                                onClick={() => togglePerson(id)}
                            >
                                <span className="text-blue-400">@</span>{person.name}
                                <span className="text-blue-400 ml-1">×</span>
                            </span>
                        );
                    })}
                </div>
                {contacts.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { setShowPeoplePicker(!showPeoplePicker); setPeopleSearch(''); }}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        {showPeoplePicker ? 'Hide' : '+ Tag someone'}
                    </button>
                )}
                {showPeoplePicker && (
                    <div className="mt-2 bg-black/50 border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-2 border-b border-white/5">
                            <input
                                type="text"
                                value={peopleSearch}
                                onChange={(e) => setPeopleSearch(e.target.value)}
                                placeholder="Search people..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                autoFocus
                            />
                        </div>
                        <div className="p-2 max-h-32 overflow-y-auto space-y-1">
                            {availableContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    type="button"
                                    onClick={() => togglePerson(contact.id)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {contact.name}
                                </button>
                            ))}
                            {availableContacts.length === 0 && (
                                <p className="text-xs text-gray-600 px-3 py-2">
                                    {peopleSearch ? 'No matches' : 'Everyone is tagged'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Tags */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                    Tags
                </label>
                <input
                    type="text"
                    name="tags"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    placeholder="project, idea, follow-up (comma separated)"
                />
            </div>

            <button
                type="submit"
                className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
                Add Entry
            </button>
        </form>
    );
}
