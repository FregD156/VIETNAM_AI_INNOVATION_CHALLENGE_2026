import os
import json
from pathlib import Path
import pytest
from indexing.prepare_corpus import (
    calculate_sha256,
    parse_url_from_page,
    parse_crawl_summary,
    detect_mime_from_bytes,
    prepare_corpus_run
)

def test_calculate_sha256(tmp_path):
    test_file = tmp_path / "test.txt"
    test_file.write_bytes(b"hello world")
    
    # Expected SHA-256 for "hello world"
    expected = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    assert calculate_sha256(test_file) == expected

def test_parse_url_from_page(tmp_path):
    page_file = tmp_path / "page.txt"
    page_file.write_text("URL: https://www.shb.com.vn/test-url\nContent starts here...")
    
    assert parse_url_from_page(page_file) == "https://www.shb.com.vn/test-url"
    
    bad_page = tmp_path / "bad.txt"
    bad_page.write_text("This does not start with URL prefix")
    assert parse_url_from_page(bad_page) is None

def test_parse_crawl_summary(tmp_path):
    summary_file = tmp_path / "crawl_summary.md"
    summary_content = """
## CRAWLED PAGES:
- [http://www.shb.com.vn](http://www.shb.com.vn)
- [http://support.shb.com.vn/tienichonline](http://support.shb.com.vn/tienichonline)

## DOWNLOADED DOCUMENTS:
- [doc1.pdf](https://www.shb.com.vn/doc1.pdf)
- [doc2.pdf](https://www.shb.com.vn/doc2.pdf)
"""
    summary_file.write_text(summary_content, encoding="utf-8")
    
    filename_to_url, crawled_pages = parse_crawl_summary(summary_file)
    
    assert "http://www.shb.com.vn" in crawled_pages
    assert "http://support.shb.com.vn/tienichonline" in crawled_pages
    assert len(crawled_pages) == 2
    
    assert filename_to_url["doc1.pdf"] == "https://www.shb.com.vn/doc1.pdf"
    assert filename_to_url["doc2.pdf"] == "https://www.shb.com.vn/doc2.pdf"
    assert len(filename_to_url) == 2

def test_detect_mime_from_bytes(tmp_path):
    pdf_file = tmp_path / "test.pdf"
    pdf_file.write_bytes(b"%PDF-1.4\ncontent")
    assert detect_mime_from_bytes(pdf_file) == "application/pdf"
    
    docx_file = tmp_path / "test.docx"
    docx_file.write_bytes(b"PK\x03\x04\ncontent")
    assert detect_mime_from_bytes(docx_file) == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    txt_file = tmp_path / "test.txt"
    txt_file.write_bytes(b"just text content")
    assert detect_mime_from_bytes(txt_file) is None

def test_prepare_corpus_run_fail_closed():
    # Attempting to run with non-existent root should fail closed
    with pytest.raises(FileNotFoundError):
        prepare_corpus_run("/nonexistent_directory")

def test_prepare_corpus_run_success(tmp_path):
    # Setup mock raw directory tree
    raw_dir = tmp_path / "database" / "crawled_shb_data"
    raw_dir.mkdir(parents=True)
    
    summary_file = raw_dir / "crawl_summary.md"
    summary_file.write_text("## CRAWLED PAGES:\n- [http://shb.com.vn/test](http://shb.com.vn/test)\n\n## DOWNLOADED DOCUMENTS:\n- [d1.pdf](https://shb.com.vn/d1.pdf)\n", encoding="utf-8")
    
    # 1. Page file
    pages_dir = raw_dir / "pages"
    pages_dir.mkdir()
    page_txt = pages_dir / "test.txt"
    page_txt.write_text("URL: http://shb.com.vn/test\nPage Content", encoding="utf-8")
    
    # 2. Download file
    downloads_dir = raw_dir / "downloads"
    downloads_dir.mkdir()
    d1_pdf = downloads_dir / "d1.pdf"
    d1_pdf.write_bytes(b"%PDF-1.4\ndocument content")
    
    # 3. Duplicate download file
    d1_dup = downloads_dir / "d1_dup.pdf"
    d1_dup.write_bytes(b"%PDF-1.4\ndocument content")  # Same bytes as d1.pdf to test duplicate detection
    
    # Run the curation pipeline on mock root
    prepare_corpus_run(tmp_path)
    
    # Verify outputs
    manifest_file = tmp_path / "database" / "prepared" / "manifests" / "corpus_manifest.jsonl"
    duplicates_file = tmp_path / "database" / "prepared" / "reports" / "duplicates.json"
    report_file = tmp_path / "database" / "prepared" / "reports" / "ingestion_report.json"
    
    assert manifest_file.exists()
    assert duplicates_file.exists()
    assert report_file.exists()
    
    # Parse manifest
    entries = []
    with open(manifest_file, "r") as f:
        for line in f:
            entries.append(json.loads(line))
            
    # Should have 3 records (page, d1, d1_dup)
    assert len(entries) == 3
    
    # Find d1 and d1_dup to check duplicate resolution
    d1_entry = next(x for x in entries if "d1.pdf" in x["source_path"])
    d1_dup_entry = next(x for x in entries if "d1_dup.pdf" in x["source_path"])
    
    # One should be selected as duplicate of the other
    if d1_entry["duplicate_of"]:
        assert d1_entry["duplicate_of"] == d1_dup_entry["source_path"]
        assert d1_dup_entry["duplicate_of"] is None
    else:
        assert d1_dup_entry["duplicate_of"] == d1_entry["source_path"]
        assert d1_entry["duplicate_of"] is None
