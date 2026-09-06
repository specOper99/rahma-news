# Herald — Design

Source: Stitch project **Herald Multilingual Newsroom CMS** (`projects/3632456459734890250`).

Public site is an investigative broadsheet: ink on cool paper, Tigris-blue signal, hairline grids. Admin is a dense newsroom desk. Color means status.

## Direction

Newspaper first. Masthead, clocks, language pills, serif headlines, full-bleed lead photos, section rails.

Banned: purple-to-blue SaaS gradients, centered product heroes, Inter as a *display* face.

## Type

- Latin display: Newsreader
- Latin body + UI: Inter
- Arabic + Sorani display: Amiri
- Arabic + Sorani UI/body: Cairo
- Numerals / clocks: JetBrains Mono
- Scale: 11 / 12 / 13 / 14 / 15 / 18 / 22 / 28 / 36 / 48
- Admin UI: 13–14px Inter
- Body measure: 65ch
- Headlines: `text-wrap: balance`
- Body: `text-wrap: pretty`

## Color

Hex tokens from Stitch. Semantic names only in components.

```css
:root {
  --c-primary: #0b1320;
  --c-on-primary: #ffffff;
  --c-primary-container: #141c29;
  --c-on-primary-container: #93a2b8;
  --c-background: #f9f9ff;
  --c-on-background: #0b1320;
  --c-surface: #f9f9ff;
  --c-on-surface: #0b1320;
  --c-on-surface-variant: #454f60;
  --c-surface-container-lowest: #ffffff;
  --c-surface-container-low: #f0f3ff;
  --c-surface-container: #e8eeff;
  --c-surface-container-high: #dfe8ff;
  --c-surface-container-highest: #d5e3fc;
  --c-secondary: #0051d5;
  --c-on-secondary: #ffffff;
  --c-secondary-container: #e0ebff;
  --c-tigris-blue: #003285;
  --c-error: #ba1a1a;
  --c-error-container: #ffdad6;
  --c-on-error: #ffffff;
  --c-outline: #737e90;
  --c-outline-variant: #c2d5f0;
  --c-border-muted: #d5e3fc;
  --radius: 0.25rem;
}
```

Public cards: 4px radius. Admin: 4px. Breaking uses error red. Live language dots use emerald.

Theme: `localStorage.theme` = `light` | `dark`. Missing key follows `prefers-color-scheme`. Inline script sets `html.dark` before paint.

## Motion

180ms ease-out. None when `prefers-reduced-motion`. Card image hover scale 1.02 only if motion allowed and `(hover: hover)`.

## A11y

Contrast 4.5:1 body. Visible 2px secondary focus rings. One h1 per page. Skip link first. Theme control is a labeled button, 44px hit area.

## Layout

Public max width `90rem`. Header sticky. Home: breaking strip → featured 8/4 → section rails → river + aside (most-read, tips, newsletter). Story: edition bar above headline, then dek, byline, hero, 8/4 body + related.
