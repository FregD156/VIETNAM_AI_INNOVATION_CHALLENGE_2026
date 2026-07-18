# PROBLEM STATEMENT

## Advanced RAG Knowledge Base – AI Chatbot for Complex Banking Document Retrieval

### Overview Summary
* **Topic**: Advanced RAG Knowledge Base – AI Chatbot for Complex Banking Document Retrieval
* **Brief Description**: An advanced Retrieval-Augmented Generation (RAG) system that enables employees and customers to search across the bank's entire document repository (internal policies, regulations, circulars, operating procedures, contract templates, etc.) using natural language.
  * **Key Differentiator**:
    * **Cross-references**: Automatically follows and synthesizes referenced documents.
    * **Amendments**: Always applies the latest effective version of amended regulations.
    * **Partial supersession**: Excludes superseded clauses from responses.
    * **Conflicting regulations**: Detects inconsistencies and warns users.
* **Suggested Technologies**: LLM (GPT-4, Claude, or equivalent), Advanced RAG Pipeline, Knowledge Graph (Neo4j / NetworkX), Versioning engine, Hybrid Search (Vector + BM25 + Graph Traversal), Chunk-level supersession tracking, Vietnamese embeddings (PhoBERT, multilingual-e5), FastAPI + Streamlit/React.
* **Key Deliverables**: AI chatbot with source-cited answers, Knowledge graph visualization, Clause version timeline, Conflict detector, Admin dashboard for document updates, Benchmark comparison with standard RAG.
* **Benefits to the Bank**: Ensures employees use current regulations, Reduces legal and compliance risks, Saves 2–3 hours/day for compliance teams, Faster onboarding, Standardized organizational knowledge.
* **Why This Problem Matters**: SHB manages thousands of internal and external regulatory documents (SBV, Government, Basel, etc.). A single regulation may be amended multiple times, while individual clauses can be partially superseded. Conventional RAG systems cannot accurately model these relationships, leading to answers based on outdated regulations and creating significant compliance risks. This is a challenging real-world AI problem that remains difficult even for many leading global financial institutions.


---

## Detailed Section Breakdown

### 1. Topic
**Advanced RAG Knowledge Base – AI Chatbot for Complex Banking Document Retrieval**

### 2. Brief Description
An advanced Retrieval-Augmented Generation (RAG) system that enables employees and customers to search across the bank's entire document repository (internal policies, regulations, circulars, operating procedures, contract templates, etc.) using natural language.

#### Key Differentiators:
*   **Cross-references**: Automatically follows and synthesizes referenced documents.
*   **Amendments**: Always applies the latest effective version of amended regulations.
*   **Partial supersession**: Excludes superseded clauses from responses.
*   **Conflicting regulations**: Detects inconsistencies and warns users.

### 3. Suggested Technologies
*   **LLM**: GPT-4, Claude, or equivalent
*   **RAG Architecture**: Advanced RAG Pipeline
*   **Knowledge Representation**: Knowledge Graph (Neo4j / NetworkX)
*   **Version Control**: Versioning engine & Chunk-level supersession tracking
*   **Search Engine**: Hybrid Search (Vector + BM25 + Graph Traversal)
*   **Embeddings**: Vietnamese embeddings (PhoBERT, multilingual-e5)
*   **Web Frameworks**: FastAPI + Streamlit/React

### 4. Key Deliverables
*   AI chatbot with source-cited answers
*   Knowledge graph visualization
*   Clause version timeline
*   Conflict detector
*   Admin dashboard for document updates
*   Benchmark comparison with standard RAG

### 5. Benefits to the Bank
*   Ensures employees use current regulations
*   Reduces legal and compliance risks
*   Saves 2–3 hours/day for compliance teams
*   Faster onboarding
*   Standardized organizational knowledge

### 6. Why This Problem Matters
SHB manages thousands of internal and external regulatory documents (SBV, Government, Basel, etc.). A single regulation may be amended multiple times, while individual clauses can be partially superseded.

Conventional RAG systems cannot accurately model these relationships, leading to answers based on outdated regulations and creating significant compliance risks. This is a challenging real-world AI problem that remains difficult even for many leading global financial institutions.
