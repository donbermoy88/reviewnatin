#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/pdf"
DEFAULT_INPUT = Path("/Users/lyndon/All reviewers/-LET REVIEWER 2026/A. GENERAL EDUCATION")

SUPPORTED_SUFFIXES = {
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".txt",
    ".md",
    ".rtf",
    ".jpg",
    ".jpeg",
    ".png",
    ".tif",
    ".tiff",
    ".bmp",
    ".webp",
}


def run(args, timeout=180):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    return result.stdout if result.returncode == 0 else ""


def clean_text(value):
    value = str(value or "").replace("\x00", "")
    value = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", value)
    value = value.replace("–", "-").replace("—", "-")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def ooxml_parts(path, prefixes):
    parts = []
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
            text = clean_text("\n".join(texts))
            if text:
                parts.append(text)
    return parts


def read_text_file(path):
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="ignore")


def ocr_image(path):
    with tempfile.TemporaryDirectory(prefix="let_material_ocr_") as tmp:
        output_base = Path(tmp) / "ocr"
        run(["tesseract", str(path), str(output_base), "--psm", "6"], timeout=120)
        output = output_base.with_suffix(".txt")
        return output.read_text(encoding="utf-8", errors="ignore") if output.exists() else ""


def read_source(path):
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return [clean_text(run(["pdftotext", str(path), "-"], timeout=240))], "pdf"
    if suffix == ".docx":
        return [clean_text("\n\n".join(ooxml_parts(path, ["word/document"])))], "docx"
    if suffix == ".pptx":
        slides = ooxml_parts(path, ["ppt/slides/"])
        return slides, "pptx"
    if suffix in {".doc", ".ppt", ".rtf"}:
        return [clean_text(run(["textutil", "-convert", "txt", "-stdout", str(path)], timeout=180))], suffix.lstrip(".")
    if suffix in {".txt", ".md"}:
        return [clean_text(read_text_file(path))], suffix.lstrip(".")
    if suffix in {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}:
        return [clean_text(ocr_image(path))], "image"
    return [], suffix.lstrip(".") or "unknown"


