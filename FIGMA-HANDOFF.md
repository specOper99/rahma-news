# Herald — product brief for redesign

Hand this to design. It describes **what the product is, who uses it, and the rules that must stay true**. It does not describe look, layout, components, type, color, or the current visual system.

**Product:** Herald (هيرالد / هێراڵد) — an independent multilingual newsroom.

**Positioning:** one newsroom, three languages. A story is not a translation queue. An edition can exist in one language without waiting for the others.

**Audience (readers):** people who want news in English, Arabic, and/or Central Kurdish (Sorani). No reader accounts. No comments. No personalization beyond language choice and a color-theme preference.

**Audience (staff):** a small closed newsroom. Login is email + password. No public signup. No OAuth.

---

## 1. Languages (non-negotiable)

Herald always has exactly three locales:

| Code | Language | Script | Reading direction |
|------|----------|--------|-------------------|
| `en` | English | Latin | left-to-right |
| `ar` | Arabic | Arabic | right-to-left |
| `ckb` | Central Kurdish (Sorani) | Arabic | right-to-left |

Rules:

- Every public URL is prefixed with the locale: `/en/…`, `/ar/…`, `/ckb/…`. There is no unprefixed public page.
- Arabic is the **default locale**. Hitting `/` sends the reader into a locale (browser detection, then Arabic).
- `x-default` for search engines points at Arabic.
- Kurdish in the URL and in `html[lang]` is `ckb`. For Google `hreflang` it must be `ku-Arab`, never `ckb`.
- Native names in the language switcher: English / العربية / کوردی. Short codes used in staff tools: EN / AR / KU.
- Public chrome (nav labels, search, legal pages, empty states) is fully translated per locale.
- **Staff CMS chrome is English only.** Article *content* fields follow the edition’s language and direction.
- Brand name can be overridden per locale in settings. Defaults: Herald / هيرالد / هێراڵد. Tagline can also be set per locale.

Design implication: every public surface has an LTR English variant and two RTL Arabic-script variants. Staff surfaces are English LTR, except the article body/title/dek fields which flip direction with the edition.

---

## 2. Core idea: Story vs Edition

This is the product’s main mental model. Designers must keep it visible in both the public site and the CMS.

**Story (article)** = one news item in the newsroom. Shared across languages.

Story-level facts (same for all languages):

- Primary section (category) — required, exactly one
- Bylines (ordered list of authors, 0–n)
- Tags (0–n)
- Hero image (optional)
- Breaking flag (boolean)
- Featured flag (boolean)
- Featured rank (optional integer; unique among featured stories)

**Edition (article translation)** = that story in one language. A story may have 1, 2, or 3 editions.

Edition-level facts:

- Locale (`en` | `ar` | `ckb`)
- Title
- Dek (standfirst / deck)
- Slug (unique **per locale**, not globally)
- Body
- SEO title, SEO description, canonical URL override
- Status (see workflow)
- Publish timestamp
- Word count and reading time (derived)

A story with only an Arabic edition **does not exist** for English readers. It must not appear on `/en`, English latest, English search, English RSS, or English language-switcher destinations.

Coverage is a **matrix**, not a switch. Staff need to see, per story: which languages exist, and which of those are live.

---

## 3. Who can do what (staff)

Roles, highest to lowest: **owner → admin → editor → author**.

Inactive staff cannot log in. Staff cannot deactivate themselves.

| Capability | owner | admin | editor | author |
|------------|:-----:|:-----:|:------:|:------:|
| Sign in, edit drafts, create stories | yes | yes | yes | yes |
| Manage author profiles | yes | yes | yes | yes |
| Upload media | yes | yes | yes | yes |
| Change edition status to published / scheduled / archived | yes | yes | yes | no |
| Edit a **published** edition | yes | yes | yes | no |
| Create / edit categories and tags | yes | yes | yes | no |
| Create / edit redirects | yes | yes | yes | no |
| Create staff, change roles, deactivate staff | yes | yes | no | no |
| Site settings (names, taglines, homepage rails, contact email) | yes | yes | no | no |
| Assign the **owner** role | yes | no | no | no |

Password minimum: 10 characters. Login is rate-limited (5 attempts per email+IP per 15 minutes). Failed attempts show a generic “invalid email or password” — do not distinguish unknown email vs wrong password.

