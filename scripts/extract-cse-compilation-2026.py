#!/usr/bin/env python3
import argparse
import csv
import hashlib
import importlib.util
import json
import re
from collections import Counter
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/pdf"
DEFAULT_INPUT = Path("/Users/lyndon/All reviewers/Civil Service Exam/CIVIL SERVICE EXAM REVIEWERS 2026")
DEFAULT_BASE = "cse_compilation_2026_extracted_questions"
GENERIC_EXTRACTOR = ROOT / "scripts/extract_sept2026_let_reviewers.py"
LATEST_PACKAGE_TOKEN = "CSE REVIEWER 2026 LATEST"

LATEST_KEY_SECTIONS = [
    ("VOCABULARY", "VOCABULARY-1.pdf", "Both", "Vocabulary", "vocabulary"),
    ("GRAMMAR AND CORRECT USAGE", "GRAMMAR AND CORRECT USAGE.pdf", "Both", "English Grammar and Correct Usage", "grammar"),
    ("READING COMPREHENSION", "READING COMPREHENSION.pdf", "Both", "Reading Comprehension", "reading-comp"),
    ("LOGICAL REASONING", "LOGICAL REASONING.pdf", "Professional", "Logic and Critical Thinking", "logic"),
    ("WORD ANALOGY", "WORD ANALOGY.pdf", "Professional", "Word Association", "word-association"),
    ("SPELLING", "SPELLING.pdf", "Subprofessional", "Spelling", "spelling"),
    ("FINDING ERRORS", "FINDING ERRORS.pdf", "Subprofessional", "Clerical Ability", "data-checking"),
    ("CORRECT HOMOPHONE", "CORRECT HOMOPHONE.pdf", "Subprofessional", "Spelling", "spelling"),
    ("BASIC CONCEPTS, NUMERICAL ANALOGY & SERIES NUMBERS", "BASIC CONCEPTS.pdf", "Both", "Numerical Ability", "basic-operations"),
    ("PROBLEM SOLVING", "PROBLEM SOLVING SKILLS.pdf", "Both", "Word Problems", "word-problems"),
]

# These self-contained items were checked independently against their choices.
# Rows not listed here remain in the audit output but are never publication-ready.
INDEPENDENT_VALIDATION = {
    "WORD ANALOGY.pdf": {9: "C", 32: "C"},
    "SPELLING.pdf": {3: "A", 4: "C", 14: "A", 22: "B"},
    "BASIC CONCEPTS.pdf": {
        1: "D", 6: "B", 16: "C", 17: "B", 18: "A", 19: "A", 23: "B", 24: "D",
        27: "A", 28: "D", 30: "A", 40: "D", 44: "D", 46: "D", 48: "B", 49: "A",
        51: "B", 53: "C", 54: "A", 55: "C",
    },
    "PROBLEM SOLVING SKILLS.pdf": {
        1: "B", 2: "A", 3: "B", 4: "B", 5: "A", 6: "B", 7: "A", 8: "D",
        9: "D", 10: "B", 11: "B", 12: "C", 13: "B", 14: "B", 15: "B", 16: "A",
        19: "C", 20: "C", 21: "C", 22: "B", 24: "C", 25: "A", 28: "D", 30: "B",
    },
    "VOCABULARY-1.pdf": {
        2: "A", 48: "A", 49: "C", 50: "B", 51: "C", 52: "A", 54: "C",
        55: "D", 56: "D", 57: "C", 58: "C", 59: "A", 60: "A",
    },
}

QUESTION_TEXT_FIXES = {
    ("BASIC CONCEPTS.pdf", 6): "What comes next in the series: 9, 12; 18, 13; 16, 15; 13, 18; 9, 22; ____?",
    ("BASIC CONCEPTS.pdf", 40): "What is the smallest positive number that gives a remainder of 3 when divided by 4, 5, or 10?",
    ("PROBLEM SOLVING SKILLS.pdf", 16): "Car A averages 8 km per liter of fuel. Car B averages 12 km per liter. If fuel costs P10 per liter, how much less would a 600 km trip cost for Car B than for Car A?",
}


