#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

from extract_sept2026_let_reviewers import (
    DEFAULT_INPUT,
    FIELDS,
    OUT_DIR,
    STATUS_VALUES,
    VISUAL_CUE_RE,
    clean_page_text,
    confidence_for,
    infer_exam_type,
    infer_subject_area,
    infer_topic,
    inline_answer,
    mark_duplicates,
    normalize_key,
    normalize_space,
    parse_answer_key,
    split_numbered_blocks,
    split_question_and_choices,
    status_for,
    write_outputs,
)


BASE = "gened_profed_office_sept2026_extracted_questions"
DEFAULT_FOLDER = DEFAULT_INPUT / "A. BEED&BSED GENED & PROFED-"
OFFICE_EXTENSIONS = {".doc", ".docx", ".ppt", ".pptx"}


def run(args, allow_fail=False, timeout=45):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    if result.returncode and not allow_fail:
        raise RuntimeError(f"Command failed: {' '.join(map(str, args))}\n{result.stderr}")
    return result.stdout


def text_from_ooxml(path, prefixes):
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


def text_from_legacy_office(path):
    return run(["textutil", "-convert", "txt", "-stdout", str(path)], allow_fail=True, timeout=60)


def read_office_text(path):
    suffix = path.suffix.lower()
    if suffix == ".docx":
        text = text_from_ooxml(path, ["word/document"])
    elif suffix == ".pptx":
        text = text_from_ooxml(path, ["ppt/slides/"])
    else:
        text = text_from_legacy_office(path)

    text = text.replace("\u00a0", " ")
    text = re.sub(r"(?im)^\s*([A-E])\s*[\r\n]+\s*[\.)]\s*", r"\1. ", text)
    text = re.sub(r"(?im)^\s*([a-e])\s*[\r\n]+\s*[\.)]\s*", lambda m: f"{m.group(1).upper()}. ", text)
    text = re.sub(r"(?im)^\s*([A-Ea-e])\s*[\.)]\s*", lambda m: f"{m.group(1).upper()}. ", text)
    text = re.sub(r"(?im)^\s*(\d{1,4})\s*[\r\n]+\s*[\.)]\s*", r"\1. ", text)
    return clean_page_text(text)


def answer_source_for(text, answer_key, qnum, answer):
    if answer_key.get(qnum):
        return "Correct answer sourced from detected answer key section."
    if answer:
        return "Correct answer embedded inline."
    if re.search(r"\b(answer key|answers:|correct answers|sagot)\b", text, re.I):
        return "Answer key exists in source text but this item was not matched confidently."
    return "No answer key or embedded answer was matched for this item."


def clean_choice_markers(choices):
    cleaned = {}
    starred = ""
    for letter, value in choices.items():
        text = str(value or "").strip()
        if "*" in text and not starred:
            starred = letter
        text = re.sub(r"\s*\*+\s*", " ", text)
        cleaned[letter] = normalize_space(text)
    return cleaned, starred


def source_relative_path(path, source_root):
    try:
        return path.relative_to(source_root.parent)
    except ValueError:
        return path


def extract_office_file(path, source_root):
    text = read_office_text(path)
    if not text.strip():
        return [], {"path": str(path), "status": "no_text", "rows": 0, "pages": 0, "format": path.suffix.lower()}

    answer_key, answer_note, answer_key_idx = parse_answer_key(text)
    question_text = text[:answer_key_idx] if answer_key_idx >= 0 and len(answer_key) >= 3 else text
    relative_path = source_relative_path(path, source_root)
    exam_type, exam_note = infer_exam_type(relative_path)
    rows = []

    for qnum, _, _, _, block in split_numbered_blocks(question_text, max_jump=20):
        question, choices = split_question_and_choices(block)
        if not question and not choices:
            continue

        choices, starred_answer = clean_choice_markers(choices)
        answer = answer_key.get(qnum, "") or inline_answer(block) or starred_answer
        answer_source = answer_note if answer_key.get(qnum, "") else ("Correct answer marked with an asterisk in the source choice." if starred_answer and answer == starred_answer else ("Correct answer embedded inline." if answer else ""))
        subject = infer_subject_area(relative_path, question)
        topic = infer_topic(subject, question)
        notes = [
            exam_note,
            "Source is an Office document; page number is unavailable from text extraction.",
            answer_source_for(text, answer_key, qnum, answer),
        ]
        if VISUAL_CUE_RE.search(question):
            notes.append("Visual-reference language was detected; manually review the Office source for possible embedded images.")

        row = {
            "No.": "",
            "Original No.": str(qnum),
            "Page": "Office",
            "Source PDF": path.name,
            "Source Path": str(path),
            "Question": normalize_space(question),
            "Passage Reference": "",
            "Question Image Reference": "",
            "Choice A": normalize_space(choices.get("A", "")),
            "Choice A Image Reference": "",
            "Choice B": normalize_space(choices.get("B", "")),
            "Choice B Image Reference": "",
            "Choice C": normalize_space(choices.get("C", "")),
            "Choice C Image Reference": "",
            "Choice D": normalize_space(choices.get("D", "")),
            "Choice D Image Reference": "",
            "Choice E": normalize_space(choices.get("E", "")),
            "Choice E Image Reference": "",
            "Correct Answer": answer,
            "Explanation": "",
            "LET Exam Type": exam_type,
            "Subject Area": subject,
            "Topic": topic,
            "Difficulty": "Cannot Determine",
            "Has Image": "No",
            "Duplicate Of": "",
            "Confidence": "",
            "Status": "",
            "Notes": normalize_space(" ".join(notes)),
        }
        row["Status"] = status_for(row, 0)
        row["Confidence"] = confidence_for(row, answer_source)
        rows.append(row)

    return rows, {
        "path": str(path),
        "status": "processed" if rows else "no_questions_found",
        "rows": len(rows),
        "pages": 0,
        "format": path.suffix.lower(),
        "answer_keys_detected": len(answer_key),
        "text_chars": len(text),
    }