def slug_context(path, text):
    path_source = " ".join(part.lower() for part in path.parts[-5:]).replace("_", " ").replace("-", " ")
    source = f"{path_source} {text[:4000].lower()}".replace("_", " ").replace("-", " ")
    if re.search(r"\bmajor subjects?\b|\barea of specialization\b", path_source):
        if re.search(r"\b(english|literature|vocabulary|grammar|linguistics|composition|reading comprehension|esl|efl)\b", path_source):
            return "major", "english"

    is_prof_ed = re.search(r"\b(professional education|prof ed|profed)\b", path_source)
    if is_prof_ed:
        if re.search(r"\b(child|adolescent|early childhood|sped|special education|inclusive|exceptional learner)\b", path_source):
            return "prof-ed", "child-development"
        if re.search(r"\b(facilitating learning|learning and motivation|motivation|learning theor|human learning)\b", path_source):
            return "prof-ed", "facilitating-learning"
        if re.search(r"\b(assessment|evaluation|test|testing|quiziz|quizizz|tos|table of specification)\b", path_source):
            return "prof-ed", "assessment-of-learning"
        if re.search(r"\b(curriculum|ubd|k to 12|k-12)\b", path_source):
            return "prof-ed", "curriculum-development"
        if re.search(r"\b(educational technology|ed tech|ict|information and communication|computer|media)\b", path_source):
            return "prof-ed", "educational-technology"
        if re.search(r"\b(field study|classroom management|learning environment|teaching aid|bulletin board)\b", path_source):
            return "prof-ed", "classroom-management"
        if re.search(r"\b(teaching profession|professional teacher|ppst|professional standards|code of ethics|faculty manual|legal bases|license|licensure|ncbts)\b", path_source):
            return "prof-ed", "teaching-profession"
        if re.search(r"\b(social dimension|social dimensions|community|society|multicultural|school community)\b", path_source):
            return "prof-ed", "social-dimensions"
        if re.search(r"\b(principles|strategies|methods|teaching|instruction|pedagogy)\b", path_source):
            return "prof-ed", "principles-of-teaching"
        if re.search(r"\b(assessment|evaluation|validity|reliability|rubric|item analysis|tos|table of specification)\b", source):
            return "prof-ed", "assessment-of-learning"
        if re.search(r"\b(curriculum|k to 12|k-12|spiral|ubd|tyler|syllabus)\b", source):
            return "prof-ed", "curriculum-development"
        if re.search(r"\b(piaget|erikson|freud|vygotsky|bandura|bruner|constructivist|behaviorism|scaffold|zpd|conditioning)\b", source):
            return "prof-ed", "facilitating-learning"
        if re.search(r"\b(code of ethics|professional teacher|professional standards|ppst|ncbts|ra 7836|licensure|prc)\b", source):
            return "prof-ed", "teaching-profession"
        if re.search(r"\b(social dimension|community|society|social justice|human rights|peace education|multicultural)\b", source):
            return "prof-ed", "social-dimensions"
        if re.search(r"\b(special education|inclusive|disability|indigenous|exceptional learner|mainstream)\b", source):
            return "prof-ed", "inclusive-education"
        if re.search(r"\b(educational technology|instructional material|audiovisual|cone of experience|computer assisted|media)\b", source):
            return "prof-ed", "educational-technology"
        return "prof-ed", "principles-of-teaching"

    if re.search(r"\b(english|literature|vocabulary|grammar|communication|purposive communication)\b", path_source):
        return "gen-ed", "english"
    if re.search(r"\b(filipino|fil\.|panitikan|wika|tagalog|mother tongue)\b", path_source):
        return "gen-ed", "filipino"
    if re.search(r"\b(math|mathematics|algebra|geometry|statistics)\b", path_source):
        return "gen-ed", "mathematics"
    if re.search(r"\b(social science|social studies|history|rizal|constitution|contemporary world|society|economics|government|tcw)\b", path_source):
        return "gen-ed", "social-science"
    if re.search(r"\b(ethics|values|art appreciation|humanities|understanding the self|understading the self|philosophy|moral)\b", path_source):
        return "gen-ed", "values-humanities"
    if re.search(r"\b(ict|information and communication|computer|internet|software|hardware)\b", path_source):
        return "gen-ed", "ict-current-trends"
    if re.search(r"\b(science|biology|chemistry|physics|earth science|sts|technology and society)\b", path_source):
        return "gen-ed", "science"
    if re.search(r"\b(social science|social studies|history|rizal|constitution|contemporary world|society|economics|government|tcw)\b", source):
        return "gen-ed", "social-science"
    if re.search(r"\b(ethics|values|art appreciation|humanities|understanding the self|understading the self|philosophy|moral)\b", source):
        return "gen-ed", "values-humanities"
    if re.search(r"\b(science|biology|chemistry|physics|earth science|sts|technology and society)\b", source):
        return "gen-ed", "science"
    if re.search(r"\b(ict|information and communication|computer|internet|software|hardware)\b", source):
        return "gen-ed", "ict-current-trends"
    if re.search(r"\b(filipino|fil\.|panitikan|wika|tagalog)\b", source):
        return "gen-ed", "filipino"
    if re.search(r"\b(math|mathematics|algebra|geometry|statistics)\b", source):
        return "gen-ed", "mathematics"
    return "gen-ed", "english"


def compact_title(path):
    title = path.stem
    title = re.sub(r"^\d+\.\s*", "", title)
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


def flashcard_from_slide(slide):
    lines = [line.strip(" -:\t") for line in slide.splitlines() if line.strip(" -:\t")]
    if len(lines) < 2:
        return None
    front = lines[0]
    back = "\n".join(lines[1:]).strip()
    if len(front) < 4 or len(front) > 220 or len(back) < 8:
        return None
    return front, back


def is_flashcard_source(path):
    return "flashcard" in path.name.lower() or "booster" in path.name.lower()


