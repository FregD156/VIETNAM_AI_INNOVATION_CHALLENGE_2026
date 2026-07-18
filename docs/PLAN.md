# SHB Legal Intelligence — Detailed Implementation Plan

> Challenge: Advanced RAG Knowledge Base — AI Chatbot for Complex Banking Document Retrieval  
> Event: Vietnam AI Innovation Challenge 2026  
> Submission deadline: 11:00, 19 July 2026, Asia/Ho_Chi_Minh  
> Repository state reviewed: 18 July 2026

## 1. Executive summary

SHB Legal Intelligence should be implemented as a clause-level temporal Graph-RAG system for Vietnamese banking regulations and internal compliance documents.

Its core promise is:

> Before generating an answer, the system determines which clauses are effective for the requested date, follows relevant document relationships, excludes superseded content, and assembles exact evidence that the user can inspect.

The LLM is responsible for natural-language query understanding and answer synthesis. It is not the source of legal validity. Effective status, supersession scope, graph traversal, and citation eligibility must be resolved deterministically by backend services before evidence is given to the model.

The current technology choices are appropriate for the hackathon and should remain:

- FastAPI backend;
- React and Vite frontend;
- SQLite as the legal metadata source of truth;
- FAISS semantic retrieval;
- BM25 lexical retrieval;
- Reciprocal Rank Fusion;
- NetworkX graph projection;
- OpenAI-compatible chat, embedding, and optional reranking endpoints.

Do not migrate to Neo4j, Qdrant, Milvus, a workflow framework, or a full OCR platform during the remaining hackathon window. Those are reasonable pilot-stage options, but they do not improve the judged vertical slice as much as correctness, evaluation, safety, and demo reliability.

The implementation order is:

1. verify repository and deployment security;
2. make legal-state resolution deterministic;
3. make graph traversal independent of LLM tool support;
4. strengthen grounding and conflict evidence;
5. prove the improvement with a fair benchmark;
6. polish the user workflow and deployment;
7. complete all mandatory submission artifacts.

## 2. Source documents and constraints

This plan is based on:

- docs/hackathon_guide.md;
- docs/system/problem-statement.md;
- docs/system/problem-analysis.md;
- docs/system/architecture.md;
- the current backend, frontend, database, and deployment configuration;
- the VAIC scoring rubric and submission requirements.

Hard constraints:

- The product must be AI-native rather than a conventional search page with a chatbot attached.
- The application must execute real retrieval and generation logic, not hardcoded answers or static mockups.
- Cross-references, amendments, partial supersession, conflicts, and citations are central challenge requirements.
- The mandatory submission package contains presentation slides, a demo video of at most five minutes, a public GitHub repository, a live URL, and an AI collaboration log.
- Banking, personal, and internal data must be protected.
- The prototype must not be presented as a substitute for professional legal review.

Planning assumptions:

- The primary user is an internal compliance or legal-operations employee.
- Customer-facing access is a later phase because it needs stricter authorization and disclosure controls.
- Public regulations and clearly labelled sample internal policies are sufficient for the hackathon demo.
- Sample internal documents must not be represented as confidential or official SHB production policy.
- Current validity defaults to the server date unless the user selects an as-of date.
- Unknown or ambiguous legal status results in a warning or abstention, not an active-by-default assumption.

## 3. Current repository audit

The repository already contains a substantial prototype. The correct approach is to harden and prove it rather than rebuild it.

### 3.1 Implemented capabilities

| Area | Existing capability |
|---|---|
| API | FastAPI routes for health, models, chat, graph, administration, and evaluation |
| Retrieval | FAISS, BM25, RRF, exact document lookup, and optional reranking |
| Graph | NetworkX document, article, and clause nodes with contains, references, and supersedes edges |
| Temporal filtering | Excludes chunks with incoming supersession edges at clause, article, or document scope |
| Chat | Query decomposition, multi-turn conversation, SSE streaming, citations, and optional reference-search tools |
| Trust | Citation ID/status validation and explicit conflict-analysis states |
| Conflict analysis | Compares external regulation with internal policy when both are retrieved |
| Administration | Document browsing and Markdown ingestion with validation, locking, backup, rollback, and pipeline refresh |
| Frontend | Chat, source sidebar, graph, version timeline, clause comparison, conflicts, admin, and benchmark views |
| Deployment | Vercel frontend and Render backend configuration |

Observed bundled data:

- 11 documents;
- 1,281 chunks;
- 56 reference relations;
- 1 supersession relation.

Observed current offline benchmark:

- Standard Hit@5: 90 percent;
- Advanced Hit@5: 90 percent;
- superseded results returned by Standard: 1;
- superseded results returned by Advanced: 0.

This demonstrates one valuable behavior, but it is too narrow to prove that the full Advanced RAG architecture consistently outperforms Standard RAG.

### 3.2 Highest-priority gaps

