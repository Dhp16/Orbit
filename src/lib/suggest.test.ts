// Run with: npm test   (Node's built-in test runner; no extra dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { learnTopicKeywords, relativeDate, suggestNewPeople, suggestTags, summarise } from './suggest.ts';

const contact = (name: string, id = name) => ({ id, name, createdAt: '2026-01-01T00:00:00Z' });
const contacts = [
    contact('Sarah Mitchell'), contact('James Okafor'), contact('Sam Carter'),
    contact('Chris Doyle'), contact('Chris Watkins'), contact("Liam O'Brien"), contact('Zoë Laurent'),
];
const tags = ['work', 'running', 'wedding', 'house', 'travel', 'side-project', 'book club'];

const people = (text: string) => suggestTags(text, contacts, tags).people;
const sure = (text: string) => people(text).filter((p) => p.sure).map((p) => p.id);
const unsure = (text: string) => people(text).filter((p) => !p.sure).map((p) => p.id);
const topics = (text: string) => suggestTags(text, contacts, tags).tags;

// ── People already in Orbit ──────────────────────────

test('full name is a sure match', () => {
    assert.deepEqual(sure('Lunch with Sarah Mitchell today'), ['Sarah Mitchell']);
});

test('a unique first name is a sure match, any case', () => {
    assert.deepEqual(sure('lunch with SARAH'), ['Sarah Mitchell']);
    assert.deepEqual(sure('James called'), ['James Okafor']);
});

test("possessive still matches (Sarah's, Sarah’s)", () => {
    assert.deepEqual(sure("Dinner at Sarah's"), ['Sarah Mitchell']);
    assert.deepEqual(sure('Dinner at Sarah’s'), ['Sarah Mitchell']);
});

test('a shared first name is offered for both, pre-selecting neither', () => {
    assert.deepEqual(sure('Drinks with Chris'), []);
    assert.deepEqual(unsure('Drinks with Chris').sort(), ['Chris Doyle', 'Chris Watkins']);
});

test('full name picks the right one of two Chrises', () => {
    assert.deepEqual(sure('Drinks with Chris Watkins'), ['Chris Watkins']);
});

test('surname alone is offered but not pre-selected', () => {
    assert.deepEqual(unsure('Email from Okafor about the invoice'), ['James Okafor']);
});

test('names inside other words do not match', () => {
    assert.deepEqual(people('The same samples as last time'), []);
    assert.deepEqual(people('Christmas plans'), []);
});

test('apostrophes and accents in names', () => {
    assert.deepEqual(sure("Run with Liam O'Brien"), ["Liam O'Brien"]);
    assert.deepEqual(sure('Call with Zoë'), ['Zoë Laurent']);
});

test('several people in one entry', () => {
    assert.deepEqual(sure('Sarah, James and Sam came round').sort(), ['James Okafor', 'Sam Carter', 'Sarah Mitchell']);
});

test('empty or tiny text suggests nothing', () => {
    assert.deepEqual(suggestTags('', contacts, tags), { people: [], tags: [], likelyTags: [] });
    assert.deepEqual(suggestTags(' a ', contacts, tags), { people: [], tags: [], likelyTags: [] });
});

// ── Existing topics ──────────────────────────────────

test('topic word in the text', () => {
    assert.deepEqual(topics('Busy day at work'), ['work']);
});

test('topic variants: plurals and -ing forms', () => {
    assert.deepEqual(topics('Two weddings this summer'), ['wedding']);
    assert.deepEqual(topics('Went running by the river'), ['running']);
    assert.deepEqual(topics('Looked at houses in Kent'), ['house']);
});

test('multi-word and hyphenated topics', () => {
    assert.deepEqual(topics('Book club picked a new novel'), ['book club']);
    assert.deepEqual(topics('Spent the evening on my side project'), ['side-project']);
});

test('topics inside other words do not match', () => {
    assert.deepEqual(topics('Networking event, homework, housework'), []);
});

test('never invents a topic that does not exist', () => {
    assert.deepEqual(topics('Thinking about a new car and holidays'), []);
});

// ── People not in Orbit yet ──────────────────────────

const directory = [
    { name: 'Marco Bianchi', email: 'marco@example.com' },
    { name: 'Grace Kim', email: 'grace@example.com' },
    { name: 'Sarah Mitchell', email: 'sarah@example.com' }, // already in Orbit
];
const newPeople = (text: string) => suggestNewPeople(text, contacts, directory);

test('Google contact mentioned by full name', () => {
    const [p] = newPeople('Met Marco Bianchi for coffee');
    assert.equal(p.name, 'Marco Bianchi');
    assert.equal(p.source, 'google');
    assert.equal(p.email, 'marco@example.com');
});

test('Google contact mentioned by a unique first name', () => {
    assert.deepEqual(newPeople('Coffee with grace').map((p) => [p.name, p.source]), [['Grace Kim', 'google']]);
});

test('people already in Orbit are never offered as new', () => {
    assert.deepEqual(newPeople('Lunch with Sarah Mitchell'), []);
});

test('an unknown Firstname Lastname is offered as new', () => {
    assert.deepEqual(newPeople('Sarah introduced me to Pablo Hernandez').map((p) => [p.name, p.source]), [['Pablo Hernandez', 'text']]);
});

test('days, months and places are not people', () => {
    assert.deepEqual(newPeople('See you Monday March the 3rd in Paris'), []);
    assert.deepEqual(newPeople('Back from London Bridge'), []);
});

