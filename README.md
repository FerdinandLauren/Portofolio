# Ferdinand Lauren — portfolio

A static portfolio for entry-level ERP functional consultant / IT business analyst roles.
Built around one honest case study (GYM-QR) and an interactive Decision Lab.

Stack: Astro 5, static output, no UI framework, no CSS framework. One page, one case-study route.

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
  data/site.json                 # name, positioning, contact links, the 4-step process rail
  data/projects/gym-qr.json      # the featured case study (all copy + evidence + metrics)
  data/projects/supporting.json  # the "other work" list, one entry per project
  lib/decision-lab.mjs           # decision rules used by the Lab, plus the 4 scenarios
  components/CaseStudy.astro     # renders any project JSON as a 5-stage case study
  components/DecisionLab.astro   # scenario switcher + decision traces
  pages/index.astro              # hero, about, case study, lab, other work, skills, contact
  pages/work/[slug].astro        # /work/<slug> for every project JSON except supporting.json
  styles/global.css              # design tokens and all layout
tests/decision-lab.test.mjs      # asserts the Lab's rules against the GYM-QR UAT plan
```

Adding a project: drop a JSON file in `src/data/projects/` following the shape of `gym-qr.json`.
It gets a `/work/<slug>` page automatically. Adding a coursework item: one entry in `supporting.json`.
No design file needs touching.

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
- The Decision Lab re-implements the documented rules; it does not run the Laravel application and
  says so on the page.
- Nothing is invented to fill a gap. Missing information is marked in the data files, not faked.

## Contact data (centralised in src/data/site.json)

Filled: `email`, `linkedin`, `github`. Rendered in the contact section and the footer, and emitted
as Person structured data.

Still optional: `cv` — currently `null`, so no CV link is rendered at all (no dead button). Put the
PDF in `public/` and set `cv` to `"/cv-ferdinand-lauren.pdf"` when it exists.

Also check: `location` ("Bandar Lampung, Indonesia"), `education`, `cohort` ("2022 cohort"),
`availability`.

In `src/data/projects/gym-qr.json`: `period` ("2026"), `status`, and the copy under
`observe` / `analyse` / `reflect`, which should sound like you.

## SEO / machine-readable

`public/llms.txt` summarises the site for AI assistants, and every page emits Person JSON-LD.

## Verification performed (29 Oct 2026)

- `npm run build` — 2 pages built, no errors.
- `npm test` — 11 tests pass (rules checked against `docs/UAT.md` of GYM-QR).
- Layout audited in a real browser at 1440, 768, 390 and 360 px: no horizontal overflow, no console
  or resource errors, all internal anchors resolve, contrast ≥ 5:1 on every text pair checked,
  keyboard operation of the Decision Lab (click, arrow keys) verified.
- Without JavaScript all four Decision Lab traces remain readable.

Not performed: cross-browser testing beyond Chromium, Lighthouse scoring, screen-reader testing.