1. There are no repository-owned automated tests for parsing, temporal logic, graph traversal, citations, ingestion rollback, or API behavior.
2. Cross-reference following partly depends on model tool calling. Tool support is disabled or inconsistent for some configured providers, so a required capability is not deterministic.
3. Current temporal filtering is primarily current-status filtering. It does not fully support historical as-of questions, future-effective documents, multi-hop amendment chains, or conflicting successors.
4. Only one supersession example is present, which is not enough to prove partial replacement, chains, or boundary cases.
5. Relationship extraction supports a constrained set of Vietnamese patterns and can silently miss unsupported wording.
6. Citation validation verifies IDs and inactive status but does not ensure that every legal or numeric claim is supported by the cited passage.
7. Conflict detection is LLM-led and should have deterministic candidate pairing, exact evidence IDs, and conservative output semantics.
8. The benchmark compares a keyword baseline with keyword retrieval plus filtering rather than comparing Standard vector RAG with the complete Advanced path.
9. Document IDs are derived from file enumeration during rebuild, so adding or reordering files may change durable identities.
10. Some documents lack reliable effective dates while still being represented as active.
11. The production document-upload operation needs authentication or must be disabled in public demo mode.
12. A full-history secret scan should remain a release gate even though active credentials have been removed from the working tree and moved to private storage.

## 4. Product outcome

### 4.1 Primary persona

Compliance officer or legal-operations specialist:

- asks regulatory questions in Vietnamese;
- needs the effective answer for a specific date;
- wants the exact article, clause, and source passage;
- investigates how a provision changed;
- compares external rules with internal procedures;
- prefers a clear insufficient-evidence result over an unsupported answer.

### 4.2 Secondary persona

Document administrator:

- uploads a new regulation or internal procedure;
- verifies extracted metadata and structure;
- reviews proposed reference and supersession relations;
- activates the update after validation;
- inspects an ingestion audit result.

### 4.3 Critical user stories

1. When a user asks whether an older eKYC clause still applies, the answer identifies the active replacement and shows both the supersession source and target.
2. When a relevant clause references another document, the backend follows that reference even if the selected LLM cannot call tools.
3. When an internal policy appears inconsistent with an effective external rule, the system shows a potential-conflict warning with both exact passages.
4. When evidence is missing, future-effective, expired, or ambiguous, the system abstains and explains what is missing.
5. When an administrator uploads a valid structured document, the system performs a real parse, rebuild, integrity check, activation, and pipeline refresh.

## 5. Hackathon definition of success

The vertical slice is complete when the live application can demonstrate all of the following:

- Vietnamese natural-language questions produce concise answers with clickable clause-level citations.
- A stale clause appears in the Standard baseline but never enters the Advanced generation context.
- A partial supersession invalidates only the targeted clause or point; unaffected sibling provisions stay active.
- At least one cross-document reference is expanded deterministically by the server.
- A version timeline and old/new clause comparison are visible.
- A potential internal/external conflict includes evidence on both sides.
- An unsupported question produces an explicit abstention.
- The admin path performs a real indexing operation, not only a UI update.
- The offline benchmark is reproducible without paid external APIs.
- The public repository contains no active secret or confidential dataset.
- The live application completes the rehearsed demo without manual code or database changes.

### 5.1 Rubric alignment

| Rubric category | Evidence to show |
|---|---|
| Technical implementation and engineering depth | Real ingestion, hybrid retrieval, deterministic graph traversal, date-aware resolution, SSE, rollback, tests, and error states |
| AI-native architecture and innovation | LLM query planning and synthesis around a temporal clause graph, structured conflict analysis, and adaptive evidence assembly |
| Business viability and pilot pathway | Compliance workflow, measurable KPIs, private deployment path, human review, and a six-week pilot |
| AI-native UX and design thinking | Processing trace, early evidence display, clickable citations, graph, timeline, diff, and one-click demo scenarios |
| AI safety, grounding, and trust | Fail-closed filtering, exact evidence, abstention, prompt-injection boundaries, private secrets, and protected administration |
| Presentation, demo, and defensibility | Baseline failure followed by Advanced success, measured metrics, clear trade-offs, and a rehearsed fallback |

## 6. Scope and priorities

### 6.1 P0 — required before submission

- Verify the public working tree and Git history contain no live credentials.
- Protect or disable document mutation in the public deployment.
- Introduce stable document and provision identifiers.
- Implement deterministic date-aware effective-version resolution.
- Implement bounded server-side graph expansion.
- Strengthen citation and abstention behavior.
- Ground conflict results in exact evidence identifiers.
- Add automated tests.
- Add a version-aware gold benchmark.
- Rehearse and polish four core demo scenarios.
- Complete all five submission artifacts.

### 6.2 P1 — complete only after P0 is green

- Add an as-of date selector to the UI.
- Add ingestion preview and relation approval.
- Extend clause and point-level Vietnamese relationship patterns.
- Add query latency and model-usage telemetry.
- Add a digitally generated PDF text adapter.
- Add word-level amendment diff highlighting.

### 6.3 P2 — pilot roadmap

- OCR and table/layout recovery for scans.
- Persistent graph database after scale measurements justify it.
- Managed vector/search infrastructure after operational testing.
- Full SSO, RBAC, document-level authorization, DLP, malware scanning, and immutable audit logs.
- Incremental background ingestion queues.
- Fine-tuned Vietnamese legal embeddings or reranking.
- Customer-facing access.

### 6.4 Non-goals

- Do not claim zero hallucinations.
- Do not claim automated legal approval.
- Do not ingest every bank document during the hackathon.
- Do not autonomously change internal policy.
- Do not migrate infrastructure only to make the architecture diagram look more complex.
- Do not treat an LLM conflict result as a binding legal conclusion.

## 7. Target architecture

