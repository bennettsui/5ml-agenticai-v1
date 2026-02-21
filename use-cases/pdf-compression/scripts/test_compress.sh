#!/usr/bin/env bash
# ============================================================
# Quick smoke test for the PDF Compression Service
# Usage: ./scripts/test_compress.sh [service_url]
# ============================================================

BASE_URL="${1:-http://localhost:8082}"

echo "=== PDF Compression Service Smoke Tests ==="
echo "Target: $BASE_URL"
echo ""

# Health check
echo "--- Health Check ---"
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""

# List profiles
echo "--- Available Profiles ---"
curl -s "$BASE_URL/profiles" | python3 -m json.tool
echo ""

# Compress a sample PDF (replace with an actual local path)
SAMPLE_PDF="${2:-/tmp/sample.pdf}"

if [ ! -f "$SAMPLE_PDF" ]; then
  echo "Creating a minimal test PDF at $SAMPLE_PDF..."
  python3 -c "
from fpdf import FPDF
pdf = FPDF()
pdf.add_page()
pdf.set_font('Arial', size=12)
for i in range(50):
    pdf.cell(200, 10, txt=f'Line {i+1}: This is a test PDF for compression validation.', ln=True)
pdf.output('$SAMPLE_PDF')
print('Test PDF created:', '$SAMPLE_PDF')
" 2>/dev/null || echo "fpdf not available. Please provide a PDF at $SAMPLE_PDF"
fi

if [ -f "$SAMPLE_PDF" ]; then
  echo "--- Compress Test (balanced profile) ---"
  curl -s -X POST "$BASE_URL/compress" \
    -H "Content-Type: application/json" \
    -d "{
      \"source\": \"$SAMPLE_PDF\",
      \"profile\": \"balanced\",
      \"priority\": \"quality\",
      \"tags\": [\"test\"]
    }" | python3 -m json.tool
  echo ""

  echo "--- Compress Test (web profile) ---"
  curl -s -X POST "$BASE_URL/compress" \
    -H "Content-Type: application/json" \
    -d "{
      \"source\": \"$SAMPLE_PDF\",
      \"profile\": \"web\",
      \"priority\": \"size\",
      \"tags\": [\"test\", \"sharing\"]
    }" | python3 -m json.tool
  echo ""
fi

echo "=== Done ==="
