import { Contact, Entry } from '@/types';

// Lightweight, offline tagging: suggest people and *existing* topics that the text mentions.
// No new topics are invented, so the topic list stays small.

const normalise = (s: string) =>
    s.toLowerCase()
        .replace(/[’']s\b/g, '')          // Sarah's -> sarah
        .replace(/[^a-z0-9à-ÿ]+/g, ' ')
        .trim();

// Rough stem so "running"/"runs"/"ran" style variants still match a topic like "run"
const stem = (w: string) =>
    w.length > 4 ? w.replace(/(ings|ing|ers|er|ies|es|ed|s)$/, '') : w;

export type PersonSuggestion = { id: string; sure: boolean }; // sure = pre-selected; otherwise one tap to add
export type Suggestions = { people: PersonSuggestion[]; tags: string[] };

export function suggestTags(text: string, contacts: Contact[], tags: string[]): Suggestions {
    const norm = ` ${normalise(text)} `;
    if (norm.trim().length < 2) return { people: [], tags: [] };
    const words = norm.trim().split(' ');
    const stems = new Set(words.map(stem));

    // People: full name is a sure match; a first name alone is sure only if nobody else shares it
    const firstNameCount = new Map<string, number>();
    for (const c of contacts) {
        const first = normalise(c.name).split(' ')[0];
        if (first) firstNameCount.set(first, (firstNameCount.get(first) ?? 0) + 1);
    }
    const people: PersonSuggestion[] = [];
    for (const c of contacts) {
        const full = normalise(c.name);
        if (!full) continue;
        const [first, ...rest] = full.split(' ');
        const last = rest.at(-1);
        if (norm.includes(` ${full} `)) people.push({ id: c.id, sure: true });
        else if (first.length >= 2 && norm.includes(` ${first} `)) people.push({ id: c.id, sure: firstNameCount.get(first) === 1 });
        else if (last && last.length >= 4 && norm.includes(` ${last} `)) people.push({ id: c.id, sure: false });
    }

    // Topics: the topic's words (or their stems) appear in the text
    const matchedTags = tags.filter((tag) => {
        const t = normalise(tag.replace(/[-_]/g, ' '));
        if (!t) return false;
        if (norm.includes(` ${t} `)) return true;
        const parts = t.split(' ');
        return parts.every((p) => stems.has(stem(p)));
    });

    return { people, tags: matchedTags };
}

// ── Summaries for the Read tab ─────────────────────────

// As much of the entry as fits in ~140 characters, ending at a sentence or word boundary
const firstSentence = (s: string, max = 140) => {
    const clean = s.replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max);
    const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    if (sentenceEnd > 60) return cut.slice(0, sentenceEnd + 1);
    return cut.slice(0, cut.lastIndexOf(' ')).trimEnd() + '…';
};

export type Summary = {
    count: number;
    first: string | null;
    last: string | null;
    bullets: { id: string; text: string; createdAt: string }[];
    alsoMentioned: { label: string; count: number }[];
};

// Latest entries as short bullets, plus who/what comes up alongside most often
export function summarise(entries: Entry[], contacts: Contact[], exclude: { contactId?: string; tag?: string }, limit = 5): Summary {
    const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const together = new Map<string, number>();
    for (const e of sorted) {
        for (const id of e.contactIds) {
            if (id === exclude.contactId) continue;
            const name = contacts.find((c) => c.id === id)?.name;
            if (name) together.set(name, (together.get(name) ?? 0) + 1);
        }
        for (const t of e.tags) if (t !== exclude.tag) together.set(`#${t}`, (together.get(`#${t}`) ?? 0) + 1);
    }
    return {
        count: sorted.length,
        last: sorted[0]?.createdAt ?? null,
        first: sorted.at(-1)?.createdAt ?? null,
        bullets: sorted.slice(0, limit).map((e) => ({ id: e.id, text: firstSentence(e.content), createdAt: e.createdAt })),
        alsoMentioned: [...together].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([label, count]) => ({ label, count })),
    };
}

export function relativeDate(iso: string, now = new Date()) {
    const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.round(days / 7)} wk ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── People not in Orbit yet ────────────────────────────

export type DirectoryPerson = { name: string; email?: string }; // e.g. from Google Contacts (read-only)
export type NewPersonSuggestion = DirectoryPerson & { source: 'google' | 'text'; sure: boolean };

const NOT_NAMES = new Set(
    ('monday tuesday wednesday thursday friday saturday sunday january february march april may june july august ' +
        'september october november december today tomorrow yesterday i im the a an we they he she it this that ' +
        'paris london google zoom slack uk us ok christmas easter').split(' '),
);

// Someone mentioned by name who isn't in Orbit: a Google contact if one matches, otherwise any
// "Firstname Lastname" in the text, offered as a new person (never added without a tap)
export function suggestNewPeople(text: string, contacts: Contact[], directory: DirectoryPerson[]): NewPersonSuggestion[] {
    const norm = ` ${normalise(text)} `;
    const known = new Set(contacts.map((c) => normalise(c.name)));
    const knownFirst = new Set(contacts.map((c) => normalise(c.name).split(' ')[0]));
    const out: NewPersonSuggestion[] = [];
    const seen = new Set<string>();
    const push = (p: NewPersonSuggestion) => {
        const key = normalise(p.name);
        if (!key || known.has(key) || seen.has(key)) return;
        seen.add(key);
        out.push(p);
    };

    // Google contacts: full name mentioned, or a first name that only one of them has (and nobody in Orbit has)
    const dirFirst = new Map<string, number>();
    for (const d of directory) {
        const f = normalise(d.name).split(' ')[0];
        dirFirst.set(f, (dirFirst.get(f) ?? 0) + 1);
    }
    for (const d of directory) {
        const full = normalise(d.name);
        const first = full.split(' ')[0];
        if (full.includes(' ') && norm.includes(` ${full} `)) push({ ...d, source: 'google', sure: true });
        else if (first.length >= 3 && !knownFirst.has(first) && dirFirst.get(first) === 1 && norm.includes(` ${first} `))
            push({ ...d, source: 'google', sure: false });
    }

    // Anything that looks like a full name in the text itself
    for (const m of text.matchAll(/\b([A-ZÀ-Ý][a-zà-ÿ'’-]+)\s+([A-ZÀ-Ý][a-zà-ÿ'’-]+)\b/g)) {
        const [first, last] = [m[1], m[2]];
        if (NOT_NAMES.has(first.toLowerCase()) || NOT_NAMES.has(last.toLowerCase())) continue;
        const name = `${first} ${last}`.replace(/[’']s$/, '');
        if (directory.some((d) => normalise(d.name) === normalise(name))) continue; // already offered above
        push({ name, source: 'text', sure: false });
    }
    return out;
}