High-level request path:

    Compliance user
        |
        v
    React evidence workspace
        |
        v
    FastAPI
        |
        +--> Query planner
        |       |
        |       v
        |    Exact lookup + FAISS + BM25 + RRF
        |       |
        |       v
        |    Deterministic graph expansion
        |       |
        |       v
        |    As-of effective-version resolver
        |       |
        |       v
        |    Optional reranker and evidence packer
        |
        +--> Conflict candidate selector and classifier
        |
        +--> Grounded answer generator
                |
                v
             Citation and abstention guard
                |
                v
             Answer, evidence, warnings, and graph

Storage responsibilities:

- SQLite owns durable document, provision, version, and relationship facts.
- FAISS is a derived semantic index.
- NetworkX is a derived graph projection.
- Source Markdown documents are rebuild inputs.
- The LLM may propose query plans or relation candidates, but unreviewed model output must not become authoritative legal state.

## 8. Legal data model

### 8.1 Entities

| Entity | Required fields | Responsibility |
|---|---|---|
| Document | stable ID, number, title, issuer, type, publication/effective/expiry dates, status, source, checksum, confidentiality | Identity and lifecycle of a source |
| Provision | stable logical ID, document ID, chapter, section, article, clause, point, normalized locator | Addressable legal unit |
| ProvisionVersion | version ID, provision ID, exact text, valid-from, valid-to, status, source document, review state | Temporal content selected by resolution |
| Relation | source, target, type, scope, validity, source evidence, confidence, review state | Reference and modification edges |
| IngestionJob | ID, filename, checksum, status, counts, error, timestamps, actor | Observable update workflow |
| ConflictFinding | query ID, evidence IDs, type, severity, explanation, recommendation, review state | Traceable potential conflict |

For hackathon delivery, these may remain SQLite tables. If a complete migration is risky, add missing temporal and review fields to the existing schema while retaining compatibility with current services.

### 8.2 Stable identifiers

- Document ID: normalized official document number when available; otherwise a deterministic hash of issuer, title, and publication date.
- Provision ID: document ID plus normalized article, clause, and point locator.
- Version ID: provision ID plus valid-from date and content checksum.
- File enumeration order must never be used as durable identity.
- FAISS integer IDs remain implementation details mapped to version IDs in SQLite.

### 8.3 Relations

- CONTAINS: document or parent provision contains a child provision.
- REFERENCES: a source provision refers to another document or provision.
- AMENDS: a source changes target language or effect.
- SUPERSEDES: a newer version replaces an exact target scope.
- REPEALS: a source invalidates a complete target scope.
- IMPLEMENTS: an internal policy operationalizes an external requirement.
- POTENTIALLY_CONFLICTS_WITH: a derived review finding, not curated legal truth.

Every modifying relation records:

- exact source and target;
- scope: document, article, clause, or point;
- effective date;
- source passage proving the relation;
- extraction method and confidence;
- review status.

### 8.4 Effective-version algorithm

Input:

- candidate provision versions;
- as-of date T;
- reviewed modification graph.

Algorithm:

1. Exclude documents that become effective after T.
2. Exclude versions whose validity ended before T.
3. Exclude explicitly repealed content.
4. For every candidate, inspect incoming applicable AMENDS, SUPERSEDES, and REPEALS edges.
5. Apply relation scope exactly:
   - document scope affects the document and all descendants;
   - article scope affects the article and its descendants;
   - clause or point scope affects only that target.
6. Follow modification chains until no newer effective successor remains.
7. Detect graph cycles and more than one simultaneously active successor.
8. When the graph is ambiguous, return an ambiguous-state warning instead of selecting arbitrarily.
9. Select the newest reviewed effective version for generation.
10. Keep excluded versions only for the audit trace, timeline, diff, and Standard baseline.
11. Return included, superseded, expired, future, unknown, and ambiguous evidence with reasons.

This logic should live in one unit-testable backend service, preferably backend/app/rag/effective_resolver.py. Retrieval, graph, citations, and UI must consume the same result instead of implementing different definitions of active status.

## 9. Ingestion pipeline

### 9.1 Hackathon input format

P0 supports structured UTF-8 Markdown because the current implementation is functional and the format preserves legal hierarchy. P1 can add digitally generated PDF text extraction, but all source formats must normalize to the same internal representation.

Required metadata:

- title;
- document number;
- issuer and document type;
- publication and effective dates when known;
- expiry date or status when known;
- source and provenance;
- hierarchical Điều, Khoản, and Điểm locators.

### 9.2 Processing stages

1. Validate filename, extension, size, encoding, required heading, and duplicate checksum.
2. Parse legal hierarchy rather than splitting by arbitrary character length.
3. Preserve exact source text and normalized locators.
4. Normalize Vietnamese document numbers and dates.
5. Create stable document, provision, and version IDs.
6. Extract deterministic reference and modification candidates from Vietnamese legal phrases.
7. Store the source passage supporting every proposed relationship.
8. Optionally ask an LLM to classify ambiguous relationships using a strict schema.
9. Mark model-produced relationships as proposed until reviewed.
10. Validate relationship targets against known document numbers and provision locators.
11. Leave unresolved targets visible rather than dropping them silently.
12. Generate passage embeddings with the configured model and dimension.
13. Write SQLite and FAISS to staging artifacts.
14. Run integrity checks.
15. Atomically activate both artifacts.
16. Load a new pipeline from activated artifacts.
17. Swap the application pipeline only after loading succeeds.
18. Roll back document and artifacts on any failure.
19. Record ingestion counts, warnings, duration, and error.

### 9.3 Activation integrity checks

