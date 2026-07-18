#!/bin/bash
echo "Starting R2AI Legal RAG Chatbot Server on http://localhost:8000 ..."
PYTHONPATH=. PORT=8000 python3 main.py
