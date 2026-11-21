import type { Contact, Entry } from '@/types';

// Lightweight, offline tagging: suggest people and *existing* topics that the text mentions.
// No new topics are invented, so the topic list stays small.

const normalise = (s: string) =>
    s.toLowerCase()
        .replace(/[’']s\b/g, '')          // Sarah's -> sarah
        .replace(/[^a-z0-9à-ÿ]+/g, ' ')
        .trim();

// Does a word in the text count as this topic word? Exact, or a simple plural/-ing/-ed form of it
const sameWord = (word: string, topic: string) => {
    if (word === topic) return true;
    if (topic.length < 3) return false;
    const base = topic.replace(/e$/, '');
    return [`${topic}s`, `${topic}es`, `${base}ing`, `${base}ed`, `${topic}ing`, `${topic}ed`].includes(word)
        || (topic.endsWith('y') && word === `${topic.slice(0, -1)}ies`);
};

export type PersonSuggestion = { id: string; sure: boolean }; // sure = pre-selected; otherwise one tap to add
// tags: the topic is written in the text (pre-selected). likelyTags: learned from past entries (one tap to add).
export type Suggestions = { people: PersonSuggestion[]; tags: string[]; likelyTags: string[] };

export function suggestTags(text: string, contacts: Contact[], tags: string[], learned?: TopicKeywords): Suggestions {
    const norm = ` ${normalise(text)} `;
    if (norm.trim().length < 2) return { people: [], tags: [], likelyTags: [] };
    const words = norm.trim().split(' ');

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
        // Multi-word topics need every word, in any form
        return t.split(' ').every((part) => words.some((w) => sameWord(w, part)));
    });

    // Topics implied by words that, in past entries, nearly always came with that topic
    const likely = new Map<string, number>();
    if (learned) for (const w of new Set(words)) {
        for (const tag of learned.get(w) ?? []) if (!matchedTags.includes(tag)) likely.set(tag, (likely.get(tag) ?? 0) + 1);
    }
    const likelyTags = [...likely].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

    return { people, tags: matchedTags, likelyTags };
}

// ── Learning topics from past entries ──────────────────

export type TopicKeywords = Map<string, string[]>; // word -> topics it signals

const COMMON = new Set(
    ('the a an and or but to of in on at for with from by about as is was were be been are it its this that these those ' +
        'i me my we our you your he she they them his her their there here then than so very just really also too not no ' +
        'had has have do did done get got go went going come came make made take took said say says one two three new old ' +
        'good great nice lot lots some more most all any each next last week today tomorrow yesterday time day night ' +
        'morning evening after before back over up down out off into still need needs want wants will would could should ' +
        'can like think thinking talked talk chat call quick long little big catch caught met meet asked told ' +
        'sent send sending plan plans planning thing things stuff bit maybe sure fine okay well again first final also').split(' '),
);

// A word teaches a topic if it showed up in at least `minEntries` entries and at least `minShare` of those had the topic.
// People's names are skipped so "Liam" doesn't become a topic signal.
export function learnTopicKeywords(entries: Entry[], contacts: Contact[], minEntries = 3, minShare = 0.75): TopicKeywords {
    const names = new Set(contacts.flatMap((c) => normalise(c.name).split(' ')));
    const seen = new Map<string, number>();
    const withTag = new Map<string, Map<string, number>>();
    for (const e of entries) {
        const words = new Set(normalise(e.content).split(' ').filter((w) => w.length >= 4 && !COMMON.has(w) && !names.has(w) && !/^\d+$/.test(w)));
        for (const w of words) {
            seen.set(w, (seen.get(w) ?? 0) + 1);
            for (const t of e.tags) {
                const m = withTag.get(w) ?? new Map<string, number>();
                m.set(t, (m.get(t) ?? 0) + 1);
                withTag.set(w, m);
            }
        }
    }
    const out: TopicKeywords = new Map();
    for (const [w, n] of seen) {
        if (n < minEntries) continue;
        const signals = [...(withTag.get(w) ?? [])].filter(([, k]) => k / n >= minShare).map(([t]) => t);
        if (signals.length) out.set(w, signals);
    }
    return out;
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
        // Most often first; on a tie, people before topics, then A–Z
        alsoMentioned: [...together]
            .sort((a, b) => b[1] - a[1] || Number(a[0].startsWith('#')) - Number(b[0].startsWith('#')) || a[0].localeCompare(b[0]))
            .slice(0, 4)
            .map(([label, count]) => ({ label, count })),
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

// Words that often start a sentence in a note, right before a name ("Met Pablo Hernandez…")
const STARTERS = new Set(
    ('met meet saw see called call rang texted emailed messaged spoke talked chatted asked told visited introduced ' +
        'lunch dinner coffee drinks breakfast with and also then just had dear thanks new happy').split(' '),
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

    // Anything that looks like a full name in the text itself: a run of capitalised words, minus a
    // sentence-starting word like "Met" or "Called" in front of it
    // A capitalised word with lower-case letters (Pablo, Jean-Luc), or O'Brien-style; not PB, UK, Q1
    const WORD = "[A-ZÀ-Ý](?:[a-zà-ÿ]+(?:['’-][A-ZÀ-Ýa-zà-ÿ]+)*|['’][A-ZÀ-Ý][a-zà-ÿ]+)";
    for (const m of text.matchAll(new RegExp(`\\b${WORD}(?:\\s+${WORD})+`, 'g'))) {
        let run = m[0].split(/\s+/);
        while (run.length && (STARTERS.has(run[0].toLowerCase()) || NOT_NAMES.has(run[0].toLowerCase()))) run = run.slice(1);
        if (run.length < 2) continue;
        const [first, last] = [run[0], run[1].replace(/[’']s$/, '')];
        if (NOT_NAMES.has(first.toLowerCase()) || NOT_NAMES.has(last.toLowerCase())) continue;
        const name = `${first} ${last}`;
        if (directory.some((d) => normalise(d.name) === normalise(name))) continue; // already offered above
        push({ name, source: 'text', sure: false });
    }
    return out;
}
