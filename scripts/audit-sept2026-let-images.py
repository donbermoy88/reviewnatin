#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

from extract_sept2026_let_reviewers import (
    DEFAULT_INPUT,
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
    normalize_space,
    parse_answer_key,
    split_numbered_blocks,
    split_question_and_choices,
    status_for,
    write_outputs,
)


BASE = "sept2026_nonpdf_image_extracted_questions"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff"}


def run(args, allow_fail=False, timeout=90):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    if result.returncode and not allow_fail:
        raise RuntimeError(f"Command failed: {' '.join(map(str, args))}\n{result.stderr}")
    return result.stdout


def image_dimensions(path):
    output = run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)], allow_fail=True, timeout=15)
    width = height = 0
    for line in output.splitlines():
        if "pixelWidth:" in line:
            width = int(line.rsplit(":", 1)[1].strip() or 0)
        if "pixelHeight:" in line:
            height = int(line.rsplit(":", 1)[1].strip() or 0)
    return width, height


def ocr_image(path):
    text = run(["tesseract", str(path), "stdout", "--psm", "6"], allow_fail=True, timeout=120)
    text = text.replace("\u00a0", " ")
    text = re.sub(r"(?im)^\s*([A-Ea-e])\s*[\.)]\s*", lambda m: f"{m.group(1).upper()}. ", text)
    text = re.sub(r"(?im)^\s*(\d{1,4})\s*[\.)]\s*", r"\1. ", text)
    return clean_page_text(text)


def source_relative_path(path, source_root):
    try:
        return path.relative_to(source_root.parent)
    except ValueError:
        try:
            return path.relative_to(source_root)
        except ValueError:
            return path


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


def classify_image(path, text, rows_found):
    path_text = str(path).lower()
    ocr = text.lower()
    if rows_found:
        return "question_candidate"
    if "tos" in path_text or re.search(r"\b(table of specifications|competenc|percent|percentage|no\. of items|number of items)\b", ocr):
        return "tos_or_table"
    if not normalize_space(text):
        return "no_text"
    if re.search(r"\b(question|answer|reviewer|assessment|curriculum|learning|education)\b", ocr):
        return "notes_or_reference"
    return "unclear_text"


def answer_source_for(text, answer_key, qnum, answer):
    if answer_key.get(qnum):
        return "Correct answer sourced from detected answer key section."
    if answer:
        return "Correct answer embedded inline."
    if re.search(r"\b(answer key|answers:|correct answers|sagot)\b", text, re.I):
        return "Answer key exists in OCR text but this item was not matched confidently."
    return "No answer key or embedded answer was matched for this item."


def extract_image_file(path, source_root):
    width, height = image_dimensions(path)
    text = ocr_image(path)
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
        answer_source = (
            answer_note
            if answer_key.get(qnum, "")
            else ("Correct answer marked with an asterisk in the OCR choice." if starred_answer and answer == starred_answer else ("Correct answer embedded inline." if answer else ""))
        )
        subject = infer_subject_area(relative_path, question)
        topic = infer_topic(subject, question)
        visual_ref = f"question_image_{path.stem}_q{qnum}"
        notes = [
            exam_note,
            "Source is an image OCR pass; manually review the source image before upload if OCR confidence is not high.",
            answer_source_for(text, answer_key, qnum, answer),
        ]
        if VISUAL_CUE_RE.search(question):
            notes.append("Visual-reference language was detected in OCR text.")
        row = {
            "No.": "",
            "Original No.": str(qnum),
            "Page": "Image",
            "Source PDF": path.name,
            "Source Path": str(path),
            "Question": normalize_space(question),
            "Passage Reference": "",
            "Question Image Reference": visual_ref,
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
            "Has Image": "Yes",
            "Duplicate Of": "",
            "Confidence": "",
            "Status": "",
            "Notes": normalize_space(" ".join(notes)),
        }
        row["Status"] = status_for(row, 1)
        if row["Status"] == "Needs Image Extraction":
            row["Status"] = "Needs Review"
            row["Notes"] = normalize_space(row["Notes"] + " Image source is already identified, but OCR needs human review before upload.")
        row["Confidence"] = confidence_for(row, answer_source)
        rows.append(row)

    content_type = classify_image(path, text, len(rows))
    source = {
        "path": str(path),
        "status": "processed",
        "format": path.suffix.lower(),
        "width": width,
        "height": height,
        "ocr_chars": len(text),
        "rows": len(rows),
        "answer_keys_detected": len(answer_key),
        "likely_content_type": content_type,
        "ocr_preview": normalize_space(text)[:500],
    }
    return rows, source


