import os
import json
import re
import sys
from pathlib import Path
import faiss
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.paths import DOCUMENTS_DIR, FAISS_INDEX_FILE, INDEXES_DIR, SQLITE_DATABASE_FILE

load_dotenv()

# Config
EMBEDDING_URL = os.getenv("EMBEDDING_BASE_URL", "https://mkp-api.fptcloud.com/v1")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL_NAME", "multilingual-e5-large")
EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY")

EMBEDDING_DIM = 1024
EMBED_BATCH_SIZE = 5
FLUSH_EVERY = 500

RAW_DATA_DIR = str(DOCUMENTS_DIR)
FAISS_INDEX_FILE = str(FAISS_INDEX_FILE)
SQLITE_DATABASE_FILE = str(SQLITE_DATABASE_FILE)

os.makedirs(INDEXES_DIR, exist_ok=True)

# Initialize OpenAI client for embedding
client = OpenAI(
    api_key=EMBEDDING_API_KEY,
    base_url=EMBEDDING_URL,
    timeout=20.0
)

def extract_doc_num(filename, title):
    # Try to find standard format like XX/YYYY/TT-NHNN or XX/YYYY/QH15 in title
    match = re.search(r'\d+(?:/\d+)?/[A-ZĐƯƠ\-]+', title)
    if match:
        return match.group(0)

    # Try to find standard format in filename
    match = re.search(r'\d+(?:/\d+)?/[A-ZĐƯƠ\-]+', filename)
    if match:
        return match.group(0)

    # Fallback to a simplified name
    name_clean = filename.replace('.md', '')
    if 'Circular-06' in name_clean:
        return '06/2023/TT-NHNN'
    if 'Circular-17' in name_clean:
        return '17/2024/TT-NHNN'
    if 'Circular-39' in name_clean:
        return '39/2016/TT-NHNN'
    if 'SHB-Internal-Lending-Policy' in name_clean:
        return 'SHB-Lending-2024'
    if 'SHB-eKYC-Procedure-2023' in name_clean:
        return 'SHB-eKYC-2023'
    if 'SHB-eKYC-Procedure-2024' in name_clean:
        return 'SHB-eKYC-2024'

    return name_clean

def normalize_date(date_str):
    if not date_str:
        return None
    # match DD tháng MM năm YYYY
    m1 = re.search(r'(\d+)\s+tháng\s+(\d+)\s+năm\s+(\d+)', date_str)
    if m1:
        d = int(m1.group(1))
        m = int(m1.group(2))
        y = int(m1.group(3))
        return f"{y:04d}-{m:02d}-{d:02d}"
    # match DD/MM/YYYY
    m2 = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', date_str)
    if m2:
        d = int(m2.group(1))
        m = int(m2.group(2))
        y = int(m2.group(3))
        return f"{y:04d}-{m:02d}-{d:02d}"
    return None

def extract_supersedes(text):
    # Match: "Điều 5 ... của văn bản SHB-eKYC-2023 chính thức bị bãi bỏ"
    match = re.search(r'Điều\s+(\w+)(?:\s+\([^\)]+\))?\s+của\s+văn\s+bản\s+([\w\-]+)\s+chính\s+thức\s+bị\s+bãi\s+bỏ', text, re.IGNORECASE)
    if match:
        return {
            "doc_num": match.group(2).strip(),
            "article": f"Điều {match.group(1)}",
            "clause": None
        }
    return None

def extract_references(text):
    refs = []
    # Match standard doc numbers: e.g. 39/2016/TT-NHNN, 17/2024/TT-NHNN
    matches = re.findall(r'\d+(?:/\d+)?/[A-ZĐƯƠ\-]+', text)
    for m in matches:
        if m not in refs:
            refs.append(m)
    # Match SHB docs: e.g. SHB-eKYC-2023, SHB-IRLP-2024
    matches_shb = re.findall(r'SHB-[A-Z\-]+\d{4}', text)
    for m in matches_shb:
        if m not in refs:
            refs.append(m)
    return refs

