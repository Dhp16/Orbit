
'use client'

import { Contact } from '@/types';
import { useState } from 'react';

export function ContactCard({ contact, onAddNote }: { contact: Contact; onAddNote: (id: string, note: string) => void }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');

    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300">
            <div className="flex justify-between items-start" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <h3 className="text-xl font-semibold text-white">{contact.name}</h3>
                    {contact.email && <p className="text-gray-400 text-sm mt-1">{contact.email}</p>}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {contact.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full border border-purple-500/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-6 space-y-4 pt-4 border-t border-white/10">
                    <div className="space-y-3">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Notes</h4>
                        {contact.notes.length === 0 && <p className="text-sm text-gray-600 italic">No notes yet</p>}
                        {contact.notes.map(note => (
                            <div key={note.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                <p className="text-gray-300 text-sm leading-relaxed">{note.content}</p>
                                <div className="text-xs text-gray-600 mt-2">{new Date(note.createdAt).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 relative">
                        <input
                            type="text"
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Add a quick note..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && noteDraft.trim()) {
                                    onAddNote(contact.id, noteDraft);
                                    setNoteDraft('');
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                if (noteDraft.trim()) {
                                    onAddNote(contact.id, noteDraft);
                                    setNoteDraft('');
                                }
                            }}
                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
