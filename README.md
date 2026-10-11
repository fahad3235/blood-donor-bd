# Blood Donor BD — রক্তদাতা বিডি

A free, fully offline, bilingual (English / বাংলা) **personal blood-donation organizer** for Bangladesh. A single-page web app with zero build step, zero network calls, and zero accounts — all data stays in the browser's localStorage on the user's own device.

## Problem

Blood donation in Bangladesh still runs on scattered phone calls, Facebook posts, and paper lists. Finding a compatible donor quickly, remembering when you last donated, and tracking open blood requests are all manual chores. Blood Donor BD puts a small, honest toolkit for that job in one offline page: compatibility lookup, a personal donor registry with eligibility reminders, and a blood-request board.

## Features

1. **Blood-group compatibility checker** — pick any of the 8 groups (O−, O+, A−, A+, B−, B+, AB−, AB+); see "Can donate to" and "Can receive from" lists. The receive-from lists are *derived* by transposing the donor→recipient matrix, never hardcoded twice.
2. **Donor registry** — add / edit / delete donors (name + blood group required; phone, area/upazila, last-donation date optional). Inline validation; Bangladesh mobile numbers loosely validated (11 digits starting with `01`).
3. **Eligibility engine** — 56-day minimum interval between whole-blood donations (a widely used international standard). Each donor shows **"Eligible now"**, **"Eligible on \<date\>"**, or **"\<N\> days to go"**, computed with deterministic date math.
4. **Search & "find donors"** — filter by group and name/area text; a "Find donors for recipient group X" quick filter lists registry donors whose group can donate to X.
5. **Request board** — post blood requests (patient, hospital, group needed, bags, contact, needed-by); lists open / fulfilled; mark fulfilled; delete.
6. **Bilingual EN/বাংলা UI** — one-tap toggle persisted in localStorage; Bengali digit rendering in বাংলা mode; responsive down to 390px mobile.
7. **Export / import JSON** — full backup/restore of donors + requests. Malformed imports are rejected with an error and existing data stays intact.

**No demo or sample data is shipped** — the app starts empty with clear empty states.

## Stack

- Vanilla HTML + CSS + JavaScript (no framework, no build step, no dependencies at runtime)
- `logic.js` — pure, DOM-free logic (compatibility matrix, eligibility math, validation, import schema); shared by the app and the Node unit tests
- `app.js` — UI rendering, i18n, localStorage persistence
- `styles.css` — mobile-first responsive styles
- Tests: Node built-in `node:assert` (unit), puppeteer-core + system Chromium (headless smoke)

## Prerequisites

- Any modern browser (Chrome, Edge, Firefox, Safari) — open `index.html`, or serve the folder statically.
- For running tests: Node.js ≥ 18 and `puppeteer-core` + a Chromium binary (the smoke test expects Chromium at `/opt/meta-chromium/chrome`; override via the `CHROME` constant in `tests/smoke.test.js`).

## Install

No install needed. Copy the folder (or clone the repo) and open `index.html` in a browser. Everything runs from `file://` — there is no server and no network traffic.

## Dev commands

```bash
# unit tests (no dependencies)
node tests/unit.test.js

# headless-Chrome smoke tests (needs puppeteer-core resolvable)
NODE_PATH=/path/to/dir/containing/puppeteer-core node tests/smoke.test.js
```

The app accepts a `?asof=YYYY-MM-DD` query parameter that overrides "today" — the smoke suite uses `?asof=2026-10-11` so date-sensitive assertions are deterministic.

## Env

None. There are no API keys, no backends, no environment variables.

## Testing

- **Unit:** 51 assertions covering the exact 8-group donate-to matrix, derived receive-from sets (plus a transpose-consistency proof), eligibility boundaries (60d → eligible, 56d → eligible, 55d → 1 day to go, 30d → 26 days to go, none → eligible, future → invalid), date parsing, donor/request validation edge cases, and import-schema rejection. Result: **51/51 pass**.
- **Smoke (headless Chromium):** 19 checks — page loads with 0 console/page errors; compat lists for AB+ and O−; invalid phone/name blocked with inline errors; add/edit/delete donor; eligibility text ("Eligible now", "26 days to go"); group + text search; "find donors for A+/O−"; request post → fulfill → lists; invalid bags blocked; বাংলা toggle with Bengali digits persisted across reload; donors/requests persist across reload; malformed import rejected via the real file input with data intact; valid import replaces data; 390px viewport has no horizontal overflow. Result: **19/19 pass, 0 console errors, 0 page errors**.
- **Repairs during testing:** 1 — the smoke harness initially passed `Buffer` objects to `uploadFile` (puppeteer-core expects file paths) and used a fragile `page.emulate` call; fixed to write temp files under `/tmp` and use `setViewport`. No app-code repairs were needed.

## Deployment (GitHub Pages)

This is a static site: enable GitHub Pages on the repository (branch `main`, folder `/ (root)`) and the app is live. No build, no secrets, no server config.

## Limitations

- **Personal organizer, not medical advice.** Compatibility tables and the 56-day interval are general guidance; blood banks (e.g. BDRCS) may set 3–4 months between donations — always confirm eligibility with the blood bank before donating.
- Data lives only in the browser's localStorage. Clearing browser data without an export loses it. There is no sync, no accounts, and no sharing between devices.
- Phone validation is deliberately loose (`01` + 9 digits, spaces/dashes ignored) and does not verify that a number is real or reachable.
- The app does not handle plasma/platelet-specific compatibility or donation-type differences.
- In an emergency, call **999** (Bangladesh national emergency number).

## Status

Complete and verified: built 2026-10-11, unit 51/51 green, headless-Chrome smoke 19/19 green with zero console/page errors.