def parse_markdown_document(filename, file_path, doc_id):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Get Title from first line starting with #
    lines = content.split('\n')
    title = filename
    for line in lines:
        if line.startswith('# '):
            title = line.replace('# ', '').strip()
            break

    doc_num = extract_doc_num(filename, title)

    # Parse effective date & status from header lines
    eff_date = None
    exp_date = None
    status = "Còn hiệu lực"
    for line in lines[:15]:
        line_clean = line.replace('*', '').replace('`', '').strip().lower()
        if "ngày hiệu lực" in line_clean or "ngày có hiệu lực" in line_clean:
            parts = line.split(":")
            if len(parts) > 1:
                eff_date = normalize_date(parts[1].strip())
        elif "trạng thái" in line_clean:
            parts = line.split(":")
            if len(parts) > 1:
                status_raw = parts[1].replace("*", "").replace("`", "").strip()
                if "hết" in status_raw.lower():
                    status = "Hết hiệu lực"
                else:
                    status = "Còn hiệu lực"

    chunks = []

    # Split content by H3 headers (### Điều X. ...)
    # This aligns perfectly with the legal Article hierarchy
    articles = re.split(r'\n###\s+(Điều\s+\w+[\s\S]*?)\n', content)

    # Check if we got split articles (first element is document header stuff, rest are pairs of Article title + Article text)
    if len(articles) > 1:
        # Loop through matched pairs
        for i in range(1, len(articles), 2):
            article_header = articles[i].strip()
            article_body = articles[i+1].strip() if i+1 < len(articles) else ""

            # Extract just "Điều X"
            dieu_match = re.match(r'(Điều\s+\w+)', article_header)
            dieu_so = dieu_match.group(1) if dieu_match else article_header.split('.')[0].strip()

            # Split article body into clauses (paragraphs starting with "1. ", "2. ", etc. or "Khoản X. ")
            clauses = re.split(r'\n(\d+)\.\s+', '\n' + article_body)

            if len(clauses) > 1:
                # Loop through matched clauses
                for j in range(1, len(clauses), 2):
                    clause_num = clauses[j].strip()
                    clause_text = clauses[j+1].strip() if j+1 < len(clauses) else ""

                    clause_title = f"Khoản {clause_num}"
                    chunk_id = f"{doc_id}_art_{dieu_so.replace(' ', '')}_cl_{clause_num}"

                    # Create standard R2AI embed_text
                    embed_text = f"{title} - {article_header} - {clause_title}: {clause_text}"

                    # Extract supersedes & references
                    supersedes = extract_supersedes(clause_text)
                    references = extract_references(clause_text)

                    metadata = {
                        'title': title,
                        'doc_num': doc_num,
                        'doc_id': str(doc_id),
                        'article': dieu_so,
                        'clause': clause_title,
                        'effective_date': eff_date,
                        'expiration_date': exp_date,
                        'status': status,
                        'supersedes': supersedes,
                        'references': references
                    }

                    chunks.append({
                        'chunk_id': chunk_id,
                        'embed_text': embed_text,
                        'metadata': metadata
                    })
            else:
                # Article doesn't have numbered clauses, index the entire article body
                chunk_id = f"{doc_id}_art_{dieu_so.replace(' ', '')}"
                embed_text = f"{title} - {article_header}: {article_body}"

                supersedes = extract_supersedes(article_body)
                references = extract_references(article_body)

                metadata = {
                    'title': title,
                    'doc_num': doc_num,
                    'doc_id': str(doc_id),
                    'article': dieu_so,
                    'effective_date': eff_date,
                    'expiration_date': exp_date,
                    'status': status,
                    'supersedes': supersedes,
                    'references': references
                }

                chunks.append({
                    'chunk_id': chunk_id,
                    'embed_text': embed_text,
                    'metadata': metadata
                })
    else:
        # Fallback if no "### Điều" headers: split by double newlines into simple paragraphs
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        for idx, para in enumerate(paragraphs):
            # Skip title line
            if para.startswith('#'): continue

            chunk_id = f"{doc_id}_para_{idx}"
            embed_text = f"{title}: {para}"

            supersedes = extract_supersedes(para)
            references = extract_references(para)

            metadata = {
                'title': title,
                'doc_num': doc_num,
                'doc_id': str(doc_id),
                'effective_date': eff_date,
                'expiration_date': exp_date,
                'status': status,
                'supersedes': supersedes,
                'references': references
            }

            chunks.append({
                'chunk_id': chunk_id,
                'embed_text': embed_text,
                'metadata': metadata
            })

    return chunks