There is no self-serve staff signup.

---

## 4. Editorial workflow

Each **edition** has its own status. Publishing Arabic does not publish English.

Statuses:

1. **draft** — not public
2. **in_review** — not public; sits in the desk queue
3. **scheduled** — not public until `publishedAt` is in the past; then the system promotes it to published automatically
4. **published** — public **only if** `publishedAt` ≤ now
5. **archived** — not public

Publish rules:

- Cannot publish an edition whose title is empty or still `"Untitled"`.
- Authors cannot publish, schedule, or archive.
- Authors cannot change a published edition.
- New story always starts as: English edition, title `"Untitled"`, status `draft`, slug like `draft-xxxxxxxx`, assigned to whatever category exists first. Staff must then fill it (and may add AR/CKB editions).
- Saving a published edition whose **slug changed** automatically creates a permanent 301 from the old public URL to the new one.
- Concurrent edit: if two people save the same edition and the second save is based on a stale timestamp, the second save is rejected (`STALE_WRITE`). Design should surface this as “someone else saved; reload.”

Preview:

- Staff can open a signed preview of a non-public edition.
- Preview tokens expire in 2 hours.
- Preview pages must not be indexed and must not increment read counts.

---

## 5. Public information architecture

All paths below sit under `/{locale}/`.

| Surface | Path | What it is |
|---------|------|------------|
| Home | `/` | Front page package for **this locale only** |
| Latest | `/latest` | Chronological river of live editions, paginated |
| Section | `/category/{slug}` | Live editions in that section, paginated. Slug is locale-specific (`iraq` vs `aliraq` vs `eraq`) |
| Tag | `/tag/{slug}` | Live editions with that tag, paginated. Slug is locale-specific |
| Author | `/author/{slug}` | That person’s live editions in this locale, plus name + bio for this locale |
| Story | `/article/{slug}` | One live edition. Slug is locale-specific |
| Search | `/search?q=` | Full-text search of **this locale’s live editions only**. Search pages are not indexed |
| About / Contact / Privacy / Terms | `/about` `/contact` `/privacy` `/terms` | Static legal/info |
| Newsletter thanks | `/newsletter/thanks` | Confirmation after subscribe |
| Site RSS | `/rss.xml` | Last 50 live editions in this locale |
| Section RSS | `/category/{slug}/rss.xml` | Last 50 live editions in that section + locale |

Reserved path segments (cannot be used as slugs): `admin`, `api`, `login`, `rss`, `search`, `latest`, `about`, `contact`, `privacy`, `terms`, `newsletter`, `sitemap`, `robots`, `og`, `article`, `category`, `tag`, `author`.

Staff CMS lives at `/admin` (outside locale prefixes). Robots are told not to crawl `/admin` and `/api`.

Pagination: 20 items per page, previous/next, page number. Same for latest, section, tag, author, search.

Empty states are locale-specific copy, e.g. “No stories in English yet.” A section with no live editions in that language is a valid empty page, not an error.

404: “this page does not exist” + way back to that locale’s home.

---

## 6. Home — how content is chosen

Home is **assembled per locale**. The same story can lead in Arabic and be absent in English.

Live means: edition status = published AND publish time ≤ now.

Package slots (selection rules, not layout):

1. **Breaking** — up to 3 live editions whose story is flagged breaking, newest first.
2. **Featured** — up to 6 live editions whose story is flagged featured, ordered by featured rank (1 is the lead). Rank is unique; assigning rank N to a story unsets whoever currently holds N.
3. **Section rails** — owner/admin pick an ordered list of category IDs in settings. For each, take live editions in that section (up to 4 after de-duplication against stories already used in breaking/featured/earlier rails). Default seed rails: World, Iraq, Culture. Opinion is a section but not a default rail.
4. **Latest river** — remaining live editions, newest first, up to 12, excluding anything already used in 1–3.
5. **Most read** — top 5 live editions in this locale by view count over the **last 2 days**. This list is allowed to overlap with 1–4.

Overlap rule: a story **may** appear in both breaking and featured if both flags are on. After that, rails and river exclude stories already in breaking or featured. Most-read is independent.

If a locale has no featured stories, home has an empty featured package — that is a real editorial state, not a bug.

Newsletter signup lives on home (and may live elsewhere). It is not a separate marketing site.

