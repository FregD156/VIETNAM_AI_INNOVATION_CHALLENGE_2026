# SHB Legal Intelligence — Progress Tracker

> Deadline: 11:00, 19 July 2026  
> Detailed reference: docs/PLAN.md  
> Rule: complete P0 from top to bottom. Do not start P1 until every P0 release gate is green.

## How to use this file

- Assign one owner beside each active item.
- Check an item only after its acceptance condition is verified.
- Add the evidence link, test output, or measured result under the item.
- Keep only one major backend integration task in progress at a time.
- If time runs short, cut P1—not correctness, security, or submission work.

## Current verified baseline

- [x] Challenge guide and problem statement reviewed.
- [x] FastAPI and React prototype exists.
- [x] FAISS + BM25 + RRF retrieval exists.
- [x] NetworkX reference/supersession graph exists.
- [x] Chat, citations, graph, timeline, conflicts, admin, and benchmark UI exist.
- [x] Detailed implementation plan created at docs/PLAN.md.
- [x] Local frontend lint and production build pass.
- [x] Backend compiles.
- [x] Local health, models, benchmark, and filtered graph endpoints return HTTP 200.
- [ ] Production deployment passes a fresh end-to-end smoke test.

## P0 — Critical path

### 1. Freeze the demo and secure the release

- [ ] P0-01 — Freeze four demo questions.
  - [ ] Current version after partial supersession.
  - [ ] Cross-reference requiring another document.
  - [ ] Potential internal/external conflict.
  - [ ] Insufficient active evidence.
  - Acceptance: expected provisions, forbidden stale provisions, and expected UI state are written for all four.

- [ ] P0-02 — Verify repository security.
  - [ ] Scan the working tree for secrets.
  - [ ] Scan complete Git history for secrets.
  - [ ] Confirm AI log, screenshots, and video contain no credentials.
  - Acceptance: no active credential or confidential document exists in public content.

- [ ] P0-03 — Protect public administration.
  - [ ] Require server-side authorization for document upload, or disable it in public mode.
  - [ ] Verify an unauthorized upload is rejected.
  - Acceptance: anonymous users cannot trigger an index rebuild.

### 2. Make legal validity deterministic

- [ ] P0-04 — Add stable identifiers.
  - [ ] Stable document ID.
  - [ ] Stable provision ID for article/clause/point.
  - [ ] Stable provision-version ID.
  - Acceptance: IDs do not change when input file order changes.

- [ ] P0-05 — Add temporal and relationship scope fields.
  - [ ] valid-from and valid-to.
  - [ ] document/article/clause/point scope.
  - [ ] reviewed, proposed, unresolved, and ambiguous states.
  - Acceptance: SQLite can represent partial, future, historical, and unknown validity.

- [ ] P0-06 — Implement one EffectiveResolver.
  - [ ] Resolve by as-of date.
  - [ ] Handle full and partial supersession.
  - [ ] Follow amendment chains.
  - [ ] Detect cycles and conflicting successors.
  - [ ] Preserve unaffected sibling clauses.
  - Acceptance: every active/stale decision uses this service.

- [ ] P0-07 — Add resolver tests.
  - [ ] Current case.
  - [ ] Historical case.
  - [ ] Future-effective case.
  - [ ] Partial supersession.
  - [ ] Full supersession.
  - [ ] Multi-hop chain.
  - [ ] Cycle/ambiguity.
  - Acceptance: stale evidence never enters Advanced generation context in fixtures.

### 3. Guarantee Graph-RAG behavior

- [ ] P0-08 — Add deterministic server-side reference expansion.
  - [ ] Works without LLM tool calling.
  - [ ] Maximum depth and node budget.
  - [ ] Deduplication and cycle protection.
  - [ ] Return the path that caused inclusion.
  - Acceptance: the cross-reference demo passes with tools enabled and disabled.

- [ ] P0-09 — Harden retrieval and evidence packing.
  - [ ] Keep the original question alongside generated subqueries.
  - [ ] Run exact legal-identifier lookup first.
  - [ ] Preserve vector, BM25, RRF, and rerank scores.
  - [ ] Resolve temporal state before generation.
  - [ ] Freeze evidence before assigning citation numbers.
  - Acceptance: citations remain stable and every excluded source has a reason.

### 4. Strengthen trust and measurable proof

- [ ] P0-10 — Strengthen citation and abstention guards.
  - [ ] Reject unknown or inactive citation IDs.
  - [ ] Require citations for legal conclusions, dates, and numbers.
  - [ ] Remove unsupported claims.
  - [ ] Abstain when active evidence is insufficient.
  - Acceptance: all four demo answers have correct behavior and exact evidence.

