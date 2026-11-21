'use client'

import { Contact, Entry } from '@/types';
import { relativeDate, summarise } from '@/lib/suggest';

// Quick catch-up on one person or topic: the latest entries as bullets, then a link to all of them
export function SummaryCard({
    title, kind, entries, contacts, exclude, onSeeAll, onPick,
}: {
    title: string;
    kind: 'person' | 'topic';
    entries: Entry[];
    contacts: Contact[];
    exclude: { contactId?: string; tag?: string };
    onSeeAll: () => void;
    onPick: (label: string) => void;
}) {
    const s = summarise(entries, contacts, exclude);
    const accent = kind === 'person' ? 'text-blue-300' : 'text-purple-300';

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
                <h2 className={`text-xl font-semibold ${accent}`}>{kind === 'person' ? title : `#${title}`}</h2>
                <p className="text-xs text-gray-500 mt-1">
                    {s.count} {s.count === 1 ? 'entry' : 'entries'}
                    {s.last && <> · latest {relativeDate(s.last)}</>}
                    {s.first && s.count > 1 && <> · since {new Date(s.first).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</>}
                </p>
            </div>

            {s.count === 0 ? (
                <p className="text-sm text-gray-500">Nothing yet.</p>
            ) : (
                <ul className="space-y-2.5">
                    {s.bullets.map((b) => (
                        <li key={b.id} className="flex gap-2.5 text-sm leading-snug">
                            <span className={`${accent} mt-0.5`}>•</span>
                            <span className="text-gray-200">
                                {b.text} <span className="text-gray-600 text-xs whitespace-nowrap">· {relativeDate(b.createdAt)}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {s.alsoMentioned.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-gray-500 mr-1">Comes up with</span>
                    {s.alsoMentioned.map((m) => (
                        <button key={m.label} type="button" onClick={() => onPick(m.label)}
                            className={`px-2 py-0.5 rounded-full border ${m.label.startsWith('#') ? 'border-purple-500/30 text-purple-200' : 'border-blue-500/30 text-blue-200'}`}>
                            {m.label} <span className="text-gray-500">{m.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {s.count > s.bullets.length && (
                <button type="button" onClick={onSeeAll} className="w-full py-2.5 text-sm bg-white/10 rounded-xl hover:bg-white/15 transition-colors">
                    See all {s.count} entries ↓
                </button>
            )}
        </div>
    );
}