- stable IDs are unique;
- every FAISS ID maps to exactly one provision version;
- embedding dimension matches the active index;
- temporal ranges are valid;
- reviewed relationship targets exist;
- unresolved targets are recorded;
- no unreviewed edge can invalidate reviewed active content;
- modification edges contain no cycle;
- at least one active provision exists;
- the new pipeline can open SQLite, FAISS, and graph artifacts.

### 9.4 Admin workflow

P0:

- safe Markdown upload;
- progress state;
- extracted document, provision, reference, and supersession counts;
- validation warnings;
- success or rollback result;
- pipeline refresh.

P1:

1. upload and parse;
2. preview document metadata and hierarchy;
3. inspect proposed relations and confidence;
4. approve or reject low-confidence proposals;
5. commit and activate;
6. inspect the ingestion audit record.

## 10. Query pipeline

### 10.1 Request contract

The request contains:

- conversation messages;
- selected model;
- stream preference;
- optional as-of date.

The backend validates the date and applies the server date by default. Client-supplied system messages are ignored.

### 10.2 Query planning

- Keep the latest original user question in every retrieval run.
- Use conversation history only to resolve follow-up context.
- Cap conversation history and generated subqueries.
- Extract explicit document numbers, articles, clauses, points, dates, actors, actions, limits, and comparison intent deterministically.
- Use an LLM only for decomposition that cannot be resolved deterministically.
- If decomposition fails, retrieve with the original question.

### 10.3 Hybrid retrieval

1. Exact document and provision lookup for explicit identifiers.
2. FAISS semantic retrieval.
3. BM25 lexical retrieval for exact legal phrases, numbers, and document codes.
4. Reciprocal Rank Fusion with component ranks recorded.
5. Optional reranking.
6. If reranking is unavailable, preserve RRF order.
7. Retrieve a broad pool before filtering so excluded stale evidence can be measured.

### 10.4 Deterministic graph expansion

Graph expansion happens server-side for all providers:

- expand outgoing REFERENCES edges from strong candidates;
- include effective successors of stale candidates;
- include parent article and document paths for explainability;
- default to depth one;
- cap total expanded nodes;
- deduplicate by provision version;
- detect cycles;
- record the path that caused inclusion.

LLM tool calling may remain an optional recovery path, but it cannot be the only mechanism that handles cross-references.

### 10.5 Temporal resolution and evidence packing

- Resolve all exact, semantic, lexical, and graph-expanded candidates for the as-of date.
- Remove stale evidence before answer generation.
- Record every exclusion reason.
- Balance evidence across subqueries and source types.
- Cap by token budget as well as chunk count.
- Freeze the final evidence pack before assigning citation numbers.
- Include document number, article, clause, dates, status, exact passage, retrieval score, and graph path in each citation.

### 10.6 Grounded generation

The model receives:

- a clear legal-assistant role;
- the user question and as-of date;
- a strict refusal and uncertainty policy;
- delimited untrusted evidence blocks;
- citation IDs that may be used but not invented;
- an effective-resolution summary;
- instructions to distinguish factual answer, uncertainty, and potential conflict.

Preferred answer structure:

1. direct answer;
2. applicable rule and effective date;
3. amendment or reference explanation;
4. uncertainty or potential-conflict warning;
5. recommended human action.

### 10.7 Citation and abstention guard

Before returning the answer:

- remove unknown citation IDs;
- reject citations to excluded, future, expired, or unreviewed evidence;
- require citations for legal conclusions, numbers, dates, thresholds, and named provisions;
- check that cited passages contain or support the corresponding claim;
- remove unsupported claims;
- abstain when no active evidence supports the requested conclusion;
- preserve analysis-failed as a distinct state;
- return warnings and the legal-state trace.

Safe failure message:

> Không tìm thấy đủ căn cứ đang có hiệu lực để kết luận.

The response should then explain which date, source, or relationship is missing.

## 11. Conflict detection

Conflict detection produces conservative potential findings, not automatic legal judgments.

### 11.1 Candidate selection

Compare provisions only when the effective evidence contains:

- at least one external legal or regulatory source;
- at least one internal policy;
- overlapping subject, actor, action, amount, deadline, eligibility rule, or obligation;
- compatible effective dates and scopes.

Authority tiers such as law, decree, circular, and internal policy are review metadata rather than a complete legal conclusion.

### 11.2 Structured classification

For each candidate pair, require:

- conflict type;
- severity;
- external evidence ID;
- internal evidence ID;
- concise explanation;
- recommended compliance review action;
- confidence;
- uncertainty.

Supported conflict types:

- numeric limit;
- obligation versus prohibition;
- eligibility condition;
- timing or deadline;
- scope mismatch;
- version lag;
- other.

Reject findings whose evidence IDs are not present in the effective evidence pack. The UI must use wording such as potential conflict detected.

### 11.3 Required conflict test cases

- exact numeric contradiction;
- internal rule stricter than an external minimum;
- internal rule looser than an external maximum;
- same topic but different customer scope;
- same rule with different effective dates;
- only one source class retrieved;
- invalid model schema;
- provider failure.

## 12. Backend implementation map

