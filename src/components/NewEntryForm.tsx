'use client'

import { useMemo, useRef, useState } from 'react';
import { Contact, Entry } from '@/types';
import { createEntry } from '@/lib/actions';
import { DirectoryPerson, learnTopicKeywords, suggestNewPeople, suggestTags } from '@/lib/suggest';

// Type (or dictate) and press Save. People and existing topics mentioned in the text are tagged
// automatically; tap a chip to remove it, or tap a faded one to add it. Someone who isn't in Orbit
// yet is offered as "+ Add Name" (from Google Contacts if they're there).
export function NewEntryForm({ contacts, allTags, directory, entries }: { contacts: Contact[]; allTags: string[]; directory: DirectoryPerson[]; entries: Entry[] }) {
    const [content, setContent] = useState('');
    const [removed, setRemoved] = useState<Set<string>>(new Set()); // "p:id" / "t:tag" / "n:name" the user took off
    const [added, setAdded] = useState<Set<string>>(new Set());     // added by hand or by tapping a faded chip
    const [picker, setPicker] = useState<'none' | 'person' | 'topic'>('none');
    const [pickerSearch, setPickerSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const learned = useMemo(() => learnTopicKeywords(entries, contacts), [entries, contacts]);
    const suggestions = useMemo(() => suggestTags(content, contacts, allTags, learned), [content, contacts, allTags, learned]);
    const newPeople = useMemo(() => suggestNewPeople(content, contacts, directory), [content, contacts, directory]);

    const isOn = (key: string, auto: boolean) => added.has(key) || (auto && !removed.has(key));
    const toggle = (key: string, auto: boolean) => {
        const on = isOn(key, auto);
        setAdded((s) => { const n = new Set(s); if (on) n.delete(key); else n.add(key); return n; });
        setRemoved((s) => { const n = new Set(s); if (on && auto) n.add(key); else n.delete(key); return n; });
    };

    // Chips: suggestions first, then anything added by hand that the text doesn't mention
    const personChips = [
        ...suggestions.people.map((p) => ({ id: p.id, auto: p.sure })),
        ...[...added].filter((k) => k.startsWith('p:')).map((k) => k.slice(2))
            .filter((id) => !suggestions.people.some((p) => p.id === id)).map((id) => ({ id, auto: false })),
    ];
    const tagChips = [
        ...suggestions.tags.map((t) => ({ tag: t, auto: true })),
        ...suggestions.likelyTags.map((t) => ({ tag: t, auto: false })), // faded: one tap to add
        ...[...added].filter((k) => k.startsWith('t:')).map((k) => k.slice(2))
            .filter((t) => !suggestions.tags.includes(t) && !suggestions.likelyTags.includes(t)).map((t) => ({ tag: t, auto: false })),
    ];
    const selectedPeople = personChips.filter((c) => isOn(`p:${c.id}`, c.auto)).map((c) => c.id);
    const selectedTags = tagChips.filter((c) => isOn(`t:${c.tag}`, c.auto)).map((c) => c.tag);
    // New people are never added without a tap
    const peopleToCreate = newPeople.filter((p) => added.has(`n:${p.name}`));

    const q = pickerSearch.trim().toLowerCase();
    const pickablePeople = contacts.filter((c) => !selectedPeople.includes(c.id) && (!q || c.name.toLowerCase().includes(q)));
    const pickableTags = allTags.filter((t) => !selectedTags.includes(t) && (!q || t.includes(q)));
    const canCreateTag = picker === 'topic' && q && !allTags.includes(q) && !selectedTags.includes(q);

    const addByHand = (key: string) => {
        setAdded((s) => new Set(s).add(key));
        setRemoved((s) => { const n = new Set(s); n.delete(key); return n; });
        setPicker('none');
        setPickerSearch('');
    };

    const reset = () => {
        setContent('');
        setAdded(new Set());
        setRemoved(new Set());
        setPicker('none');
        setPickerSearch('');
        formRef.current?.reset();
    };

    const chip = 'px-2.5 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors';
    const nothingSpotted = personChips.length === 0 && tagChips.length === 0 && newPeople.length === 0;

    return (
        <form
            ref={formRef}
            action={async (formData: FormData) => {
                setSaving(true);
                formData.set('contactIds', selectedPeople.join(','));
                formData.set('tags', selectedTags.join(','));
                formData.set('newPeople', JSON.stringify(peopleToCreate.map(({ name, email }) => ({ name, email }))));
                await createEntry(formData);
                reset();
                setSaving(false);
            }}
            className="space-y-3"
        >
            <textarea
                name="content"
                required
                rows={6}
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                placeholder="What happened? e.g. Coffee with Sarah, she's starting the new job in March…"
            />

            {/* Auto tags */}
            <div className="min-h-8 flex flex-wrap items-center gap-1.5">
                {personChips.map(({ id, auto }) => {
                    const person = contacts.find((c) => c.id === id);
                    if (!person) return null;
                    const on = isOn(`p:${id}`, auto);
                    return (
                        <button key={`p${id}`} type="button" onClick={() => toggle(`p:${id}`, auto)}
                            className={`${chip} ${on ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' : 'border-dashed border-blue-500/30 text-blue-300/60'}`}>
                            <span className="text-blue-400">{on ? '@' : '+'}</span>{person.name}{on && <span className="text-blue-400/70 ml-0.5">×</span>}
                        </button>
                    );
                })}
                {newPeople.map((p) => {
                    const on = added.has(`n:${p.name}`);
                    return (
                        <button key={`n${p.name}`} type="button" onClick={() => toggle(`n:${p.name}`, false)}
                            className={`${chip} ${on ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'border-dashed border-emerald-500/40 text-emerald-300/80'}`}
                            title={p.source === 'google' ? 'From your Google contacts' : 'Not in Orbit yet'}>
                            <span className="text-emerald-400">{on ? '@' : '+ Add'}</span>{p.name}
                            {p.source === 'google' && !on && <span className="text-[10px] text-emerald-400/70 ml-0.5">G</span>}
                            {on && <span className="text-emerald-400/70 ml-0.5">new ×</span>}
                        </button>
                    );
                })}
                {tagChips.map(({ tag, auto }) => {
                    const on = isOn(`t:${tag}`, auto);
                    return (
                        <button key={`t${tag}`} type="button" onClick={() => toggle(`t:${tag}`, auto)}
                            className={`${chip} ${on ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' : 'border-dashed border-purple-500/30 text-purple-300/60'}`}>
                            <span className="text-purple-400">#</span>{tag}{on && <span className="text-purple-400/70 ml-0.5">×</span>}
                        </button>
                    );
                })}
                {nothingSpotted && (
                    <span className="text-xs text-gray-600">{content.trim() ? 'No people or topics spotted' : 'People and topics are tagged as you type'}</span>
                )}
                <span className="ml-auto flex gap-3 text-xs text-gray-500">
                    <button type="button" onClick={() => { setPicker(picker === 'person' ? 'none' : 'person'); setPickerSearch(''); }} className="hover:text-gray-300">+ person</button>
                    <button type="button" onClick={() => { setPicker(picker === 'topic' ? 'none' : 'topic'); setPickerSearch(''); }} className="hover:text-gray-300">+ topic</button>
                </span>
            </div>

            {picker !== 'none' && (
                <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-2 border-b border-white/5">
                        <input
                            type="text"
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (canCreateTag) addByHand(`t:${q}`); } }}
                            placeholder={picker === 'person' ? 'Search people…' : 'Search or create a topic…'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                            autoFocus
                        />
                    </div>
                    <div className="p-2 max-h-40 overflow-y-auto space-y-1">
                        {picker === 'topic' && canCreateTag && (
                            <button type="button" onClick={() => addByHand(`t:${q}`)} className="w-full text-left px-3 py-2 text-sm text-purple-300 hover:bg-white/10 rounded-lg">
                                + Create “{q}”
                            </button>
                        )}
                        {(picker === 'person' ? pickablePeople.map((c) => ({ key: `p:${c.id}`, label: c.name })) : pickableTags.map((t) => ({ key: `t:${t}`, label: `#${t}` })))
                            .slice(0, 30)
                            .map((o) => (
                                <button key={o.key} type="button" onClick={() => addByHand(o.key)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg">
                                    {o.label}
                                </button>
                            ))}
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={saving || !content.trim()}
                className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
                {saving ? 'Saving…' : 'Save'}
            </button>
        </form>
    );
}