def load_generic_extractor():
    spec = importlib.util.spec_from_file_location("mixed_question_extractor", GENERIC_EXTRACTOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


extractor = load_generic_extractor()
GENERIC_PAGE_IMAGE_COUNTS = extractor.page_image_counts

CSE_FIELDS = ["CSE Exam Type" if field == "LET Exam Type" else field for field in extractor.FIELDS]
SUPPORTED_SUFFIXES = extractor.SUPPORTED_SUFFIXES


def effective_suffix(path):
    return Path(path.name.strip()).suffix.lower()


def file_hash(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def latest_package_answer_keys(input_dir):
    key_files = list(input_dir.rglob("ANSWER KEYS.pdf"))
    key_path = next((path for path in key_files if LATEST_PACKAGE_TOKEN in str(path)), None)
    if not key_path:
        return {}
    text = extractor.run(["pdftotext", "-layout", str(key_path), "-"], allow_fail=True).replace("\f", "\n")
    positions = []
    cursor = 0
    for heading, filename, exam_type, subject, topic in LATEST_KEY_SECTIONS:
        match = re.search(rf"(?m)^\s*{re.escape(heading)}\s*$", text[cursor:], re.I)
        if not match:
            continue
        start = cursor + match.end()
        positions.append((start, heading, filename, exam_type, subject, topic))
        cursor = start
    answer_keys = {}
    for index, (start, heading, filename, exam_type, subject, topic) in enumerate(positions):
        end = positions[index + 1][0] if index + 1 < len(positions) else len(text)
        answers = {int(number): letter.upper() for number, letter in re.findall(r"(?m)^\s*(\d{1,3})\.\s*([A-E])\b", text[start:end], re.I)}
        answer_keys[filename] = {
            "answers": answers,
            "heading": heading,
            "exam_type": exam_type,
            "subject": subject,
            "topic": topic,
            "key_path": str(key_path),
        }
    return answer_keys


def read_pdf_pages(path):
    raw = extractor.run(["pdftotext", "-raw", str(path), "-"], allow_fail=True)
    pages = raw.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    expected = extractor.pdf_page_count(path)
    pages = [extractor.clean_page_text(page) for page in pages]
    if expected and len(pages) < expected:
        pages.extend([""] * (expected - len(pages)))
    return pages


def read_source_pages(path):
    suffix = effective_suffix(path)
    if suffix == ".pdf":
        pages = read_pdf_pages(path)
        return pages, "pdf", len(pages)
    if suffix == ".docx":
        text = extractor.clean_extracted_text(extractor.ooxml_text(path, ["word/document"]))
        return ([text] if text else []), "docx", 1 if text else 0
    if suffix in {".pptx", ".ppsx"}:
        slides = []
        import zipfile

        with zipfile.ZipFile(path) as archive:
            names = sorted(
                name
                for name in archive.namelist()
                if name.startswith("ppt/slides/slide") and name.endswith(".xml")
            )
        for name in names:
            text = extractor.clean_extracted_text(extractor.ooxml_text(path, [name]))
            if text:
                slides.append(text)
        return slides, suffix.lstrip("."), len(slides)
    if suffix in {".doc", ".ppt", ".rtf"}:
        text = extractor.clean_extracted_text(extractor.textutil_text(path))
        return ([text] if text else []), suffix.lstrip("."), 1 if text else 0
    if suffix in {".txt", ".md"}:
        text = extractor.clean_extracted_text(extractor.read_text_file(path))
        return ([text] if text else []), suffix.lstrip("."), 1 if text else 0
    if suffix in {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}:
        text = extractor.clean_extracted_text(extractor.ocr_image_text(path))
        return ([text] if text else []), "image", 1 if text else 0
    return [], suffix.lstrip(".") or "unknown", 0


def page_image_counts(path, page_count):
    if effective_suffix(path) != ".pdf":
        return Counter()
    return GENERIC_PAGE_IMAGE_COUNTS(path, page_count)


def infer_exam_type(path):
    text = str(path).lower().replace("_", " ").replace("-", " ")
    has_sub = bool(re.search(r"\bsub\s*pro(?:fessional)?\b|subprofessional", text))
    has_pro = bool(re.search(r"\bprofessional\b|\bprof\b", text)) and not has_sub
    if has_sub and re.search(r"\bprofessional\b|\bprof\b", text.replace("subprofessional", "")):
        return "Both", "Source path explicitly covers Professional and Subprofessional CSE."
    if has_sub:
        return "Subprofessional", "Source path identifies CSE Subprofessional material."
    if has_pro:
        return "Professional", "Source path identifies CSE Professional material."
    if re.search(r"clerical|filing|alphabetiz|data checking", text):
        return "Subprofessional", "Clerical content maps to the CSE Subprofessional scope."
    return "Both", "General CSE material is eligible for compatible Professional and Subprofessional topics."


def classify_topic(path, question):
    path_text = str(path).lower().replace("_", " ").replace("-", " ")
    q = str(question or "").lower()
    text = f"{path_text} {q}"

    if re.search(r"abstract reasoning|non verbal|nonverbal|figural|pattern completion|odd one out", path_text):
        if re.search(r"odd one|different figure|does not belong", q):
            return "Abstract Reasoning - Odd One Out", "odd-one-out"
        if re.search(r"analogy|is to|related to", q):
            return "Abstract Reasoning - Analogies", "analogies"
        if re.search(r"series|sequence|next figure", q):
            return "Abstract Reasoning - Series Completion", "series-completion"
        return "Abstract Reasoning - Pattern Completion", "pattern-completion"

    if re.search(r"alphabetiz|filing", text):
        return "Filing and Alphabetizing", "filing-coding"
    if re.search(r"spelling|misspelled|correctly spelled", text):
        return "Spelling", "spelling"
    if re.search(r"data checking|clerical|coding", path_text):
        return "Clerical Ability", "data-checking"

    is_filipino = bool(re.search(r"filipino|tagalog|kasingkahulugan|kasalungat|wastong gamit|pag unawa|pagtatalata", text))
    if is_filipino:
        if re.search(r"pag unawa|talata|binasa|passage|reading", text):
            return "Filipino Reading Comprehension", "reading-comp-fil"
        if re.search(r"pagtatalata|paragraph|ayos ng mga pangungusap", text):
            return "Filipino Paragraph Organization", "paragraph-org-fil"
        if re.search(r"wastong gamit|maling gamit|balarila|pangungusap|grammar", text):
            return "Filipino Grammar", "grammar-fil"
        return "Filipino Vocabulary", "vocabulary-fil"

    if re.search(r"ra\s*6713|code of conduct|ethical standards|public officer|public employee", text):
        return "Code of Conduct and Ethical Standards", "ra-6713"
    if re.search(r"human rights|peace and human rights", text):
        return "Peace and Human Rights", "peace-human-rights"
    if re.search(r"environment|ecology|climate|pollution|natural resources", path_text):
        return "Environment Management and Protection", "environment"
    if re.search(r"constitution|bill of rights|article\s+[ivx]+|constitutional", text):
        return "Philippine Constitution", "constitution"
    if re.search(r"philippine government|government|president|senate|congress|history|current events|republic act|labor code", path_text):
        return "General Information", "phil-government"

    if re.search(r"data interpretation|table|chart|graph", path_text):
        return "Data Interpretation", "data-interpretation"
    if re.search(r"assumption|conclusion|syllogism|statement and conclusion", text):
        return "Assumptions and Conclusions", "assumptions-conclusions"
    if re.search(r"analogy|word association", path_text):
        return "Word Association", "word-association"
    if re.search(r"logic|logical reasoning|critical thinking|analytical", path_text):
        return "Logic and Critical Thinking", "logic"

    if re.search(r"number series|numerical series|sequence", text):
        return "Number Series", "number-series"
    if re.search(r"word problem|age problem|rate problem|work problem|mixture problem", path_text):
        return "Word Problems", "word-problems"
    if re.search(r"math|mathematics|numerical|quantitative|algebra|arithmetic|fraction|percentage|decimal", path_text):
        return "Numerical Ability", "basic-operations"

    if re.search(r"reading comprehension|critical reading|passage", path_text):
        return "Reading Comprehension", "reading-comp"
    if re.search(r"paragraph organization|sentence completion|paragraph development", path_text):
        return "Paragraph Organization", "paragraph-org"
    if re.search(r"grammar|correct usage|identifying errors|verb drills", path_text):
        return "English Grammar and Correct Usage", "grammar"
    if re.search(r"vocabulary|synonym|antonym|idiom|word meaning", path_text):
        return "Vocabulary", "vocabulary"
    if re.search(r"verbal comprehension|verbal reasoning", path_text):
        return "Verbal Comprehension", "verbal-comprehension"

    if re.search(r"synonym|antonym|meaning of the word|closest in meaning|opposite in meaning", q):
        return "Vocabulary", "vocabulary"
    if re.search(r"grammatically|correct sentence|error in the sentence|correct usage|subject verb", q):
        return "English Grammar and Correct Usage", "grammar"
    if re.search(r"main idea|according to the passage|author implies|passage", q):
        return "Reading Comprehension", "reading-comp"
    if re.search(r"arrange|best order|coherent paragraph|paragraph", q):
        return "Paragraph Organization", "paragraph-org"
    if re.search(r"how many|how much|percent|ratio|average|sum|difference|product|quotient", q):
        return "Word Problems", "word-problems"
    return "Verbal Comprehension", "verbal-comprehension"


def infer_subject_area(path, question):
    return classify_topic(path, question)[0]


def infer_topic(subject, question):
    # extract_source calls this without the path, so the subject classifier carries
    # enough specificity for all deterministic mappings.
    return {
        "Abstract Reasoning - Odd One Out": "odd-one-out",
        "Abstract Reasoning - Analogies": "analogies",
        "Abstract Reasoning - Series Completion": "series-completion",
        "Abstract Reasoning - Pattern Completion": "pattern-completion",
        "Filing and Alphabetizing": "filing-coding",
        "Spelling": "spelling",
        "Clerical Ability": "data-checking",
        "Filipino Reading Comprehension": "reading-comp-fil",
        "Filipino Paragraph Organization": "paragraph-org-fil",
        "Filipino Grammar": "grammar-fil",
        "Filipino Vocabulary": "vocabulary-fil",
        "Code of Conduct and Ethical Standards": "ra-6713",
        "Peace and Human Rights": "peace-human-rights",
        "Environment Management and Protection": "environment",
        "Philippine Constitution": "constitution",
        "General Information": "phil-government",
        "Data Interpretation": "data-interpretation",
        "Assumptions and Conclusions": "assumptions-conclusions",
        "Word Association": "word-association",
        "Logic and Critical Thinking": "logic",
        "Number Series": "number-series",
        "Word Problems": "word-problems",
        "Numerical Ability": "basic-operations",
        "Reading Comprehension": "reading-comp",
        "Paragraph Organization": "paragraph-org",
        "English Grammar and Correct Usage": "grammar",
        "Vocabulary": "vocabulary",
        "Verbal Comprehension": "verbal-comprehension",
    }.get(subject, "verbal-comprehension")


def final_status(row):
    choices = [row.get(f"Choice {letter}", "").strip() for letter in "ABCDE"]
    present = [choice for choice in choices if choice]
    answer = str(row.get("Correct Answer", "")).upper()
    if row.get("Duplicate Of"):
        return "Duplicate"
    if not row.get("Question") or len(present) < 4:
        return "Incomplete"
    if not row.get("Trusted Answer Key"):
        return "Needs Review"
    if not row.get("Independent Validation"):
        return "Needs Review"
    if row.get("Question Image Reference") or any(row.get(f"Choice {letter} Image Reference") for letter in "ABCDE"):
        return "Needs Image Extraction"
    if not answer:
        return "Needs Answer"
    answer_index = ord(answer) - ord("A") if answer in "ABCDE" else -1
    if answer_index < 0 or answer_index >= len(choices) or not choices[answer_index]:
        return "Needs Review"
    if len(set(extractor.normalize_key(choice) for choice in present)) != len(present):
        return "Needs Review"
    combined = " ".join([row.get("Question", ""), *present])
    if len(row.get("Question", "")) > 2000 or any(len(choice) > 800 for choice in present):
        return "Needs Review"
    if re.search(r"\b(solution|answer key|all rights reserved|isbn|not for sale|prepared by|shared for free)\s*[:.]?", combined, re.I):
        return "Needs Review"
    if any(re.search(r"\b[A-E][.)]\s*[A-Za-z]", choice) for choice in present):
        return "Needs Review"
    if re.search(r"[-�]", combined):
        return "Needs Review"
    if row.get("Topic") in {"pattern-completion", "series-completion", "analogies", "odd-one-out"}:
        return "Needs Image Extraction"
    return "Ready for Upload"


def write_outputs(rows, summary, output_base):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUT_DIR / f"{output_base}.csv"
    json_path = OUT_DIR / f"{output_base}.json"
    md_path = OUT_DIR / f"{output_base}.md"
    summary_path = OUT_DIR / f"{output_base}_summary.json"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSE_FIELDS, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    json_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    esc = lambda value: str(value or "").replace("|", "\\|").replace("\n", "<br>")
    lines = ["| " + " | ".join(CSE_FIELDS) + " |", "| " + " | ".join(["---"] * len(CSE_FIELDS)) + " |"]
    lines.extend("| " + " | ".join(esc(row.get(field, "")) for field in CSE_FIELDS) + " |" for row in rows)
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"csv": str(csv_path), "json": str(json_path), "md": str(md_path), "summary": str(summary_path)}


def main():
    parser = argparse.ArgumentParser(description="Extract CSE questions from a mixed reviewer compilation.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--output-base", default=DEFAULT_BASE)
    parser.add_argument("--max-files", type=int, default=0)
    args = parser.parse_args()
    input_dir = Path(args.input)
    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir}")

    extractor.read_pdf_pages = read_pdf_pages
    extractor.read_source_pages = read_source_pages
    extractor.page_image_counts = page_image_counts
    extractor.infer_exam_type = infer_exam_type
    extractor.infer_subject_area = infer_subject_area
    extractor.infer_topic = infer_topic

    all_files = sorted(path for path in input_dir.rglob("*") if path.is_file() and path.name != ".DS_Store")
    package_keys = latest_package_answer_keys(input_dir)
    selected = [path for path in all_files if effective_suffix(path) in SUPPORTED_SUFFIXES]
    if args.max_files:
        selected = selected[: args.max_files]

    rows = []
    sources = []
    seen_hashes = {}
    for path in all_files:
        suffix = effective_suffix(path)
        if suffix not in SUPPORTED_SUFFIXES:
            sources.append({"path": str(path), "source_type": suffix.lstrip(".") or "unknown", "status": "unsupported", "rows": 0, "pages": 0})
    for path in selected:
        try:
            digest = file_hash(path)
            if digest in seen_hashes:
                sources.append({"path": str(path), "source_type": effective_suffix(path).lstrip("."), "status": "duplicate_source_file", "duplicate_of": seen_hashes[digest], "sha256": digest, "rows": 0, "pages": 0})
                continue
            seen_hashes[digest] = str(path)
            extracted, source = extractor.extract_source(path, input_dir)
            source["sha256"] = digest
            rows.extend(extracted)
            sources.append(source)
            print(json.dumps({"processed": str(path), "type": source.get("source_type"), "rows": len(extracted), "pages": source.get("pages", 0)}), flush=True)
        except Exception as exc:
            sources.append({"path": str(path), "source_type": effective_suffix(path).lstrip(".") or "unknown", "status": "error", "rows": 0, "pages": 0, "error": str(exc)})
            print(json.dumps({"error": str(path), "message": str(exc)}), flush=True)

    for index, row in enumerate(rows, 1):
        row["No."] = str(index)
    extractor.mark_duplicates(rows)
    for row in rows:
        row["CSE Exam Type"] = row.pop("LET Exam Type")
        row["Question"] = re.sub(r"^\)\s*", "", row.get("Question", "")).strip()
        row["Trusted Answer Key"] = False
        row["Independent Validation"] = False
        source_config = package_keys.get(row.get("Source PDF"))
        is_latest_source = LATEST_PACKAGE_TOKEN in row.get("Source Path", "")
        original_number = int(row.get("Original No.") or 0)
        if source_config and is_latest_source and original_number in source_config["answers"]:
            row["Correct Answer"] = source_config["answers"][original_number]
            row["CSE Exam Type"] = source_config["exam_type"]
            row["Subject Area"] = source_config["subject"]
            row["Topic"] = source_config["topic"]
            row["Trusted Answer Key"] = True
            row["Notes"] = extractor.normalize_space(
                f"{row.get('Notes', '')} Correct answer matched by section and original question number "
                f"to {Path(source_config['key_path']).name}, section {source_config['heading']}."
            )
        elif row.get("Correct Answer"):
            row["Notes"] = extractor.normalize_space(
                f"{row.get('Notes', '')} Automated answer alignment is retained for audit only and is not trusted for publication."
            )
        validated_answer = INDEPENDENT_VALIDATION.get(row.get("Source PDF"), {}).get(original_number)
        if row["Trusted Answer Key"] and validated_answer:
            row["Correct Answer"] = validated_answer
            row["Question"] = QUESTION_TEXT_FIXES.get((row.get("Source PDF"), original_number), row["Question"])
            row["Independent Validation"] = True
            row["Notes"] = extractor.normalize_space(
                f"{row.get('Notes', '')} Answer and self-contained wording independently validated before publication."
            )
        row["Status"] = final_status(row)
        row["Confidence"] = extractor.confidence_for({**row, "LET Exam Type": row["CSE Exam Type"]}, row.get("Correct Answer"))
        row.pop("Trusted Answer Key", None)
        row.pop("Independent Validation", None)

    status_counts = Counter(row["Status"] for row in rows)
    exam_counts = Counter(row["CSE Exam Type"] for row in rows)
    topic_counts = Counter(row["Topic"] for row in rows)
    source_type_counts = Counter(source.get("source_type", "unknown") for source in sources)
    source_status_counts = Counter(source.get("status", "unknown") for source in sources)
    outputs = write_outputs(rows, {"pending": True}, args.output_base)
    summary = {
        "input_dir": str(input_dir),
        "generated_at": date.today().isoformat(),
        "total_files_seen": len(all_files),
        "supported_files_seen": len(selected),
        "unique_supported_files_processed": len(seen_hashes),
        "source_type_counts": dict(source_type_counts),
        "source_status_counts": dict(source_status_counts),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(status_counts.get(status, 0) for status in ["Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"]),
        "total_without_answer_key": sum(1 for row in rows if not row.get("Correct Answer")),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in rows if row.get("Has Image") == "Yes"),
        "status_counts": dict(status_counts),
        "exam_type_counts": dict(exam_counts),
        "topic_counts": dict(topic_counts),
        "sources": sources,
        "outputs": outputs,
        "recommended_next_action": "Upload only Ready for Upload rows. Keep incomplete, unanswered, duplicate, and image-dependent rows out of production until manually resolved.",
    }
    outputs = write_outputs(rows, summary, args.output_base)
    summary["outputs"] = outputs
    (OUT_DIR / f"{args.output_base}_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({key: value for key, value in summary.items() if key not in {"sources"}}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
