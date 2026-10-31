# Ferdinand Lauren, The Systems Workbench

A static portfolio for entry-level IT business analyst / ERP functional consultant roles.
Built around two honest case studies (GYM-QR and a Procure-to-Pay learning case), a four-stage
working approach, and an interactive Decision Lab.

Stack: Astro 5, static output, no UI framework, no CSS framework. Three routes.

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/
npm test         # Decision Lab rule tests (node --test)
```

Node 22+ (built and tested on Node 24.13.1).

## Structure

```
src/
  data/site.json                 # name, positioning, contact, the 4-stage working approach
  data/projects/gym-qr.json      # the GYM-QR case study (all copy + evidence + metrics)
  data/projects/p2p-procurement.json # the Procure-to-Pay learning case study
  data/projects/supporting.json  # the "also in the drawer" list, one entry per project
  data/work.json                 # curated index: featured entry + three selected projects
  lib/decision-lab.mjs           # decision rules used by the Lab, plus the 4 scenarios
  components/Approach.astro      # selectable observe → define → design → verify panels
  components/CaseFileTeaser.astro# the featured case file band on the home page
  components/CaseStudy.astro     # the GYM-QR document at /work/<slug>/
  components/P2PCaseStudy.astro  # the Procure-to-Pay document at /work/<slug>/
  components/DecisionLab.astro   # scenario switcher + decision traces
  components/SelectedWork.astro  # editorial rows for the remaining projects
  layouts/Base.astro             # masthead, footer, metadata, progressive chrome
  pages/index.astro              # desk, approach, case file, lab, AI, work, about, contact
  pages/work/[slug].astro        # /work/<slug> for every project JSON except supporting.json
  styles/global.css              # tokens, chrome, case-study document, Decision Lab
  styles/opening.css             # home-page sections
tests/decision-lab.test.mjs      # asserts the Lab's rules against the GYM-QR UAT plan
public/fonts/                    # self-hosted Schibsted Grotesk, Instrument Serif, Red Hat Mono
```

Adding a project: drop a JSON file in `src/data/projects/` following the shape of `gym-qr.json`.
It gets a `/work/<slug>` page automatically. Adding a coursework item: one entry in
`supporting.json`. No design file needs touching.

## Design system

- **Concept:** a workbench where observations become requirements, requirements become system
  behaviour, and behaviour is examined through verification.
- **Colour:** warm paper (`#f3f0e7`), deep forest (`#173a2b`), ink (`#191913`), muted grey, and
  acid-lime (`#d8f26a`) reserved for active states and evidence markers.
- **Type:** Instrument Serif for statements, Schibsted Grotesk for body and UI, Red Hat Mono for
  labels, IDs and annotations. All three are self-hosted in `public/fonts/`.
- **Layout:** an editorial twelve-column feel built with CSS grid, hairline rules, asymmetric
  sections and generous whitespace. No cards grid, no gradients, no 3D.
- **Motion:** only two small state transitions (scenario/stage switching) plus a scroll progress
  line. `prefers-reduced-motion` removes them.

## Decision Lab

`src/lib/decision-lab.mjs` re-implements four documented GYM-QR rules: an active scan, an expired
membership, a geofence violation, and two cashiers claiming one locker. The Lab applies those
rules in the browser and labels each case as verified in code + test. It does not run the Laravel
application and says so on the page. Without JavaScript, all four cases remain readable and the
scenario buttons are hidden.

## Deploy (GitHub Pages)

The site is static. For a project page at `https://<user>.github.io/portfolio/`, build with the
base path set:

```bash
BASE_PATH=/portfolio/ npm run build
```

Then publish `dist/`. A minimal workflow is in `.github/workflows/deploy.yml`; set the repository
Pages source to "GitHub Actions".

If the repository is named `<user>.github.io`, build without `BASE_PATH` (base stays `/`).

## Evidence rules this site follows

- The GYM-QR project is labelled a self-initiated concept everywhere. It is never described as
  client work, and no business result is claimed.
- Every number on the page is reproducible from the GYM-QR repository: 1,166-line PRD, 15 acceptance
  scenarios, 130 passing tests with 849 assertions, Pint clean, one PHPStan level-6 error.
- The Decision Lab re-implements the documented rules; it does not run the Laravel application.
- AI is presented as a reviewed drafting tool. No time saving, prompt history or line ratio is
  claimed.
- Nothing is invented to fill a gap. Missing information is marked in the data files, not faked.

## Contact data (centralised in src/data/site.json)

Filled: `email`, `linkedin`, `github`. Rendered in the contact section and the footer, and emitted
as Person structured data.

Still optional: `cv`, currently `null`, so no CV link is rendered at all (no dead button). Put the
PDF in `public/` and set `cv` to `"/cv-ferdinand-lauren.pdf"` when it exists.

Also check: `location` ("Bandar Lampung, Indonesia"), `education`, `cohort` ("2022 cohort"),
`availability`.

In `src/data/projects/gym-qr.json`: `period` ("2026"), `status`, and the copy under
`observe` / `analyse` / `reflect`, which should sound like you.

## SEO / machine-readable

`public/llms.txt` summarises the site for AI assistants, and every page emits Person JSON-LD plus
Open Graph and Twitter card metadata.

## Mobile experience (`<= 760px`, portrait)

Phones get the same portfolio twice, chosen once per session and switchable from the Explore sheet
or the "Change experience" chip:

- **Interactive 3D (default).** A compact fixed 3D band (46 px top, `clamp(210px, 34svh, 300px)`
  tall) and one floating glass window at a time, overlapping the lower edge of the workspace. The
  window is not a scroller: the page scroll is the only scroll container, and it translates the
  document inside the window, hands the window to the next section at the end of that section's
  range, and moves the camera to the section's object (poses in `src/lib/desk/scene.js`). Every
  window keeps a discreet **Back to workspace** rail at its top; scrolling forward or back is
  always enough on its own. Object taps, the Explore sheet, in-page anchors and the HUD all go
  through the same controller in `src/pages/index.astro`.
- **Classic.** The same desk behind the hero as a non-interactive backdrop, held at the overview
  pose and faded out as soon as the hero leaves the screen; the documents are the repository's
  plain paper layouts. Without WebGL the desk never appears and the documents are unchanged.

Desktop and landscape keep the original full-stage cinematic scroll. The colophon is hidden in the
phone 3D experience (its links live in the Contact window and the Explore sheet).

## Verification performed (29 Oct 2026)

- `npm run build`: 3 pages built, no errors.
- `npm test`: 11 tests pass (rules checked against `docs/UAT.md` of GYM-QR).
- Rendered at 1440, 1280, 1024, 768, 390 and 360 px in Chromium: `scrollWidth === viewport` at
  every width on all three routes, no horizontal overflow.
- Every same-page and cross-page anchor on all three routes resolves; no console messages or uncaught
  page errors.
- Keyboard: Arrow keys move between Decision Lab cases and approach stages; focus stays on the
  selected control and the panel updates.
- No-JavaScript fallback: all four Lab cases and all four approach stages remain visible; the
  selectors are hidden rather than left as dead controls.
- Colour contrast checked against the token pairs used for text (paper/ink, forest/cream,
  board/cream, lime-on-forest, amber-on-board).

Not performed: cross-browser testing beyond Chromium, Lighthouse scoring, screen-reader testing,
and a manual UAT run of the GYM-QR system itself (none is recorded in that repository).