- [ ] P0-11 — Ground conflict detection.
  - [ ] Select comparable external/internal evidence pairs deterministically.
  - [ ] Require exact evidence IDs in model output.
  - [ ] Preserve detected, no-conflict, insufficient-evidence, and analysis-failed states.
  - [ ] Use “potential conflict” wording.
  - Acceptance: no finding can cite evidence outside the effective evidence pack.

- [ ] P0-12 — Create the gold evaluation set.
  - [ ] 8 direct retrieval cases.
  - [ ] 6 cross-reference cases.
  - [ ] 8 amendment/as-of cases.
  - [ ] 4 conflict/non-conflict cases.
  - [ ] 4 insufficient-evidence cases.
  - Acceptance: every case defines expected, forbidden, citation, conflict, and abstention outcomes.

- [ ] P0-13 — Implement the fair benchmark.
  - [ ] Standard: vector retrieval only.
  - [ ] Advanced: exact + vector + BM25 + RRF + graph + effective resolver.
  - [ ] Same corpus, embedding model, generator, and top-k.
  - [ ] Report Recall@5, MRR, current-version accuracy, stale leakage, citation precision, and latency.
  - Acceptance: slides use measured results only.

- [ ] P0-14 — Complete automated regression coverage.
  - [ ] Parser and stable-ID tests.
  - [ ] Resolver and graph tests.
  - [ ] Retrieval and citation tests.
  - [ ] Conflict-state tests.
  - [ ] API and SSE tests.
  - [ ] Ingestion rollback tests.
  - Acceptance: tests run without paid external APIs.

### 5. Finish UX and deployment

- [ ] P0-15 — Expose trust information in the UI.
  - [ ] Resolved as-of date.
  - [ ] Included/excluded temporal trace.
  - [ ] Exact source locator and effective dates.
  - [ ] Amendment path and diff.
  - [ ] Clear abstention and analysis-failed states.
  - Acceptance: a judge can understand why the answer is valid without reading logs.

- [ ] P0-16 — Run the complete local release gate.
  - [ ] Frontend lint.
  - [ ] Frontend production build.
  - [ ] Backend compile and tests.
  - [ ] API smoke checks.
  - [ ] Offline benchmark.
  - Acceptance: all commands are green from documented setup steps.

- [ ] P0-17 — Deploy and smoke-test production.
  - [ ] Frontend opens from an incognito browser.
  - [ ] Backend health is green.
  - [ ] Vercel-to-Render rewrites work.
  - [ ] SSE streaming works.
  - [ ] Chat, citation, graph, conflict, documents, and benchmark work.
  - [ ] Cold-start behavior is acceptable.
  - Acceptance: the four demo questions pass live.

- [ ] P0-18 — Complete three timed rehearsals.
  - [ ] Run 1.
  - [ ] Run 2.
  - [ ] Run 3.
  - Acceptance: each run finishes within 4 minutes 30 seconds without manual intervention.

## Mandatory submission checklist

- [ ] SUB-01 — Presentation slides.
  - Acceptance: open correctly and contain measured metrics, architecture, safety, and pilot pathway.

- [ ] SUB-02 — Demo video.
  - Acceptance: no more than five minutes; shows the real product rather than slides.

- [ ] SUB-03 — Public GitHub repository.
  - Acceptance: Vietnamese README installs/runs the app; no secrets or confidential data.

- [ ] SUB-04 — Live deployed URL.
  - Acceptance: works without team credentials from a clean browser.

- [ ] SUB-05 — AI collaboration log.
  - Acceptance: complete, human-reviewed, and redacted.

- [ ] SUB-06 — Final submission audit.
  - [ ] Team member 1 verifies every link.
  - [ ] Team member 2 independently verifies every link.
  - Acceptance: submission completed before 11:00, 19 July 2026.

## P1 — Only if all P0 items are green

- [ ] Add ingestion preview and relation approval.
- [ ] Add more Vietnamese clause/point modification patterns.
- [ ] Add an as-of date picker if not included in P0 UI.
- [ ] Add query-level token, cost, and latency telemetry.
- [ ] Add digitally generated PDF text ingestion.
- [ ] Add word-level diff highlighting.

## Final release gate

- [ ] No stale provision appears in Advanced generation context.
- [ ] Cross-reference retrieval works without model tools.
- [ ] Unsupported questions abstain.
- [ ] Conflict findings use exact effective evidence.
- [ ] Timeline, answer, and citations use the same version graph.
- [ ] Public upload is protected or disabled.
- [ ] Automated tests and builds pass.
- [ ] Production smoke tests pass.
- [ ] All five mandatory deliverables are accessible.

## Immediate next task

Start with P0-01, P0-02, and P0-03 in parallel. Then implement P0-04 through P0-07 before changing more UI.