def phase3_chunk():
    print("=" * 80)
    print("PHASE 3: CHUNKING (Markdown → Chunks)")
    print("=" * 80)

    if not os.path.exists(RAW_DATA_DIR):
        print(f"❌ Raw data directory {RAW_DATA_DIR} not found!")
        return []

    files = [f for f in os.listdir(RAW_DATA_DIR) if f.endswith('.md')]
    print(f"Found {len(files)} Markdown files to parse.")

    all_chunks = []

    for idx, filename in enumerate(files):
        file_path = os.path.join(RAW_DATA_DIR, filename)
        doc_id = idx + 1

        chunks = parse_markdown_document(filename, file_path, doc_id)
        all_chunks.extend(chunks)
        print(f"   [{idx+1}/{len(files)}] {filename} → {len(chunks)} chunks")

    print(f"✓ Total {len(all_chunks)} chunks generated.")

    # Build maps exactly matching R2AI schema
    faiss_id_map = {}
    chunk_map = {}
    doc_index_map = {}
    article_index_map = {}

    for faiss_idx, chunk in enumerate(all_chunks):
        chunk_id = chunk['chunk_id']
        meta = chunk['metadata']
        doc_id = meta['doc_id']
        article = meta.get('article', '')

        faiss_id_map[faiss_idx] = chunk_id
        chunk_map[chunk_id] = meta

        doc_index_map.setdefault(doc_id, []).append(faiss_idx)

        if article:
            key = f"{doc_id}|{article}"
            article_index_map.setdefault(key, []).append(faiss_idx)

    # Save files
    # Only SQLite is saved now, JSON files are removed.
    save_to_sqlite(all_chunks, faiss_id_map)

    try:
        from app.rag.knowledge_graph import GraphService
        gs = GraphService()
        gs.build_graph()
    except Exception as e:
        print(f"❌ Failed to build knowledge graph: {e}")

    print("✅ Chunking complete!")
    return all_chunks