def main():
    parser = argparse.ArgumentParser(description="Extract LET mixed source files into review-material and flashcard JSON.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="LET source folder.")
    parser.add_argument("--output-base", default="let_gened_source_materials", help="Output filename base under output/pdf.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir}")

    material_rows = []
    flashcard_rows = []
    sources = []
    seen_material = set()
    seen_flashcard = set()

    files = sorted(path for path in input_dir.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES)
    for path in files:
        parts, source_type = read_source(path)
        parts = [part for part in parts if part and len(part) >= 20]
        full_text = clean_text("\n\n".join(parts))
        if len(full_text) < 120:
            sources.append({"source_path": str(path), "source_type": source_type, "status": "too_short", "text_chars": len(full_text)})
            continue

        subject_slug, topic_slug = slug_context(path, full_text)
        if subject_slug == "prof-ed":
            title_scope = "Professional Education"
        elif subject_slug == "major" and topic_slug == "english":
            title_scope = "English Major"
        else:
            title_scope = "General Education"
        exam_scope = "secondary" if subject_slug == "major" else "both"
        title_base = compact_title(path)
        text_key = re.sub(r"\s+", " ", full_text[:30000]).lower()
        material_count = 0
        if text_key not in seen_material:
            seen_material.add(text_key)
            for index, body in enumerate(chunks_for(full_text), 1):
                material_rows.append(
                    {
                        "source_file": path.name,
                        "source_type": source_type,
                        "source_path": str(path),
                        "exam_scope": exam_scope,
                        "subject_slug": subject_slug,
                        "topic_slug": topic_slug,
                        "title": f"LET {title_scope}: {title_base}" + (f" (Part {index})" if len(chunks_for(full_text)) > 1 else ""),
                        "body": f"Source: {path.name}\nSource type: {source_type}\n\n{body}",
                        "material_type": "notes",
                        "is_premium": False,
                    }
                )
                material_count += 1

        flashcard_count = 0
        if is_flashcard_source(path):
            for part in parts:
                card = flashcard_from_slide(part)
                if not card:
                    continue
                front, back = card
                key = f"{subject_slug}:{topic_slug}:{front.lower()}:{back.lower()}"
                if key in seen_flashcard:
                    continue
                seen_flashcard.add(key)
                flashcard_rows.append(
                    {
                        "source_file": path.name,
                        "source_type": source_type,
                        "source_path": str(path),
                        "exam_scope": exam_scope,
                        "subject_slug": subject_slug,
                        "topic_slug": topic_slug,
                        "front": front,
                        "back": f"{back}\n\nSource: {path.name}",
                        "is_premium": False,
                    }
                )
                flashcard_count += 1

        sources.append(
            {
                "source_path": str(path),
                "source_type": source_type,
                "status": "processed",
                "text_chars": len(full_text),
                "materials": material_count,
                "flashcards": flashcard_count,
                "topic": f"{subject_slug}/{topic_slug}",
            }
        )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    materials_path = OUT_DIR / f"{args.output_base}.json"
    flashcards_path = OUT_DIR / f"{args.output_base}_flashcards.json"
    summary_path = OUT_DIR / f"{args.output_base}_summary.json"
    materials_path.write_text(json.dumps(material_rows, indent=2, ensure_ascii=False), encoding="utf-8")
    flashcards_path.write_text(json.dumps(flashcard_rows, indent=2, ensure_ascii=False), encoding="utf-8")
    summary = {
        "input_dir": str(input_dir),
        "source_files_seen": len(sources),
        "source_files_processed": sum(1 for source in sources if source["status"] == "processed"),
        "materials_generated": len(material_rows),
        "flashcards_generated": len(flashcard_rows),
        "source_type_counts": {
            source_type: sum(1 for source in sources if source["source_type"] == source_type)
            for source_type in sorted({source["source_type"] for source in sources})
        },
        "sources": sources,
        "materials_output": str(materials_path),
        "flashcards_output": str(flashcards_path),
    }
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