| Path | Planned change |
|---|---|
| backend/indexing/build_index.py | Replace order-based IDs and persist richer temporal and relation metadata |
| backend/indexing/legal_parser.py | New pure parser functions for hierarchy, dates, identifiers, and stable IDs |
| backend/indexing/relation_extractor.py | New deterministic relation candidates with source spans and confidence |
| backend/app/rag/effective_resolver.py | New authoritative as-of and scoped-supersession service |
| backend/app/rag/knowledge_graph.py | Exact target scopes, bounded traversal, paths, and cycle detection |
| backend/app/rag/retrieval.py | Exact lookup first, component scores, resolver integration, inclusion reasons |
| backend/app/rag/pipeline.py | Original-query retention, deterministic graph expansion, frozen evidence, trace events |
| backend/app/rag/citation_guard.py | Active-evidence and legal-claim coverage validation |
| backend/app/rag/conflict_detector.py | Candidate pairs, evidence IDs, schema validation, conservative wording |
| backend/app/services/benchmark_service.py | Fair Standard versus Advanced benchmark and expanded metrics |
| backend/app/services/ingestion_service.py | Integrity checks, stable results, optional preview and approval |
| backend/app/api/schemas/chat.py | Optional validated as-of date |
| backend/app/api/routes/chat.py | Resolution trace and backward-compatible SSE events |
| backend/app/api/routes/documents.py | Admin authorization or public mutation disablement |
| backend/tests | New unit, integration, API, and regression tests using temporary artifacts |

All backend filesystem paths must continue to come from backend/app/core/paths.py.

Do not refactor unrelated modules while implementing these changes.

## 13. API and streaming contract

### 13.1 Chat request fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| messages | list | yes | User and assistant messages only |
| stream | boolean | no | Defaults to true in the UI |
| model | string or null | no | Must be present in the safe model catalog |
| as_of | ISO date or null | no | Defaults to current server date |

### 13.2 Final result fields

- answer text;
- resolved as-of date;
- validated citations;
- source evidence;
- included and excluded resolution trace;
- citation warnings;
- potential conflicts;
- conflict status;
- evidence graph;
- timing metadata safe to expose.

### 13.3 SSE lifecycle

1. query-plan processing and done;
2. retrieval processing and done;
3. graph-expansion processing and done;
4. temporal-resolution done;
5. context-ready with citations;
6. answer start;
7. answer streaming;
8. answer done or error.

Frontend requirements:

- ignore unknown future event types;
- never interpret context-ready as final answer completion;
- preserve validated evidence if generation fails;
- make error, insufficient evidence, and no conflict distinct states.

## 14. Frontend plan

### 14.1 Chat

- Keep one-click sample questions mapped to gold evaluation cases.
- Show the resolved as-of date.
- Show processing states that correspond to real backend stages.
- Display citations as soon as the evidence pack is ready.
- Separate cited sources from other supporting evidence.
- Show exact locator, effective dates, status, and retrieval path.
- Render abstention and analysis failure prominently.

### 14.2 Amendment timeline and diff

- Show the old version as superseded rather than active.
- Show the active successor and effective date.
- Show the source provision that caused the transition.
- Preserve exact scope so unaffected sibling clauses are visible.
- Add word-level additions and deletions only after the basic timeline is correct.

### 14.3 Graph

- Default to the current query evidence subgraph.
- Bound nodes and depth to avoid browser overload.
- Distinguish document, article, clause, reference, and supersession visually.
- Clicking a citation should open or highlight the corresponding graph node where practical.
- Full-corpus graph remains an optional exploratory view.

### 14.4 Conflict view

- Display both exact passages.
- Display source type and effective date.
- Use warning language rather than declaring illegality.
- Show the recommended reviewer action.
- Preserve detected, no conflict in evidence, insufficient evidence, and analysis failed states.

### 14.5 Admin

- Browsing may remain public for the demo corpus.
- Upload requires server-side authorization or is hidden in public mode.
- Show progress, counts, warnings, success, and rollback failures.
- Do not expose provider errors, credentials, stack traces, or filesystem paths.

### 14.6 Accessibility and resilience

- Keyboard-accessible controls.
- Text labels in addition to color.
- Mobile evidence drawer.
- Sanitized Markdown.
- Retry state for network and provider failures.
- Responsive graph and document panels.

## 15. Security, privacy, and trust

### 15.1 Repository and secret controls

- Keep production credentials outside the public repository.
- Do not copy private credentials into project files, AI logs, screenshots, or terminal recordings.
- Run a full-history secret scan before submission.
- Revoke any credential found in historical commits.
- Keep local environment files ignored.
- Use placeholders only in .env.example.
- Add CI secret scanning if time permits.

The private credentials repository is an operational boundary. This implementation plan does not require reading or modifying it.

### 15.2 Application controls

- Authenticate or disable mutation-capable admin endpoints in public mode.
- Add upload size, extension, content, and concurrency limits.
- Restrict CORS and trusted hosts.
- Use HTTPS only.
- Apply rate limits or platform protections to chat and ingestion.
- Treat document passages as untrusted prompt content.
- Delimit evidence and tell the model to ignore commands embedded in documents.
- Avoid logging confidential passages, personal data, and model credentials.
- Return safe client errors and keep detailed diagnostics server-side.

### 15.3 Legal trust controls

- State the resolved date.
- Represent unknown dates and status explicitly.
- Cite every legal or numeric conclusion.
- Allow inspection of exact passages.
- Show amendment lineage.
- Require human review for potential conflicts.
- Keep a visible legal disclaimer.

## 16. Testing and evaluation

### 16.1 Unit tests