---

## 7. Story page — required information

A public story page is one **edition**. Required information (presence, not placement):

- Headline (edition title)
- Dek, if present
- Bylines, each linking to that author’s page in this locale (authors ordered)
- Publish date
- “Updated” only if the edition was saved more than **15 minutes** after it was first published
- Reading time in minutes (minimum 1)
- Share: copy canonical URL; native share sheet when the device supports it
- Hero image if the story has one: image + locale-specific alt + caption + credit
- Body
- Tags, each linking to that tag in this locale
- Author bios (name + bio for this locale)
- Related: up to 4 other **live** stories in the same section, this locale, excluding itself, newest first
- Publisher name + canonical URL (needed for print/citation)
- Structured data as a news article: headline, dek, dates, language, word count, authors, publisher

If the reader arrived via a language that has no live sibling: the switcher must not pretend the story exists there. That language is **unavailable** and must send them to that language’s **home**, not a 404 of the same slug.

Draft/preview: show a clear “not public” state. Do not count a view.

Views: counted per story × locale × calendar day. Used only for most-read. Readers are not shown a view count.

---

## 8. Language switching (product rule)

Switcher always offers EN / AR / CKB.

Same path type, different slug:

- On a **story**: jump to the sibling edition **only if that sibling is live**. Otherwise: that language is unavailable → that language’s home.
- On a **section / tag / author**: jump to the same entity’s slug in the other language if that translation exists; if the name/slug was never created for that language → home.
- On home, latest, search, about, contact, legal: swap the locale prefix, keep the rest of the path.

“Unavailable” is a first-class state. Do not hide the language. Do not deep-link to a missing edition.

---

## 9. Taxonomy

**Sections (categories)**

- Ordered (position). Used for public navigation and homepage rails.
- Each section has per-locale: slug, name, description, optional SEO title/description.
- Schema allows a parent section (nesting). That is not used in the live product yet. Design may propose nested sections; do not assume they exist today.
- Every story has exactly one primary section.
- Seed sections: World, Iraq, Culture, Opinion — each with EN/AR/CKB names and slugs.

**Tags**

- Flat. Per-locale name + slug.
- A story can have many tags.
- Public tag pages exist.

**Authors (bylines, not staff accounts)**

- Public people. May optionally be linked to a staff user.
- Site-wide slug plus per-locale slug, name, bio. Optional portrait.
- A story can have multiple authors, ordered.
- Author pages list only live editions in the current locale.

Creating/editing sections and tags is editor+ only. Authors may edit author profiles.

---

## 10. Body content (what a story can contain)

Allowed in the article body:

- Paragraphs, headings, bullet and numbered lists, blockquote, pull-quote, horizontal rule
- Bold, italic, underline, links
- Inline images (must reference a media asset)
- Image galleries
- Embeds: **YouTube or Vimeo only**, by video id

Links may be internal paths or `http`/`https`/`mailto`. Anything else is rejected.

Reading time:

- English: ~220 words per minute, round, minimum 1
- Arabic / Kurdish: ~180 words per minute; if the text is long but word-split fails (unspaced script edge case), fall back to character length / 500

Slugs:

- Max 80 characters, NFC normalized, no spaces or `/?#`
- English: lowercase `a-z0-9` with hyphens
- Arabic / Kurdish: Unicode allowed (so Arabic-script slugs are valid)

---

## 11. Media

Staff upload images: JPEG, PNG, WebP, GIF, AVIF. Max **12 MB**.

Each asset has per-locale **alt, caption, credit**. Those strings are what readers see, not a single English caption reused.

A story’s hero is a media asset. Body images are the same library.

---

## 12. Search, subscribe, contact

**Search**

- Scoped to the current locale’s live editions.
- Query must be at least 2 characters.
- Ranked by full-text relevance, then listed like other story lists.
- Search itself is `noindex`.

**Newsletter**

- Email + locale of the page they subscribed from.
- Duplicate email is ignored (one row per email).
- Honeypot field; bots are treated as success without storing.
- Rate limit: 8 per IP per hour. Over limit: silently sent away, no error detail.
- Success: thanks page in that locale.
- Staff see the list (email, locale, confirmed, unsubscribe time). There is no public unsubscribe UI yet; `unsubscribedAt` exists in data.

**Contact**

