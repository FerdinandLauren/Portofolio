# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters and hiring managers at ERP consultancies, system integrators, and IT consulting firms. Their situation: screening entry-level candidates quickly, often non-technical or semi-technical. Their job: decide within a few minutes whether this candidate thinks in a structured way and is worth an interview.

## Product Purpose

A one-page portfolio that makes Ferdinand Lauren's way of thinking legible to a recruiter: how he observes a real process, derives rules, designs system behavior, and verifies it against evidence. Success = interview invitations for internship/trainee/junior positions as ERP Functional Consultant or IT Business Analyst. The site must read as the work of an early-career analyst, not a senior consultant.

## Positioning

Early-career analyst who documents the full reasoning chain (observation → requirements → system rules → verification) and can show the artifacts (PRD, state machines, UAT scenarios, an interactive decision simulator). Neighboring portfolios show projects; this one shows how the candidate thinks.

## Operating Context

The site is sent as a link in job applications and on the CV. It must work when skimmed top to bottom in under three minutes, when read deeply, and when printed or read without JavaScript. Content is maintained by editing one JSON file per project in `src/data/projects/`; adding a project must not require design changes.

## Capabilities and Constraints

- Astro 5 static output; no heavy JS dependencies; deploys to Vercel (root base path).
- All site content in English.
- One JSON file per project under `src/data/projects/`; featured project gets a case-study page at `/work/<slug>/`.
- The Decision Lab (4 scenarios) runs client-side from `src/lib/decision-lab.mjs` and degrades to a readable table without JS.
- GYM-QR is an independent, observation-based concept, not client work; this boundary is part of the content and must stay visible.
- No fabricated metrics, clients, or outcomes anywhere on the site.

## Brand Commitments

- Name: Ferdinand Lauren. Location line: "Bandar Lampung, Indonesia".
- Contact: mailto ferdinandlauren78@gmail.com; LinkedIn (new tab); GitHub. CV link configurable, hidden while null.
- The user pinned https://andrewreff.com/ as the visual direction reference (editorial confidence, oversized name, concise project index). It is a direction, not a layout to copy.
- Dealbreaker (user's words): anything that looks like a template or AI slop.

## Evidence on Hand

- GYM-QR repository: PRD v1.2 (1,166 lines), UAT with 15 scenarios AT-01..AT-15 (execution evidence column empty — must not be presented as executed), 130 passing tests / 849 assertions verified locally, PHPStan level 6 with 1 known error, CI red on static analysis.
- Supporting repos (coursework): Prak_WebLanjut, wuish, UAS-DSP, DSP, BMI_Calculator, pastebin.
- No CV PDF yet. No photography of the subject. No testimonials.

## Product Principles

1. Thinking first: every section serves the narrative observe → analyze → define rules → verify.
2. Honesty as a feature: concept labels, unvalidated assumptions, and limits are stated on the page, not hidden.
3. Content is data: narrative and facts live in JSON; design never hardcodes project claims.
4. Quiet confidence: editorial typography and structure carry the identity; motion supports comprehension, never decorates for its own sake.

## Accessibility & Inclusion

WCAG AA contrast as floor; full keyboard operability including the Decision Lab; `prefers-reduced-motion` respected; readable without JavaScript.