def write_audit_markdown(path, summary, sources):
    lines = [
        "# Sept2026 LET Image OCR Audit",
        "",
        f"Images seen: {summary['total_images_seen']}",
        f"Question candidates: {summary['image_content_type_counts'].get('question_candidate', 0)}",
        f"TOS/table/reference images: {summary['image_content_type_counts'].get('tos_or_table', 0)}",
        f"No-text images: {summary['image_content_type_counts'].get('no_text', 0)}",
        "",
        "| File | Type | Size | OCR chars | Rows | Preview |",
        "| --- | --- | --- | ---: | ---: | --- |",
    ]
    for item in sources:
        preview = str(item.get("ocr_preview", "")).replace("|", "\\|")
        size = f"{item.get('width', 0)}x{item.get('height', 0)}"
        lines.append(
            f"| {Path(item['path']).name} | {item.get('likely_content_type', '')} | {size} | {item.get('ocr_chars', 0)} | {item.get('rows', 0)} | {preview} |"
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_summary(rows, sources, output_paths, input_dir, audit_path):
    status_counts = Counter(row["Status"] for row in rows)
    exam_counts = Counter(row["LET Exam Type"] for row in rows)
    subject_counts = Counter(row["Subject Area"] for row in rows)
    difficulty_counts = Counter(row["Difficulty"] for row in rows)
    content_counts = Counter(source.get("likely_content_type", "unknown") for source in sources)
    format_counts = Counter(source.get("format", "unknown") for source in sources)
    return {
        "input_dir": str(input_dir),
        "generated_at": "2026-06-25",
        "total_images_seen": len(sources),
        "format_counts": dict(format_counts),
        "image_content_type_counts": dict(content_counts),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(
            status_counts.get(status, 0)
            for status in ["Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"]
        ),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in rows if row["Has Image"] == "Yes"),
        "total_questions_with_image_based_answer_choices": 0,
        "total_elementary_questions": exam_counts.get("LET Elementary", 0),
        "total_secondary_questions": exam_counts.get("LET Secondary", 0),
        "total_both_or_cannot_determine_questions": exam_counts.get("Both", 0) + exam_counts.get("Cannot Determine", 0),
        "status_counts": dict(status_counts),
        "exam_type_counts": dict(exam_counts),
        "subject_category_breakdown": dict(subject_counts),
        "difficulty_breakdown": dict(difficulty_counts),
        "sources": sources,
        "outputs": {**output_paths, "audit_md": str(audit_path)},
        "recommended_next_action_before_uploading": (
            "Do not upload image OCR rows automatically unless manually reviewed against the original image. "
            "Most images in this folder are TOS/table/reference screenshots rather than ready multiple-choice questions."
        ),
    }


def main():
    parser = argparse.ArgumentParser(description="OCR-audit Sept2026 LET image files and extract review-only question candidates.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Folder containing LET reviewer images.")
    parser.add_argument("--output-base", default=BASE, help="Output filename base under output/pdf.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir}")

    files = sorted(path for path in input_dir.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)
    rows = []
    sources = []
    for path in files:
        try:
            extracted, source = extract_image_file(path, input_dir)
            rows.extend(extracted)
            sources.append(source)
            print(json.dumps({"processed": str(path), "rows": len(extracted), "type": source["likely_content_type"]}), flush=True)
        except Exception as exc:
            sources.append({"path": str(path), "status": "error", "rows": 0, "format": path.suffix.lower(), "error": str(exc)})
            print(json.dumps({"error": str(path), "message": str(exc)}), flush=True)

    for idx, row in enumerate(rows, 1):
        row["No."] = str(idx)
    mark_duplicates(rows)
    for row in rows:
        if row["Status"] not in STATUS_VALUES:
            row["Status"] = "Needs Review"
        if row["Status"] == "Ready for Upload":
            row["Status"] = "Needs Review"
            row["Notes"] = normalize_space(row["Notes"] + " Auto-upload blocked because source came from OCR image extraction.")

    output_paths = write_outputs(rows, {"pending": True}, args.output_base)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    audit_path = OUT_DIR / f"{args.output_base}_audit.md"
    summary = build_summary(rows, sources, output_paths, input_dir, audit_path)
    output_paths = write_outputs(rows, summary, args.output_base)
    summary["outputs"] = {**output_paths, "audit_md": str(audit_path)}
    (OUT_DIR / f"{args.output_base}_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    write_audit_markdown(audit_path, summary, sources)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
