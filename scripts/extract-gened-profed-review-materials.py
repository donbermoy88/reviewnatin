#!/usr/bin/env python3
import json
import re
import subprocess
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/pdf"
INPUT_DIR = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files/A. BEED&BSED GENED & PROFED-")
OUTPUT = OUT_DIR / "gened_profed_review_materials.json"
SUMMARY = OUT_DIR / "gened_profed_review_materials_summary.json"

SOURCE_TOPICS = {
    "LET-GEN-ED-Survival Reviewers.docx": ("both", "gen-ed", "exam-guide"),
    "LET-MIXED-GenEd ProfEd Notes Lectures.docx": ("both", "prof-ed", "principles-of-teaching"),
    "LET-PROF-ED-Curriculum-Development 2.docx": ("both", "prof-ed", "curriculum-development"),
    "LET-PROF-ED-Educational-Philosophies-and-their-Proponents.docx": ("both", "prof-ed", "teaching-profession"),
    "LET-PROF-ED-Educational-Technology.docx": ("both", "prof-ed", "educational-technology"),
    "LET-PROF-ED-Facilitating-Human-Learning.docx": ("both", "prof-ed", "facilitating-learning"),
    "LET-PROF-ED-List of Scientist.docx": ("both", "prof-ed", "facilitating-learning"),
    "LET-PROF-ED-PHILOSOPHICAL FOUNDATIONS and THEORIES OF EDUCATION.ppt": ("both", "prof-ed", "teaching-profession"),
    "LET-PROF-ED-Prof-Ed-Key-Concepts-Theories-1.docx": ("both", "prof-ed", "principles-of-teaching"),
}


def run(args, timeout=60):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    return result.stdout if result.returncode == 0 else ""


def ooxml_text(path, prefixes):
    chunks = []
    with zipfile.ZipFile(path) as archive:
        names = sorted(
            name
            for name in archive.namelist()
            if any(name.startswith(prefix) for prefix in prefixes) and name.endswith(".xml")
        )
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
        text = ooxml_text(path, ["word/document"])
    elif suffix == ".pptx":
        text = ooxml_text(path, ["ppt/slides/"])
    elif suffix in {".doc", ".ppt"}:
        text = run(["textutil", "-convert", "txt", "-stdout", str(path)], timeout=90)
    else:
        text = ""
    text = text.replace("\x00", "")
    text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def compact_title(path):
    title = re.sub(r"^LET-(GEN|PROF)-ED-?", "", path.stem, flags=re.I)
    title = title.replace("_", " ").replace("-", " ")
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


def main():
    rows = []
    seen_paths = set()
    sources = []
    for path in sorted(INPUT_DIR.rglob("*")):
        if not path.is_file() or path.name not in SOURCE_TOPICS:
            continue
        # The same mixed notes file exists in both GenEd and ProfEd folders. Keep both source paths out of the
        # material body, but avoid duplicating identical titles/content in the app.
        key = (path.name, path.stat().st_size)
        if key in seen_paths:
            continue
        seen_paths.add(key)

        scope, subject_slug, topic_slug = SOURCE_TOPICS[path.name]
        text = read_text(path)
        if len(text) < 350:
            sources.append({"source_path": str(path), "status": "too_short", "text_chars": len(text)})
            continue

        title_base = compact_title(path)
        pieces = chunks_for(text)
        for index, body in enumerate(pieces, 1):
            rows.append(
                {
                    "source_file": path.name,
                    "source_path": str(path),
                    "exam_scope": scope,
                    "subject_slug": subject_slug,
                    "topic_slug": topic_slug,
                    "title": f"LET GenEd/ProfEd Notes: {title_base}" + (f" (Part {index})" if len(pieces) > 1 else ""),
                    "body": f"Source: {path.name}\n\n{body}",
                    "material_type": "notes",
                    "is_premium": False,
                }
            )
        sources.append({"source_path": str(path), "status": "processed", "text_chars": len(text), "chunks": len(pieces)})

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    summary = {
        "input_dir": str(INPUT_DIR),
        "source_files_processed": sum(1 for source in sources if source["status"] == "processed"),
        "materials_generated": len(rows),
        "sources": sources,
        "output": str(OUTPUT),
    }
    SUMMARY.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