test('a capitalised word at the start of a sentence is not taken for a first name', () => {
    assert.deepEqual(newPeople('Met Pablo Hernandez at the gym. Called Grace Kim after.').map((p) => p.name).sort(), ['Grace Kim', 'Pablo Hernandez']);
});

test('abbreviations and O’Brien-style names', () => {
    assert.deepEqual(newPeople('New PB 21:40 at parkrun, then the UK Q1 report'), []);
    assert.deepEqual(newPeople("Drinks with Aoife O'Connor").map((p) => p.name), ["Aoife O'Connor"]);
    assert.deepEqual(newPeople("Run with Liam O'Brien"), []); // already in Orbit
});

test('possessive full names are cleaned up', () => {
    assert.deepEqual(newPeople("Went to Pablo Hernandez's vineyard").map((p) => p.name), ['Pablo Hernandez']);
});

// ── Summaries ────────────────────────────────────────

const entry = (id: string, content: string, createdAt: string, contactIds: string[] = [], tags: string[] = []) => ({ id, content, createdAt, contactIds, tags });

test('summary: newest first, 5 bullets, counts and dates', () => {
    const entries = Array.from({ length: 8 }, (_, i) => entry(`e${i}`, `Entry ${i}.`, `2026-11-0${i + 1}T10:00:00Z`, ['Sarah Mitchell']));
    const s = summarise(entries, contacts, { contactId: 'Sarah Mitchell' });
    assert.equal(s.count, 8);
    assert.deepEqual(s.bullets.map((b) => b.id), ['e7', 'e6', 'e5', 'e4', 'e3']);
    assert.equal(s.last, '2026-11-08T10:00:00Z');
    assert.equal(s.first, '2026-11-01T10:00:00Z');
});

test('summary: long entries are trimmed at a sentence or word', () => {
    const long = 'Dinner at Liam’s. Talked about the wedding seating plan and the boat tour on the Friday, then a very long tangent about which train to take back that went on and on.';
    const [b] = summarise([entry('x', long, '2026-11-01T00:00:00Z')], contacts, {}).bullets;
    assert.ok(b.text.length <= 141, `too long: ${b.text.length}`);
    assert.ok(b.text.endsWith('.') || b.text.endsWith('…'));
    assert.ok(b.text.startsWith('Dinner at Liam’s. Talked about the wedding'));
});

test('summary: "comes up with" excludes the person or topic itself', () => {
    const entries = [
        entry('a', 'x', '2026-11-01T00:00:00Z', ['Sarah Mitchell', 'James Okafor'], ['wedding']),
        entry('b', 'y', '2026-11-02T00:00:00Z', ['Sarah Mitchell'], ['wedding', 'travel']),
    ];
    const s = summarise(entries, contacts, { contactId: 'Sarah Mitchell' });
    assert.deepEqual(s.alsoMentioned.map((m) => [m.label, m.count]), [['#wedding', 2], ['James Okafor', 1], ['#travel', 1]]);
    assert.ok(!s.alsoMentioned.some((m) => m.label === 'Sarah Mitchell'));
});

test('summary of nothing', () => {
    assert.deepEqual(summarise([], contacts, {}), { count: 0, first: null, last: null, bullets: [], alsoMentioned: [] });
});

test('relative dates', () => {
    const now = new Date('2026-11-21T12:00:00Z');
    assert.equal(relativeDate('2026-11-21T08:00:00Z', now), 'today');
    assert.equal(relativeDate('2026-11-20T08:00:00Z', now), 'yesterday');
    assert.equal(relativeDate('2026-11-17T08:00:00Z', now), '4 days ago');
    assert.equal(relativeDate('2026-11-07T08:00:00Z', now), '2 wk ago');
    assert.equal(relativeDate('2026-09-01T08:00:00Z', now), '1 Sept');
});

// ── Learning topics from past entries ────────────────

const history = [
    entry('1', 'Half marathon training, 18k', '2026-10-01T00:00:00Z', ['Sam Carter'], ['running']),
    entry('2', 'Marathon plan from Sam', '2026-10-02T00:00:00Z', ['Sam Carter'], ['running']),
    entry('3', 'Booked the marathon hotel', '2026-10-03T00:00:00Z', [], ['running', 'travel']),
    entry('4', 'Venue invoice paid', '2026-10-04T00:00:00Z', [], ['wedding']),
    entry('5', 'Sam came for dinner', '2026-10-05T00:00:00Z', ['Sam Carter'], []),
    entry('6', 'Sam again, board games', '2026-10-06T00:00:00Z', ['Sam Carter'], []),
    entry('7', 'Sam and the dog', '2026-10-07T00:00:00Z', ['Sam Carter'], []),
];

test('learns that a word signals a topic', () => {
    const learned = learnTopicKeywords(history, contacts);
    assert.deepEqual(learned.get('marathon'), ['running']);
    const s = suggestTags('Signed up for another marathon', contacts, tags, learned);
    assert.deepEqual(s.tags, []);              // not written, so not pre-selected…
    assert.deepEqual(s.likelyTags, ['running']); // …but offered
});

test('needs enough evidence, and never learns from names', () => {
    const learned = learnTopicKeywords(history, contacts);
    assert.equal(learned.get('venue'), undefined); // only seen once
    assert.equal(learned.get('sam'), undefined);   // a person, not a topic signal
});

test('a topic already written is not offered twice', () => {
    const learned = learnTopicKeywords(history, contacts);
    const s = suggestTags('Marathon running club', contacts, tags, learned);
    assert.deepEqual(s.tags, ['running']);
    assert.deepEqual(s.likelyTags, []);
});
