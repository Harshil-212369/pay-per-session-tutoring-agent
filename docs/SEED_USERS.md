# Seed User Definition — Aitch (Pay-Per-Session Tutoring Agent)

**Stage 1 deliverable · 2026-07-17**

## One-sentence definition

Aitch's seed users are **university students in lecture-heavy courses whose professors distribute lecture audio (`.m4a`) and slide decks (`.pptx`) separately, week after week** — students who currently rebuild that raw material into usable study notes by hand.

## The segment, specifically

Not "students" in general. The wedge is narrow on purpose:

- **Institution:** Toronto Metropolitan University, starting with the builder's own program and course cohort.
- **Course shape:** Lecture-heavy, recorded. The concrete origin case is **CPOL507**, where the instructor posts weekly `.m4a` recordings alongside image-only `.pptx` slides. Any course with this distribution pattern qualifies.
- **Behaviour:** Students who study from lecture recordings rather than a clean textbook, and who currently transcribe, cross-reference slides, and assemble notes manually.

## The pain, in the user's own terms

1. **Hours of mechanical prep before any learning.** Sitting through lecture audio, matching it to slides, and writing notes is roughly three hours per course per week — before the studying itself begins.
2. **Slides aren't searchable.** Decks are exported as images; there's no text layer, so you can't find anything by keyword and can't quote a slide into notes.
3. **Generic AI tutors don't know *this* lecture.** A general chatbot answers about the topic in the abstract — it hasn't heard the professor's recording or seen the specific deck, so it can't tutor on what's actually being tested.
4. **Subscriptions are the wrong shape.** Tutoring services charge $15–40/month for help most students need only once or twice per topic. The cost model punishes irregular use.

## Why this is the *ideal* early adopter — not just an available one

- **The pain is acute and recurring.** It happens every week, per course. A weekly frequency means fast feedback and fast repeat-purchase signal.
- **They can supply their own raw material.** Unlike agents that depend on locked, enterprise, or non-existent data sources, these users already hold the exact inputs Aitch needs — their own lecture audio and slides. No data-access dead end.
- **They're price-sensitive but will pay per use.** The pay-per-session model removes the subscription barrier that keeps this group from buying at all.
- **Unfair builder insight.** The builder *is* one of them, and built the underlying study-pack pipeline for their own course first. The insight comes from the specific moment the existing tools failed — not from a market report.

## What a seed user does with Aitch

1. Messages Aitch on Telegram, sees what it does and what a session costs (free self-disclosure).
2. Starts a session and pays per session in USDC.e via x402 — no subscription.
3. Supplies that week's lecture audio + slides.
4. Receives an automated study pack — transcript, OCR'd (searchable) slides, structured notes, merged into one master PDF — plus targeted tutoring on that material.

## Initial cohort target

**10–20 seed users** for Stage 2 validation — matching the bootcamp's Seed User Feedback Report requirement (10–20 users). Sourced from:

- The builder's own TMU course cohorts and program.
- Program-specific study-group chats and student Discords.
- TMU student-builder networks (e.g. BYTE).

## What would tell us we picked wrong

If early users **don't return the following week**, the pain isn't recurring enough for this segment, and we'd narrow further (specific programs/courses) rather than broaden to "all students." Retention within 7 days is the honest early signal — see the Growth Metrics Proposal.
