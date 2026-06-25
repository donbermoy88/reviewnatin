#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/pdf"
DEFAULT_INPUT = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files/D. FREEBIES -BEED&BSED-")

MATERIAL_EXTENSIONS = {".doc", ".docx", ".pdf"}
INCLUDED_FOLDERS = {"E. Study Notes 2026", "G. Topnotcher_s Notes 2026"}
QUESTION_BANK_PATTERNS = [
    "simulated_test",
    "post-test",
    "post_test",
    "profed12_ans",
]


def run(args, timeout=90):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    return result.stdout if result.returncode == 0 else ""


def ooxml_text(path):
    chunks = []
    with zipfile.ZipFile(path) as archive:
        names = sorted(name for name in archive.namelist() if name.startswith("word/document") and name.endswith(".xml"))
        for name in names:
            try:
                root = ET.fromstring(archive.read(name))
            except ET.ParseError:
                continue
            texts = []
            for element in root.iter():
                if element.tag.endswith("}t") and element.text:
                    texts.append(element.text)
            if texts:
                chunks.append("\n".join(texts))
    return "\n\n".join(chunks)


def read_text(path):
    suffix = path.suffix.lower()
    if suffix == ".docx":
        text = ooxml_text(path)
    elif suffix == ".doc":
        text = run(["textutil", "-convert", "txt", "-stdout", str(path)], timeout=120)
    elif suffix == ".pdf":
        text = run(["pdftotext", str(path), "-"], timeout=120)
    else:
        text = ""
    text = text.replace("\x00", "")
    text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def slug_context(path):
    text = " ".join(part.lower() for part in path.parts[-4:]).replace("_", " ").replace("-", " ")
    if "assessment" in text or "evaluation of learning" in text:
        return "prof-ed", "assessment-of-learning"
    if "child" in text or "adolescent" in text or "human growth" in text:
        return "prof-ed", "child-development"
    if "curriculum" in text:
        return "prof-ed", "curriculum-development"
    if "educational technology" in text or "teaching technology" in text:
        return "prof-ed", "educational-technology"
    if "social dimensions" in text:
        return "prof-ed", "social-dimensions"
    if "developmental reading" in text or "reading" in text:
        return "gen-ed", "english"
    if "philosoph" in text or "essentialism" in text or "perennialism" in text or "foundations of education" in text:
        return "prof-ed", "teaching-profession"
    if "pillars" in text or "unesco" in text or "facilitating" in text:
        return "prof-ed", "facilitating-learning"
    if "keyword" in text or "principle" in text or "topnotcher" in text or "prof ed" in text:
        return "prof-ed", "principles-of-teaching"
    return "prof-ed", "principles-of-teaching"


def compact_title(path):
    title = path.stem
    title = re.sub(r"[_-]+", " ", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title or path.stem


def chunks_for(text, max_chars=6500):
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks = []
    current = []
    current_len = 0
    for paragraph in paragraphs:
        if current and current_len + len(paragraph) > max_chars:
            chunks.append("\n\n".join(current).strip())
            current = []
            current_len = 0
        if len(paragraph) > max_chars:
            for index in range(0, len(paragraph), max_chars):
                part = paragraph[index : index + max_chars].strip()
                if part:
                    chunks.append(part)
            continue
        current.append(paragraph)
        current_len += len(paragraph) + 2
    if current:
        chunks.append("\n\n".join(current).strip())
    return chunks


def included(path, root):
    rel = path.relative_to(root)
    if not rel.parts or rel.parts[0] not in INCLUDED_FOLDERS:
        return False
    normalized = path.name.lower().replace(" ", "_").replace("-", "_")
    if any(pattern in normalized for pattern in QUESTION_BANK_PATTERNS):
        return False
    return path.suffix.lower() in MATERIAL_EXTENSIONS


def main():
    parser = argparse.ArgumentParser(description="Extract LET freebies study notes into review material rows.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Freebies folder.")
    parser.add_argument("--output-base", default="freebies_review_materials", help="Output filename base under output/pdf.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    rows = []
    sources = []
    seen_text = set()

    for path in sorted(p for p in input_dir.rglob("*") if p.is_file() and included(p, input_dir)):
        text = read_text(path)
        text_key = re.sub(r"\s+", " ", text[:20000]).strip().lower()
        if len(text) < 350:
            sources.append({"source_path": str(path), "status": "too_short", "text_chars": len(text)})
            continue
        if text_key in seen_text:
            sources.append({"source_path": str(path), "status": "duplicate_text", "text_chars": len(text)})
            continue
        seen_text.add(text_key)

        subject_slug, topic_slug = slug_context(path)
        title_base = compact_title(path)
        pieces = chunks_for(text)
        for index, body in enumerate(pieces, 1):
            rows.append(
                {
                    "source_file": path.name,
                    "source_path": str(path),
                    "exam_scope": "both",
                    "subject_slug": subject_slug,
                    "topic_slug": topic_slug,
                    "title": f"LET Freebies Notes: {title_base}" + (f" (Part {index})" if len(pieces) > 1 else ""),
                    "body": f"Source: {path.name}\n\n{body}",
                    "material_type": "notes",
                    "is_premium": False,
                }
            )
        sources.append({"source_path": str(path), "status": "processed", "text_chars": len(text), "chunks": len(pieces), "topic": f"{subject_slug}/{topic_slug}"})

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUT_DIR / f"{args.output_base}.json"
    summary_path = OUT_DIR / f"{args.output_base}_summary.json"
    output.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    summary = {
        "input_dir": str(input_dir),
        "source_files_seen": len(sources),
        "source_files_processed": sum(1 for source in sources if source["status"] == "processed"),
        "materials_generated": len(rows),
        "sources": sources,
        "output": str(output),
    }
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
