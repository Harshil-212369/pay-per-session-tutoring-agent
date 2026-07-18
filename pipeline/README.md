# Study-pack pipeline

The deliverable a student receives is an automated **study pack**. The engine that builds
it is the **CPOL507 pipeline**, which runs as **GitHub Actions** in a separate private
repository:

> **[`github.com/Harshil-212369/cpol507-pipeline`](https://github.com/Harshil-212369/cpol507-pipeline)** (private)

This repo documents how that engine plugs into Aitch; it does not vendor the pipeline
source (it lives and runs in its own repo).

## What it produces

```
lecture audio (.m4a) ──▶ [transcribe]  ──▶ transcript (text)
slide deck   (.pptx) ──▶ [OCR]         ──▶ searchable PDF (text layer added)
      transcript + slides ──▶ [LLM notes] ──▶ structured study notes
                             [merge]       ──▶ master PDF  ◀── the deliverable
```

| Stage | Input | Output | Role |
|---|---|---|---|
| Transcribe | lecture audio `.m4a` | transcript text | Makes the spoken lecture searchable and quotable |
| OCR | image-only `.pptx` / slide images | PDF with a real text layer | Makes slides keyword-searchable and quotable into notes |
| LLM notes | transcript + OCR'd slides | structured notes | Turns raw material into study-ready notes grounded in *this* lecture |
| Merge | transcript + slides + notes | single master PDF | One artifact the student studies from |

## How Aitch triggers it

A paid, unlocked session (see [`skills/study-pack/SKILL.md`](../skills/study-pack/SKILL.md))
collects the student's lecture audio and slide deck, then triggers the CPOL507 GitHub
Actions workflow. The workflow runs the four stages above and produces the master PDF,
which Aitch returns to the student in Telegram.

Because the pipeline runs as GitHub Actions, each run is logged and reproducible — the
same property Aitch relies on for the payment engine: deterministic, auditable steps
rather than one-off manual processing.

## Why the source isn't here

- The pipeline predates Aitch and is maintained on its own release cadence in its own
  (private) repo.
- It may contain course-specific material and configuration that shouldn't be public.
- Keeping it separate keeps this repo focused on the **agent** (identity, payments,
  orchestration) and links out to the **engine**, rather than duplicating and drifting.

## Media handling

Study-pack inputs and outputs (`.m4a`, `.pptx`, `.pdf`, images) are **never committed** to
this repo — they are per-student material and are covered by [`.gitignore`](../.gitignore).
They flow through the pipeline at runtime and are delivered directly to the student.