def build_summary(rows, sources, output_paths, input_dir):
    status_counts = Counter(row["Status"] for row in rows)
    exam_counts = Counter(row["LET Exam Type"] for row in rows)
    subject_counts = Counter(row["Subject Area"] for row in rows)
    difficulty_counts = Counter(row["Difficulty"] for row in rows)
    source_counts = Counter(row["Source PDF"] for row in rows)
    format_counts = Counter(source.get("format", "unknown") for source in sources)
    return {
        "input_dir": str(input_dir),
        "generated_at": "2026-06-25",
        "total_office_files_seen": len(sources),
        "total_office_files_processed": sum(1 for source in sources if source["status"] == "processed"),
        "format_counts": dict(format_counts),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(
            status_counts.get(status, 0)
            for status in ["Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"]
        ),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": 0,
        "total_questions_with_image_based_answer_choices": 0,
        "total_elementary_questions": exam_counts.get("LET Elementary", 0),
        "total_secondary_questions": exam_counts.get("LET Secondary", 0),
        "total_both_or_cannot_determine_questions": exam_counts.get("Both", 0) + exam_counts.get("Cannot Determine", 0),
        "status_counts": dict(status_counts),
        "exam_type_counts": dict(exam_counts),
        "subject_category_breakdown": dict(subject_counts),
        "difficulty_breakdown": dict(difficulty_counts),
        "source_counts_top_75": dict(source_counts.most_common(75)),
        "sources": sources,
        "outputs": output_paths,
        "recommended_next_action_before_uploading": (
            "Upload only Ready for Upload rows. Office rows marked Needs Answer usually lack a reliably parsed answer key. "
            "Rows marked Incomplete often came from unlabelled multiple-choice blocks and need manual review."
        ),
    }


def main():
    parser = argparse.ArgumentParser(description="Extract LET GenEd/ProfEd questions from Office reviewer files.")
    parser.add_argument("--input", default=str(DEFAULT_FOLDER), help="Folder containing Office reviewer files.")
    parser.add_argument("--output-base", default=BASE, help="Output filename base under output/pdf.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir}")

    files = sorted(path for path in input_dir.rglob("*") if path.is_file() and path.suffix.lower() in OFFICE_EXTENSIONS)
    rows = []
    sources = []
    for path in files:
        try:
            extracted, source = extract_office_file(path, input_dir)
            rows.extend(extracted)
            sources.append(source)
            print(json.dumps({"processed": str(path), "rows": len(extracted), "format": source["format"]}), flush=True)
        except Exception as exc:
            sources.append({"path": str(path), "status": "error", "rows": 0, "pages": 0, "format": path.suffix.lower(), "error": str(exc)})
            print(json.dumps({"error": str(path), "message": str(exc)}), flush=True)

    for idx, row in enumerate(rows, 1):
        row["No."] = str(idx)
    mark_duplicates(rows)
    for row in rows:
        row["Confidence"] = confidence_for(row, row["Correct Answer"])
        if row["Status"] not in STATUS_VALUES:
            row["Status"] = "Needs Review"
        if row["Status"] == "Ready for Upload" and row["Page"] == "Office":
            row["Notes"] = normalize_space(row["Notes"] + " Page number unavailable for Office source.")

    output_paths = write_outputs(rows, {"pending": True}, args.output_base)
    summary = build_summary(rows, sources, output_paths, input_dir)
    output_paths = write_outputs(rows, summary, args.output_base)
    summary["outputs"] = output_paths
    (OUT_DIR / f"{args.output_base}_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
