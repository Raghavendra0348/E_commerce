"""Validate the current PDF submission and create visual review sheets."""
from pathlib import Path
import hashlib
import json
import re
from pypdf import PdfReader
import pdfplumber
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "Docs/SRS_FINAL.md").read_text(encoding="utf-8")
baseline = json.loads((ROOT / "output/srs-data.json").read_text(encoding="utf-8"))
pdf_path = ROOT / "output/pdf/E_Commerce_SRS_Final.pdf"
reader = PdfReader(pdf_path)
text = "\n".join(page.extract_text() or "" for page in reader.pages)
assert "version 1.0" in text.lower()
assert "Arella Raghavendra" in text and "R220348" in text
assert "RGUKT RK Valley" in text and "Lingamurthy" in text
assert 30 <= len(reader.pages) <= 45
counts = {"FR": 39, "NFR": 12, "UC": 12, "INT": 7}
for prefix, count in counts.items():
    expected = {f"{prefix}-{number:02d}" for number in range(1, count + 1)}
    assert expected <= set(re.findall(rf"\b{prefix}-\d{{2}}\b", source)), prefix
    assert expected <= set(re.findall(rf"\b{prefix}-\d{{2}}\b", text)), prefix
for prefix, count in {"AT-F": 39, "AT-N": 12}.items():
    expected = {f"{prefix}{number:02d}" for number in range(1, count + 1)}
    assert expected <= set(re.findall(rf"\b{prefix}\d{{2}}\b", text)), prefix
assert source.count("```mermaid") == 5
for value in baseline["functional"].values():
    assert value["statement"] in source
assert hashlib.sha256((ROOT / "Docs/SRS_DRAFT.md").read_bytes()).hexdigest() == baseline["baseline_sha256"]
assert "\ufffd" not in text
assert all((page.extract_text() or "").strip() for page in reader.pages)
overflows = []
with pdfplumber.open(pdf_path) as pdf:
    for number, page in enumerate(pdf.pages, 1):
        for word in page.extract_words():
            if word["x0"] < 69 or word["x1"] > page.width - 69 or word["top"] < 15 or word["bottom"] > page.height - 15:
                overflows.append({"page": number, "text": word["text"], "bounds": [word["x0"], word["top"], word["x1"], word["bottom"]]})
assert not overflows, overflows[:10]
report = {"version": "1.0", "pages": len(reader.pages), "requirements": counts, "acceptance_mappings": 51, "diagrams": 5, "baseline_unchanged": True, "all_functional_statements_preserved": True, "printable_text_bounds": "pass", "application_acceptance_tests": "Not assessed by this document export", "pdf_sha256": hashlib.sha256(pdf_path.read_bytes()).hexdigest()}
(ROOT / "output/srs-submission-validation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
pages = sorted((ROOT / "tmp/pdfs").glob("srs-approved-page-*.png"))
assert len(pages) == len(reader.pages), (len(pages), len(reader.pages))
for start in range(0, len(pages), 4):
    sheet = Image.new("RGB", (1440, 2100), "#c9c9c9")
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(pages[start:start + 4]):
        image = Image.open(path).convert("RGB")
        image.thumbnail((700, 1000))
        x = (index % 2) * 720 + (720 - image.width) // 2
        y = (index // 2) * 1050 + 30
        sheet.paste(image, (x, y))
        draw.text((x, y - 20), f"Page {start + index + 1}", fill="black")
    sheet.save(ROOT / f"tmp/pdfs/srs-sheet-{start // 4 + 1:02d}.jpg", quality=88)
print(json.dumps(report))
