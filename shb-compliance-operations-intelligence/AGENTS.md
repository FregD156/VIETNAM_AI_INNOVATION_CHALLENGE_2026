# AI Agent Onboarding & Project Guide

Welcome, Agent! This document defines the overarching purpose of **SHB Legal Intelligence**, outlines the system architecture, and provides instructions for quick onboarding and development verification.

---

## 🎯 Overarching Project Purpose

**SHB Legal Intelligence** is an Advanced Graph-RAG (Retrieval-Augmented Generation) knowledge base prototype designed for Vietnamese banking regulations and internal compliance documents.

### The Challenge
Banking regulations change dynamically. Amendments (`AMENDS` relationships) and partial supersessions (`SUPERSEDES` relationships) mean that old clauses are frequently modified or invalidated while the rest of the parent document remains active. Naive vector-based RAG retrieves semantically relevant but legally expired clauses, introducing severe compliance risk.

### The Solution
Our solution integrates:
1. **Relational Graph Traversal (NetworkX):** Tracks document hierarchy (documents → articles → clauses) and cross-document relationships (`references`, `supersedes`).
2. **Temporal & Effective Status Filtering:** Automatically filters out superseded or inactive clauses prior to LLM generation.
3. **Hybrid Retrieval:** Blends semantic search (FAISS) and lexical search (BM25) fused using Reciprocal Rank Fusion (RRF).
4. **Compliance Guards:** Includes a `CitationGuard` to validate source validity and a `Conflict Guard` to flag discrepancies between internal bank procedures and NHNN (State Bank of Vietnam) regulations.

---

## 🛠️ Technical Stack & Dependencies

*   **Backend:** FastAPI (Python 3.10+).
*   **Vector Engine:** FAISS (CPU-bound) storing 1024-dimensional embeddings (optimized for `multilingual-e5-large`).
*   **Graph Library:** NetworkX (in-memory graphs generated dynamically from SQLite).
*   **Relational Storage:** SQLite (`database/indexes/data.db`) storing legal chunks and metadata.
*   **Frontend:** React (Vite, Vis-Network for graph drawing).

---

## 🚀 Quick Onboarding (Command Reference)

Always use the local Python virtual environment (`.venv`) initialized at the project root.

### Frontend Development & Build
To build the static assets which FastAPI serves from `frontend/dist`:
```bash
cd frontend
npm install
npm run build
```

---

## 🚀 Active Production Deployment

This project is deployed using a split architecture: **Backend on Render** and **Frontend on Vercel**.

### 1. Production URLs
*   **Frontend (Vercel):** [https://shb-compliance-operations-intellige.vercel.app](https://shb-compliance-operations-intellige.vercel.app)
*   **Backend (Render):** [https://shb-legal-backend.onrender.com](https://shb-legal-backend.onrender.com)
*   **Backend Health Check:** [https://shb-legal-backend.onrender.com/health](https://shb-legal-backend.onrender.com/health)

### 2. Private Credentials & Secrets Repository
> 🔒 **SECURITY NOTICE FOR AI AGENTS & COLLABORATORS**:
> All sensitive API keys (Render API Key, FPT AI Factory keys, model tokens) and secret platform identifiers have been removed from this public codebase.
>
> All production secrets and active credentials are strictly stored in our private repository:
> 🔗 **[huutrungle2001/hackathon_keys](https://github.com/huutrungle2001/hackathon_keys)**
>
> **Access Permissions**:
> - Team members (`minhleeee123`, `FregD156`, `huutrungle2001`) have write/read access to `hackathon_keys`.
> - AI Agents needing credentials for local testing or deployment operations should reference the `hackathon_keys` repository.

### 3. Deployment Triggers
*   **Frontend (Vercel):** `cd frontend && vercel deploy --prod --yes`
*   **Backend (Render):** Triggered automatically on `git push origin main` or via Render API deploy hook using token from `hackathon_keys`.

---

## 📂 Codebase Map & Critical Entrypoints

### Backend (`backend/app/`)
*   [main.py](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/backend/app/main.py) - App lifecycle and routing configuration.
*   [core/paths.py](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/backend/app/core/paths.py) - **Critical:** All filesystem reference points must reside here. Do not derive paths independently.
*   [rag/pipeline.py](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/backend/app/rag/pipeline.py) - The Advanced RAG query orchestrator.
*   [rag/retrieval.py](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/backend/app/rag/retrieval.py) - FAISS + BM25 + RRF query search service.
*   [rag/knowledge_graph.py](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/backend/app/rag/knowledge_graph.py) - NetworkX graph generation and supersession logic.
*   [services/ingestion_service.py](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/backend/app/services/ingestion_service.py) - Handles validation, locking, and rolling back database rebuilds.

### Frontend (`frontend/src/`)
*   [features/chat/](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/frontend/src/features/chat) - Chat console & streaming citations.
*   [features/knowledge-graph/](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/frontend/src/features/knowledge-graph) - Dynamic Network visualizer.
*   [features/documents/](file:///Users/huutrungle2001/Documents/OnGoing/empty-repo-1/frontend/src/features/documents) - Admin workspace for uploading and inspecting laws.

---

## ⚠️ Important Constraints for Agents

1.  **Platform Compatibility:** Do not hardcode specific platform binary dependencies (e.g. `linux-x64` specific bindings) in `package.json`. Allow `npm` to resolve dependencies dynamically.
2.  **No Path Hardcoding:** Do not bypass `paths.py` in the backend.
3.  **Strict Verification:** Build production assets (`cd frontend && npm run build`) and test API endpoints to verify changes.

---

## 6. Development Rules for Agents

### 6.1 Core Development Rules
* **Sub-Agent Invocation**: AI agents are explicitly allowed and encouraged to define and invoke sub-agents whenever necessary to delegate research, analyze code, parallelize execution, or isolate complex sub-tasks.
* **Temporary & Scratch Scripts**: All one-time test codes, verification scripts, scratch files, and temporary debug tools must be written inside the `.tmp/` directory. Writing scratch or test code in the root directory or other non-temp directories is strictly prohibited.
* **Commit rule**: All commits must follow the format `<type>(optional-scope): <short message>`.

  Examples:
  ```
  feat(auth): add Google login
  fix(api): handle empty response
  docs(readme): add setup instructions
  refactor(parser): simplify join parsing logic
  test(optimizer): add regression tests
  chore(deps): update dependencies
  ```

### 6.2 Coding Guidelines
These guidelines bias toward caution over speed. For trivial tasks, use judgment.

#### 6.2.1 Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
* State assumptions explicitly. If uncertain, ask.
* If multiple interpretations exist, present them - don't pick silently.
* If a simpler approach exists, push back when warranted.
* If something is unclear, stop and ask for clarification.

#### 6.2.2 Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
* No features beyond what was asked.
* No abstractions for single-use code.
* No "flexibility" or "configurability" that wasn't requested.
* No error handling for impossible scenarios.
* If code could be simplified, rewrite/reduce it. Ask: "Would a senior engineer say this is overcomplicated?"

#### 6.2.3 Surgical Changes
**Touch only what you must. Clean up only your own mess.**
* Don't "improve" adjacent code, comments, or formatting.
* Don't refactor things that aren't broken.
* Match existing style, even if you'd do it differently.
* Remove unused imports/variables/functions created by your changes, but do not delete pre-existing dead code unless asked.

#### 6.2.4 Goal-Driven Execution
**Define success criteria. Loop until verified.**
* Transform tasks into verifiable goals (e.g., write/run tests to reproduce/verify).
* For multi-step tasks, state a brief plan with verification steps.
