import os
import json
import hashlib
import mimetypes
import re
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Add project root to path to resolve imports properly
import sys
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.paths import project_paths

def calculate_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def detect_mime_from_bytes(file_path):
    """Perform simple magic-number/signature check on files."""
    try:
        with open(file_path, "rb") as f:
            header = f.read(4)
            if header.startswith(b"%PDF"):
                return "application/pdf"
            elif header.startswith(b"PK\x03\x04"):
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    except Exception:
        pass
    return None

def parse_url_from_page(file_path):
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            first_line = f.readline().strip()
            if first_line.startswith("URL:"):
                return first_line.replace("URL:", "").strip()
    except Exception as e:
        print(f"Error parsing URL from {file_path}: {e}")
    return None

def parse_crawl_summary(summary_path):
    filename_to_url = {}
    crawled_pages = set()
    
    if not os.path.exists(summary_path):
        print(f"Warning: Summary file not found at {summary_path}")
        return filename_to_url, crawled_pages
        
    print(f"Parsing crawl summary from {summary_path}...")
    with open(summary_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    # Extract crawled pages list
    pages_section = re.search(r'## CRAWLED PAGES:(.*?)(##|$)', content, re.DOTALL)
    if pages_section:
        links = re.findall(r'-\s+\[.*?\]\((.*?)\)', pages_section.group(1))
        for link in links:
            crawled_pages.add(link.strip())
            
    # Extract downloaded documents list
    docs_section = re.search(r'## DOWNLOADED DOCUMENTS:(.*?)(##|$)', content, re.DOTALL)
    if docs_section:
        matches = re.findall(r'-\s+\[(.*?)\]\((.*?)\)', docs_section.group(1))
        for filename, url in matches:
            filename_to_url[filename.strip()] = url.strip()
            
    return filename_to_url, crawled_pages

def prepare_corpus_run(project_root=None):
    paths = project_paths(project_root)
    raw_dir = paths["crawled_shb_data"]
    prepared_dir = paths["prepared"]
    manifests_dir = paths["manifests"]
    reports_dir = paths["reports"]
    
    # Fail-closed validation on raw corpus directory
    if not os.path.isdir(raw_dir):
        raise FileNotFoundError(f"Raw corpus directory does not exist or is not a folder: {raw_dir}")
        
    os.makedirs(manifests_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    
    run_id = f"run_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    observed_at = datetime.now(timezone.utc).isoformat()
    
    # 1. Parse summary mapping
    summary_path = os.path.join(raw_dir, "crawl_summary.md")
    filename_to_url, crawled_pages = parse_crawl_summary(summary_path)
    
    # 2. Discover raw artifacts
    discovered = []
    failed_artifacts = []
    
    # Walk pages, downloads, and pdfs folders
    search_dirs = ["pages", "downloads", "pdfs"]
    for sub in search_dirs:
        sub_path = os.path.join(raw_dir, sub)
        if not os.path.exists(sub_path):
            continue
            
        for root, _, files in sorted(os.walk(sub_path)):
            for file in sorted(files):
                # Ignore hidden files like .DS_Store
                if file.startswith("."):
                    continue
                    
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, raw_dir)
                
                # Isolate per-artifact failures (Gate 4)
                try:
                    byte_size = os.path.getsize(abs_path)
                    
                    # Content-based MIME detection combined with extension fallback (Gate 3)
                    mime_type = detect_mime_from_bytes(abs_path)
                    if not mime_type:
                        mime_type, _ = mimetypes.guess_type(abs_path)
                        
                    if not mime_type:
                        ext = os.path.splitext(file)[1].lower()
                        if ext == ".txt":
                            mime_type = "text/plain"
                        elif ext == ".pdf":
                            mime_type = "application/pdf"
                        elif ext == ".docx":
                            mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        else:
                            mime_type = "application/octet-stream"
                            
                    # Hash content
                    sha256 = calculate_sha256(abs_path)
                    
                    # Resolve source URL
                    source_url = None
                    if sub == "pages":
                        source_url = parse_url_from_page(abs_path)
                    else:
                        source_url = filename_to_url.get(file)
                        if not source_url:
                            # Fallback un-escaping
                            from urllib.parse import unquote
                            decoded_name = unquote(file)
                            source_url = filename_to_url.get(decoded_name)
                            
                    discovered.append({
                        "relative_path": rel_path,
                        "filename": file,
                        "subfolder": sub,
                        "byte_size": byte_size,
                        "mime_type": mime_type,
                        "sha256": sha256,
                        "source_url": source_url
                    })
                except Exception as e:
                    print(f"Error processing artifact {rel_path}: {e}")
                    failed_artifacts.append({
                        "source_path": rel_path,
                        "error": str(e)
                    })
                
    # 3. Duplicate Resolution & Hashing Grouping
    hash_to_artifacts = {}
    for item in discovered:
        sha = item["sha256"]
        if sha not in hash_to_artifacts:
            hash_to_artifacts[sha] = []
        hash_to_artifacts[sha].append(item)
        
    manifest_entries = []
    duplicate_groups = {}
    
    # Sort groups by path for stable canonical selection
    for sha, items in sorted(hash_to_artifacts.items()):
        items_sorted = sorted(items, key=lambda x: x["relative_path"])
        canonical = items_sorted[0]
        canonical_id = f"sha256:{sha}"
        
        # Primary manifest record
        manifest_entries.append({
            "artifact_id": canonical_id,
            "source_path": canonical["relative_path"],
            "file_size": canonical["byte_size"],
            "mime_type": canonical["mime_type"],
            "source_url": canonical["source_url"],
            "duplicate_of": None,
            "sha256": sha
        })
        
        # Duplicate manifest records
        if len(items_sorted) > 1:
            duplicate_groups[canonical["relative_path"]] = [x["relative_path"] for x in items_sorted[1:]]
            for dup in items_sorted[1:]:
                manifest_entries.append({
                    "artifact_id": canonical_id,
                    "source_path": dup["relative_path"],
                    "file_size": dup["byte_size"],
                    "mime_type": dup["mime_type"],
                    "source_url": dup["source_url"],
                    "duplicate_of": canonical["relative_path"],
                    "sha256": sha
                })
                
    # Sort manifest entries by source path for absolute determinism
    manifest_entries = sorted(manifest_entries, key=lambda x: x["source_path"])
    
    # 4. Reconciliation
    manifest_urls = {x["source_url"] for x in manifest_entries if x["source_url"] and "pages/" in x["source_path"]}
    missing_pages = sorted(list(crawled_pages - manifest_urls))
    extra_pages = sorted(list(manifest_urls - crawled_pages))
    
    # 5. Write Output Files Atomically (Gate 5)
    manifest_path = os.path.join(manifests_dir, "corpus_manifest.jsonl")
    manifest_tmp = manifest_path + ".tmp"
    with open(manifest_tmp, "w", encoding="utf-8") as f:
        for entry in manifest_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    os.replace(manifest_tmp, manifest_path)
            
    duplicates_path = os.path.join(reports_dir, "duplicates.json")
    duplicates_tmp = duplicates_path + ".tmp"
    with open(duplicates_tmp, "w", encoding="utf-8") as f:
        json.dump(duplicate_groups, f, ensure_ascii=False, indent=2)
    os.replace(duplicates_tmp, duplicates_path)
        
    # Write ingestion report
    total_raw = len(discovered)
    unique_count = len(hash_to_artifacts)
    dup_count = total_raw - unique_count
    
    report = {
        "run_id": run_id,
        "observed_at": observed_at,
        "summary": {
            "total_discovered_artifacts": total_raw,
            "unique_artifacts": unique_count,
            "duplicate_artifacts": dup_count,
        },
        "reconciliation": {
            "reported_crawled_pages": len(crawled_pages),
            "actual_crawled_pages": len(manifest_urls),
            "missing_pages_in_corpus": missing_pages,
            "extra_pages_in_corpus": extra_pages
        },
        "failures": failed_artifacts
    }
    
    report_path = os.path.join(reports_dir, "ingestion_report.json")
    report_tmp = report_path + ".tmp"
    with open(report_tmp, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    os.replace(report_tmp, report_path)
        
    print("\n==================================================")
    print("PHASE 1 COMPLETE: DETERMINISTIC MANIFEST BUILT")
    print("==================================================")
    print(f"✓ Generated manifest: {manifest_path}")
    print(f"✓ Generated duplicates report: {duplicates_path}")
    print(f"✓ Generated ingestion report: {report_path}")
    print(f"Total discovered artifacts: {total_raw}")
    print(f"Unique artifacts: {unique_count}")
    print(f"Duplicates found: {dup_count}")
    print(f"Reconciliation: Missing {len(missing_pages)} pages, Extra {len(extra_pages)} pages.")
    if failed_artifacts:
        print(f"⚠️ Warning: {len(failed_artifacts)} artifacts failed processing.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare SHB raw crawl corpus manifest.")
    parser.file_path = os.path.dirname(__file__)
    parser.add_argument("--project-root", type=str, default=None, help="Optionally override the project root path.")
    args = parser.parse_args()
    
    prepare_corpus_run(args.project_root)