def save_to_sqlite(all_chunks, faiss_id_map):
    db_file = SQLITE_DATABASE_FILE
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass

    import sqlite3
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            doc_id TEXT PRIMARY KEY,
            doc_num TEXT,
            title TEXT,
            effective_date TEXT,
            expiration_date TEXT,
            status TEXT
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            chunk_id TEXT PRIMARY KEY,
            doc_id TEXT,
            article TEXT,
            clause TEXT,
            embed_text TEXT,
            faiss_index INTEGER,
            FOREIGN KEY (doc_id) REFERENCES documents (doc_id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS supersedes_relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_chunk_id TEXT,
            target_doc_num TEXT,
            target_article TEXT,
            target_clause TEXT,
            FOREIGN KEY (source_chunk_id) REFERENCES chunks (chunk_id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS references_relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_chunk_id TEXT,
            target_doc_num TEXT,
            FOREIGN KEY (source_chunk_id) REFERENCES chunks (chunk_id)
        );
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks(doc_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_article ON chunks(article);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_faiss_index ON chunks(faiss_index);")

        inserted_docs = set()
        chunk_to_faiss = {val: int(key) for key, val in faiss_id_map.items()}

        for chunk in all_chunks:
            chunk_id = chunk["chunk_id"]
            embed_text = chunk["embed_text"]
            meta = chunk.get("metadata", {})

            doc_id = meta.get("doc_id")
            doc_num = meta.get("doc_num")
            title = meta.get("title")
            article = meta.get("article")
            clause = meta.get("clause")
            effective_date = meta.get("effective_date")
            expiration_date = meta.get("expiration_date")
            status = meta.get("status")

            faiss_idx = chunk_to_faiss.get(chunk_id)

            if doc_id and doc_id not in inserted_docs:
                cursor.execute(
                    "INSERT INTO documents (doc_id, doc_num, title, effective_date, expiration_date, status) VALUES (?, ?, ?, ?, ?, ?);",
                    (doc_id, doc_num, title, effective_date, expiration_date, status)
                )
                inserted_docs.add(doc_id)

            cursor.execute(
                "INSERT INTO chunks (chunk_id, doc_id, article, clause, embed_text, faiss_index) VALUES (?, ?, ?, ?, ?, ?);",
                (chunk_id, doc_id, article, clause, embed_text, faiss_idx)
            )

            # Insert relations
            supersedes = meta.get("supersedes")
            if supersedes:
                cursor.execute(
                    "INSERT INTO supersedes_relations (source_chunk_id, target_doc_num, target_article, target_clause) VALUES (?, ?, ?, ?);",
                    (chunk_id, supersedes.get("doc_num"), supersedes.get("article"), supersedes.get("clause"))
                )

            references = meta.get("references") or []
            for ref_doc in references:
                cursor.execute(
                    "INSERT INTO references_relations (source_chunk_id, target_doc_num) VALUES (?, ?);",
                    (chunk_id, ref_doc)
                )

        conn.commit()
        conn.close()
        print(f"✓ SQLite database successfully written to {db_file}")
    except Exception as e:
        print(f"❌ Failed to write SQLite database: {e}")


def normalize(vectors):
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    return vectors / norms

def embed_texts(texts):
    resp = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    data = sorted(resp.data, key=lambda x: x.index)
    vecs = np.array([x.embedding for x in data], dtype=np.float32)
    return normalize(vecs)

def safe_embed(text):
    try:
        vec = embed_texts([text])
        return vec[0]
    except Exception as e:
        print(f"Failed to embed chunk: {e}")
        return None

def phase4_embedding(all_chunks=None):
    print("\n" + "=" * 80)
    print("PHASE 4: EMBEDDING (Chunks → FAISS via FPT API)")
    print("=" * 80)

    if all_chunks is None:
        import sqlite3
        db_file = SQLITE_DATABASE_FILE
        if not os.path.exists(db_file):
            raise FileNotFoundError(f"SQLite database not found at {db_file}")

        print("Loading chunks from SQLite data.db...")
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.chunk_id, c.embed_text, c.article, c.clause, d.title, d.doc_num, d.doc_id, d.effective_date, d.expiration_date, d.status
            FROM chunks c
            JOIN documents d ON c.doc_id = d.doc_id
        """)
        all_chunks = []
        for r in cursor.fetchall():
            cursor2 = conn.cursor()
            cursor2.execute("SELECT target_doc_num, target_article, target_clause FROM supersedes_relations WHERE source_chunk_id = ?", (r["chunk_id"],))
            s_row = cursor2.fetchone()
            supersedes = None
            if s_row:
                supersedes = {
                    "doc_num": s_row["target_doc_num"],
                    "article": s_row["target_article"],
                    "clause": s_row["target_clause"]
                }

            cursor2.execute("SELECT target_doc_num FROM references_relations WHERE source_chunk_id = ?", (r["chunk_id"],))
            references = [ref_r["target_doc_num"] for ref_r in cursor2.fetchall()]

            all_chunks.append({
                "chunk_id": r["chunk_id"],
                "embed_text": r["embed_text"],
                "metadata": {
                    "title": r["title"],
                    "doc_num": r["doc_num"],
                    "doc_id": r["doc_id"],
                    "article": r["article"],
                    "clause": r["clause"],
                    "effective_date": r["effective_date"],
                    "expiration_date": r["expiration_date"],
                    "status": r["status"],
                    "supersedes": supersedes,
                    "references": references
                }
            })
        conn.close()
        print(f"Loaded {len(all_chunks)} chunks from SQLite.")

    print(f"Total chunks: {len(all_chunks)}")

    # Initialize FAISS IndexIDMap (Inner Product, dimension=1024)
    index = faiss.IndexIDMap(faiss.IndexFlatIP(EMBEDDING_DIM))
    indexed_ids = set()

    BATCH_SIZE = 32
    skipped_count = 0

    for i in range(0, len(all_chunks), BATCH_SIZE):
        batch = all_chunks[i:i+BATCH_SIZE]
        batch_texts = [c["embed_text"] for c in batch]
        batch_ids = [i + idx for idx in range(len(batch))]

        try:
            vecs = embed_texts(batch_texts)
            index.add_with_ids(vecs, np.array(batch_ids, dtype=np.int64))
            indexed_ids.update(batch_ids)
            print(f"   💾 Embedded & saved batch: {i} to {i+len(batch)} chunks (Total: {index.ntotal})")
        except Exception as e:
            print(f"Failed to embed batch starting at {i}: {e}. Retrying one by one...")
            for idx, chunk in enumerate(batch):
                text = chunk["embed_text"]
                chunk_id = i + idx
                vec = safe_embed(text)
                if vec is not None:
                    index.add_with_ids(np.array([vec], dtype=np.float32), np.array([chunk_id], dtype=np.int64))
                    indexed_ids.add(chunk_id)
                else:
                    skipped_count += 1

    faiss.write_index(index, FAISS_INDEX_FILE)
    print(f"\n✅ Embedding complete! Total vectors in FAISS: {index.ntotal}, Skipped: {skipped_count}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "phase4":
        phase4_embedding()
    elif len(sys.argv) > 1 and sys.argv[1] == "phase3":
        phase3_chunk()
    else:
        chunks = phase3_chunk()
        phase4_embedding(chunks)