- parse Điều, Khoản, and Điểm;
- normalize dates and document numbers;
- stable IDs across file reorder;
- reference extraction;
- document, article, clause, and point supersession scope;
- direct, partial, chained, future, expired, and historical resolution;
- unaffected sibling clauses;
- modification cycles;
- ambiguous active successors;
- citation ID and status validation;
- claim coverage and abstention;
- conflict schema and evidence ID validation.

### 16.2 Integration tests

- build a temporary SQLite database from small fixtures;
- build or fake the semantic index deterministically;
- compare Standard and Advanced retrieval;
- expand a cross-reference;
- replace a stale version;
- upload a valid document;
- reject duplicate or invalid input;
- roll back after rebuild failure;
- load a new pipeline before application swap.

### 16.3 API tests

- health and model catalog;
- empty chat request;
- invalid model;
- invalid as-of date;
- non-streaming result contract;
- SSE lifecycle and terminal error;
- graph filtering;
- document pagination;
- protected public upload;
- deterministic benchmark.

### 16.4 Frontend verification

- npm run lint;
- npm run build;
- desktop and mobile manual smoke checks;
- sample question to citation;
- citation to graph/timeline;
- conflict-state display;
- benchmark display;
- provider and network error state.

No automated CI test should require a paid external model. Use deterministic fixtures and fakes. Run a separate labelled live-provider smoke test before the demo.

### 16.5 Gold evaluation set

Create at least 30 reviewed cases:

- 8 direct retrieval and document-number cases;
- 6 cross-reference cases;
- 8 amendment, partial supersession, and as-of cases;
- 4 conflict or non-conflict cases;
- 4 insufficient-evidence or adversarial cases.

Every case records:

- question;
- optional as-of date;
- expected active provision IDs;
- forbidden stale provision IDs;
- required reference path;
- gold facts;
- acceptable citations;
- expected conflict state;
- expected abstention state.

Evaluation fixtures must declare whether they are public-source, internally supplied, or synthetic/sample.

### 16.6 Fair baseline

Run both systems on the same:

- corpus;
- questions;
- embedding model;
- generator where answer quality is measured;
- top-k.

Standard RAG:

- vector retrieval only;
- no graph expansion;
- no temporal filtering.

Advanced RAG:

- exact lookup;
- vector plus BM25 plus RRF;
- graph expansion;
- effective resolver;
- same answer generator.

Report:

- Recall@5;
- MRR;
- current-version accuracy;
- stale-evidence leakage;
- reference-completion rate;
- citation precision and recall;
- reviewed answer faithfulness;
- conflict precision and recall;
- abstention correctness;
- p50 and p95 time to evidence;
- p50 and p95 total answer latency.

### 16.7 Acceptance targets

- zero forbidden stale provisions in Advanced generation context;
- at least 90 percent Recall@5;
- material improvement over Standard on version-aware cases;
- 100 percent effective-version accuracy on the curated amendment cases;
- at least 95 percent citation precision on reviewed answers;
- 100 percent abstention on deliberately insufficient-evidence cases;
- no false no-conflict result when analysis fails;
- green frontend lint/build and backend tests.

These are targets, not existing measurements. Slides must show measured results only.

## 17. Execution plan

Estimates below are focused person-hours and can run in parallel. If time is shorter, remove P1 work. Never remove security verification, effective resolution, evidence correctness, or mandatory submission work.

### Phase 0 — freeze and secure, 0 to 2 hours

- [ ] SEC-01: run working-tree and full-history secret scans.
- [ ] SEC-02: confirm no credentials appear in logs, screenshots, or collaboration notes.
- [ ] SEC-03: protect or disable public document upload.
- [ ] PM-01: freeze four demo questions and expected results.
- [ ] TEST-01: create backend test scaffolding and legal fixtures.

Exit gate:

- public repository security is acceptable;
- every demo question has reviewed expected evidence.

### Phase 1 — deterministic legal state, 2 to 7 hours

- [ ] DATA-01: add stable document, provision, and version IDs.
- [ ] DATA-02: add temporal and relation-scope fields.
- [ ] RAG-01: implement EffectiveResolver.
- [ ] RAG-02: centralize all active/superseded decisions through the resolver.
- [ ] TEST-02: test current, historical, future, partial, full, and chained changes.

Exit gate:

- stale evidence cannot enter Advanced context;
- unaffected sibling provisions remain active.

### Phase 2 — deterministic Graph-RAG, 5 to 10 hours

- [ ] GRAPH-01: implement bounded reference expansion independent of LLM tools.
- [ ] GRAPH-02: return traversal paths and exclusion reasons.
- [ ] RAG-03: preserve original query and exact-identifier lookup.
- [ ] RAG-04: freeze evidence before numbering citations.
- [ ] TEST-03: cover cycles, missing targets, provider-without-tools, and context budget.

Exit gate:

- the cross-reference scenario works with tools enabled or disabled.

### Phase 3 — trust and evaluation, 8 to 14 hours

- [ ] SAFE-01: enforce legal-claim citation coverage.
- [ ] SAFE-02: implement fail-closed abstention.
- [ ] CONFLICT-01: add deterministic candidate pairing and evidence validation.
- [ ] EVAL-01: create the 30-case gold set.
- [ ] EVAL-02: run fair Standard and Advanced benchmarks.
- [ ] TEST-04: cover citations, conflicts, APIs, rollback, and benchmark regressions.

Exit gate:

- zero stale leakage on the gold set;
- every displayed finding has exact valid evidence.

### Phase 4 — UX and deployment, 12 to 18 hours