- Name (max 80), email, message (10–2000 chars), locale.
- Honeypot. Rate limit: 5 per IP per hour.
- Stored for staff inbox. No auto-reply required.
- Success copy: message received.

Privacy facts the legal pages already commit to: newsletter emails, contact messages, server logs, staff accounts are stored. No reader accounts. Emails are not sold. Cookies: locale preference + staff session.

---

## 13. Staff surfaces (jobs to be done)

CMS is a closed newsroom tool. Group work as:

**Desk**

- Dashboard: counts of draft editions, scheduled editions, breaking stories, contact messages, active subscribers.
- Queue of editions that need attention: in review, drafts, scheduled (most recently updated, capped).
- Breaking stories currently flagged.
- Coverage gaps: stories missing a **published** edition in one or more of EN/AR/CKB. Goal state: “every story is live in all three languages” — that is an aspiration, not a requirement for going live.

**Stories**

- List of all stories with a three-language status grid (missing edition = empty).
- Dedicated coverage view of the same matrix.
- Create story.
- Edit one story: switch between editions; add a missing edition; edit story-level metadata (section, authors, tags, breaking, featured, rank, hero) alongside the open edition.

**Taxonomy & library**

- Categories, tags, authors, media — each entity edited once, with three language fields where relevant.

**Audience**

- Inbox: contact submissions (name, email, locale, message).
- Subscribers: newsletter list.

**System** (role-gated)

- Redirects: from-path → to-path, 301 or 302. Also created automatically on published slug change.
- Audit log: who did create / update / publish / unpublish / archive / schedule / login / user_create / settings / media_upload / redirect, on which entity, when.
- Users: create staff (admin / editor / author), change role, activate/deactivate. Owner role is special.
- Settings: per-locale site name, tagline, footer blurb; contact email; ordered homepage rail category IDs.

---

## 14. Cross-cutting product rules

- **One newsroom, three clocks.** Do not design a workflow that forces EN→AR→CKB translation in order.
- **Live in this language** is the only thing a reader of that language should see in lists, search, RSS, home, related, and switcher targets.
- **Story-level placement** (breaking, featured, section, authors, tags, hero) is shared. **Words and publish state** are per edition.
- Featured rank is a scarce slot: one story per rank.
- Changing a live slug must not strand readers (redirect is automatic).
- Staff English vs reader language: do not mix CMS chrome into the public site, and do not force public Arabic/Kurdish into CMS navigation.
- No comments, no reader profiles, no paywall, no recommendations-beyond-same-section-related, no social login.
- Theme (light/dark) is a reader preference, not an editorial object.

---

## 15. Data that exists but is not staff-facing yet

Safe to ignore, or to propose as new CMS fields if useful:

- Category parent (nested sections)
- Per-edition `excerpt` (separate from dek)
- Per-story Open Graph image distinct from hero
- Site logo asset, default OG image, social JSON, analytics id

Do not invent reader accounts, commenting, or extra locales.

---

## 16. Example newsroom (seed, for realistic content)

Use this as sample content when designing, not as required copy.

**Sections:** World, Iraq, Culture, Opinion.

**People:** Layla Hassan (Iraq/region correspondent), Karwan Ali (culture/language).

**Behaviors to show in mockups:**

- A story live in all three languages, with **different slugs and headlines** (not a word-for-word clone).
- A story live only in English (opinion) — absent from Arabic/Kurdish latest.
- A story live only in Arabic + Kurdish — absent from English latest.
- A breaking story live in EN+AR, Kurdish still draft — switcher from English to Kurdish must **not** open the draft.
- A scheduled Arabic edition that is not on the public site yet.
- An Arabic draft that only staff can preview.
- Coverage dashboard showing missing languages.

---

## 17. Success for a redesign

A design is correct if:

1. A reader of one language never sees another language’s unpublished or missing editions in “live” contexts.
2. Staff can tell, in one glance, the 3-language coverage of a story and move an edition through draft → review → schedule/publish → archive.
3. Home is an **editorial package** (breaking, featured, section rails, latest, most-read), not a single dump of everything.
4. RTL Arabic and Sorani are equal products to English, not mirrored afterthoughts.
5. Authors can write; they cannot put something on the masthead.
6. Language switcher tells the truth about whether *this* story/section exists in the target language.