- [ ] UX-01: display as-of date and temporal trace.
- [ ] UX-02: verify citations, graph, timeline, diff, conflicts, and errors.
- [ ] OPS-01: run lint, build, compile, tests, and local endpoint smoke checks.
- [ ] OPS-02: deploy frontend and backend.
- [ ] OPS-03: verify Vercel rewrites, SSE, Render health, and cold-start behavior.
- [ ] OPS-04: complete three full demo rehearsals.

Exit gate:

- the live demo succeeds without manual intervention.

### Phase 5 — submission, parallel and deadline-bound

- [ ] SUB-01: public GitHub cleanup and Vietnamese README.
- [ ] SUB-02: presentation slides.
- [ ] SUB-03: demo video no longer than five minutes.
- [ ] SUB-04: live URL verification from a clean browser.
- [ ] SUB-05: redacted AI collaboration log.
- [ ] SUB-06: two-person final link and form audit.

Exit gate:

- all five mandatory deliverables open without team credentials.

## 18. Suggested ownership

For a four-person team:

| Workstream | Responsibility |
|---|---|
| Data and graph | Parser, stable IDs, schema, relation extraction, graph, effective resolver |
| RAG and evaluation | Retrieval, pipeline, citations, conflicts, gold set, automated tests |
| Frontend and UX | Chat, evidence, graph, timeline, diff, admin, benchmark, accessibility |
| Product, demo, and operations | Domain review, deployment, security checks, slides, video, collaboration log |

For two people:

- combine data/graph with RAG/evaluation;
- combine frontend with product/operations.

For five or six people:

- separate QA/evaluation;
- separate deployment and presentation.

One integration owner decides whether a change is demo-ready.

## 19. Demo plan

The main demo should tell one compliance-risk story rather than touring every tab.

### 19.1 Four-minute-thirty-second script

0:00 to 0:30 — Problem:

- Explain that semantic similarity can retrieve a legally stale clause.
- State the compliance consequence.

0:30 to 1:30 — Effective answer:

- Ask whether the older eKYC provision still applies.
- Show retrieval, graph, and temporal-resolution stages.
- Open the active citation.

1:30 to 2:20 — Amendment explanation:

- Open the evidence graph.
- Show the supersession edge.
- Show the version timeline and old/new text.
- Explain that only the targeted scope is replaced.

2:20 to 3:10 — Potential conflict:

- Ask whether a sample internal limit complies with the effective external rule.
- Show both passages.
- Show the conservative warning and recommended human review.

3:10 to 3:45 — Safe failure:

- Ask one deliberately unsupported question.
- Show abstention rather than hallucination.

3:45 to 4:20 — Proof:

- Open the benchmark.
- Show Standard stale leakage and Advanced results.

4:20 to 4:30 — Value:

- Summarize faster review, reduced stale-rule risk, and pilot readiness.

Keep admin ingestion for judge follow-up unless it is fast and thoroughly rehearsed.

### 19.2 Demo question categories

1. current version after partial supersession;
2. cross-reference requiring another document;
3. potential internal/external conflict;
4. insufficient active evidence.

The main judged questions must be verified and rehearsed. The product remains free-form, but the presentation should not depend on an untested prompt.

## 20. Mandatory deliverables

### 20.1 Presentation slides

Recommended ten slides:

1. compliance risk and user;
2. why Standard RAG fails;
3. product promise;
4. temporal clause graph;
5. Advanced retrieval and trust pipeline;
6. citations, graph, diff, and conflict UX;
7. benchmark and measured results;
8. privacy, security, and private deployment;
9. business KPIs and six-week pilot;
10. team, live URL, and call to action.

### 20.2 Demo video

- Maximum five minutes; target four minutes thirty seconds.
- Record the working product rather than slides.
- Use readable zoom and captions.
- Demonstrate real backend responses.
- Show exact evidence.
- Redact secrets, private repository content, personal data, and terminal history.

### 20.3 Public GitHub repository

- Vietnamese README with install, run, test, benchmark, and demo instructions.
- Architecture and data-flow diagrams.
- Placeholder-only environment example.
- Reproducible offline benchmark.
- Environment version requirements.
- Data provenance and sample-data disclaimer.
- Known limitations and legal disclaimer.
- No credentials, confidential files, local environment, or private-repository content.

### 20.4 Live URL

- Verify from incognito and a separate network.
- Test health, model list, chat, SSE, graph, documents, and benchmark.
- Test Vercel-to-Render rewrites.
- Verify useful cold-start loading feedback.
- Keep mutation endpoints protected.
- Warm the service before judging only when platform rules allow.

### 20.5 AI collaboration log

Record:

- timestamp;
- task;
- AI tool or model;
- request summary;
- generated suggestion;
- human decision;
- files or behavior changed;
- verification performed;
- rejected suggestions and reason.

Redact credentials, private URLs, personal data, and confidential document content.

## 21. Business viability and pilot

### 21.1 Value hypothesis

Position the product as a compliance copilot that reduces time spent finding and cross-checking effective regulations while reducing the risk of using stale guidance.

Do not claim measured time savings until a pilot validates them.

### 21.2 Six-week pilot

Week 1 — governance and dataset:

- choose a bounded domain such as eKYC or retail lending;
- agree ownership, confidentiality, retention, and reviewer roles;
- curate 100 to 200 approved documents;
- create a 100-question gold set.

Weeks 2 and 3 — ingestion and validation:

- ingest documents in a private environment;
- review extraction confidence and unresolved links;
- validate amendment chains;
- tune retrieval and resolution.

Week 4 — user acceptance:

- 10 to 20 legal or compliance users;
- shadow-mode usage;
- capture correctness, citation usefulness, time, and failures.

Week 5 — controlled trial:

- run alongside the manual process;
- require human approval;
- review every high-severity conflict and abstention.

Week 6 — decision gate:

- compare KPIs, error severity, operating cost, security findings, and adoption;
- decide whether to expand, improve, or stop.

### 21.3 Pilot KPIs

- median search and review time;
- current-version accuracy;
- stale-evidence leakage;
- citation precision;
- evidence-click rate;
- correct abstention;
- critical, major, and minor error counts;
- reviewer acceptance of conflict findings;
- task completion and satisfaction;
- latency and availability;
- model and embedding cost per answer;
- document ingestion review time.

### 21.4 Production evolution

- private or on-premise models where required;
- SSO and RBAC;
- document-level authorization;
- immutable audit logs;
- encryption and approved retention;
- incremental background ingestion;
- OCR, layout, and table extraction;
- graph/vector infrastructure selected from measured scale needs;
- continuous evaluation against reviewed legal changes.

## 22. Risk register

| Risk | Probability | Impact | Mitigation |
|---|---:|---:|---|
| Credential appears in current or historical public content | Medium | Critical | Full-history scan, revoke findings, private secret storage |
| Superseded clause reaches generation | Medium | Critical | Central resolver, zero-leak tests, fail closed |
| Relationship extraction is incomplete | High | High | Deterministic patterns, evidence spans, unresolved warnings, review |
| LLM invents a citation or conflict | Medium | High | Evidence allowlist, schema validation, guard, conservative language |
| Provider cannot call tools | Known | High | Server-side graph expansion |
| Unknown effective date appears active | High | High | Explicit unknown state and abstention |
| Benchmark appears cherry-picked | Medium | High | Published cases, fair shared settings, per-case results |
| Public admin operation is abused | Medium | High | Authentication or disablement, rate and size limits |
| Rebuild changes IDs or fails | Medium | High | Stable IDs, staging, integrity checks, atomic swap, rollback |
| Live service cold-start or quota failure | Medium | High | Rehearsal, warm-up, clear loading, local fallback |
| Graph overwhelms the browser | Medium | Medium | Query-specific bounded subgraph |
| Demo exceeds five minutes | Medium | Medium | Four-minute-thirty-second script and rehearsals |
| Sample policy is mistaken for official policy | Medium | High | Visible sample and provenance labels |
| Team expands into OCR or migration | Medium | High | Enforce P0, P1, P2 boundaries |

## 23. Final definition of done

### Product

- [ ] Four demo questions pass locally and live.
- [ ] No forbidden stale evidence reaches Advanced generation.
- [ ] Cross-reference expansion works with LLM tools disabled.
- [ ] Timeline and diff use the same version graph as retrieval.
- [ ] Conflict output uses exact evidence IDs.
- [ ] Unsupported questions abstain.
- [ ] Public upload is protected or disabled.

### Engineering

- [ ] Stable IDs survive input reorder.
- [ ] Parser tests pass.
- [ ] Resolver and graph tests pass.
- [ ] Retrieval, citation, and conflict tests pass.
- [ ] API and rollback tests pass.
- [ ] Frontend lint and build pass.
- [ ] Backend compiles and starts.
- [ ] Offline benchmark is reproducible.
- [ ] Live smoke tests pass.

### Trust and security

- [ ] No live secret exists in the public tree or history.
- [ ] Public data contains no confidential or personal information.
- [ ] Dates, status, and disclaimer are visible.
- [ ] Document prompt injection boundaries are tested.
- [ ] Admin access and error handling are tested.

### Submission

- [ ] Slides open and contain measured results.
- [ ] Demo video is no more than five minutes.
- [ ] Public repository installs from the Vietnamese README.
- [ ] Live URL works without team credentials.
- [ ] AI collaboration log is complete and redacted.
- [ ] Two people independently verify every submitted link before the deadline.

## 24. Decision log

| Decision | Rationale |
|---|---|
| Keep SQLite, FAISS, and NetworkX | Already implemented and adequate for the prototype dataset |
| Add a deterministic effective resolver | Legal validity cannot depend on LLM behavior |
| Expand references server-side | Tool support differs across providers |
| Keep Markdown as P0 ingestion | Reliability and hierarchy matter more than superficial format breadth |
| Treat conflicts as potential findings | Human legal review remains required |
| Fail closed on ambiguous evidence | Banking compliance favors safe abstention |
| Build a gold suite before adding more features | Reliability must be measurable and defensible |
| Defer Neo4j, managed vector storage, OCR, and full RBAC | They add delivery risk without fixing the highest-priority gaps |

## 25. Immediate next actions

1. Add backend test scaffolding and legal fixtures.
2. Freeze the four demo questions and gold evidence.
3. Implement stable IDs and EffectiveResolver.
4. Replace provider-dependent reference handling with deterministic graph expansion.
5. Strengthen citation coverage and abstention.
6. Expand the benchmark.
7. Protect public document upload.
8. Rehearse, deploy, and complete the submission package.

The critical path remains:

**security verification → deterministic legal state → deterministic graph retrieval → grounding and evaluation → UX and deployment → submission**
