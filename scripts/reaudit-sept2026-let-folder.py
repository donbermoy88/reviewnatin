#!/usr/bin/env python3
import hashlib
import argparse
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

from extract_sept2026_let_reviewers import (
    DEFAULT_INPUT,
    FIELDS,
    OUT_DIR,
    VISUAL_CUE_RE,
    clean_page_text,
    confidence_for,
    detect_passage,
    infer_exam_type,
    infer_subject_area,
    infer_topic,
    make_image_reference,
    normalize_key,
    normalize_space,
    page_for_offset,
    page_image_counts,
    page_offsets,
    parse_answer_key,
    pdf_page_count,
    split_numbered_blocks,
    split_question_and_choices,
    source_relative_path,
    status_for,
    write_outputs,
)


BASE = "sept2026_let_extracted_questions"
ROOT = Path(__file__).resolve().parents[1]
OCR_DIR = ROOT / "tmp/pdfs/sept2026_let_ocr"
AUDIT_REPORT = OUT_DIR / "sept2026_let_folder_reaudit_report.json"


def run(args, allow_fail=False):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode and not allow_fail:
        raise RuntimeError(f"Command failed: {' '.join(map(str, args))}\n{result.stderr}")
    return result.stdout


def page_range_for_offsets(offsets, start, end):
    first = page_for_offset(offsets, start)
    last = page_for_offset(offsets, max(start, end - 1))
    return str(first) if first == last else f"{first}-{last}"


def file_counts(input_dir):
    counts = Counter()
    for path in input_dir.rglob("*"):
        if path.is_file():
            counts[path.suffix.lower() or "<none>"] += 1
    return dict(sorted(counts.items()))


def ocr_cache_dir(path):
    digest = hashlib.sha1(str(path).encode("utf-8")).hexdigest()[:16]
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", path.stem)[:80]
    return OCR_DIR / f"{safe}-{digest}"


def ocr_page(path, page_no):
    cache_dir = ocr_cache_dir(path)
    cache_dir.mkdir(parents=True, exist_ok=True)
    txt = cache_dir / f"page-{page_no:04d}.txt"
    if txt.exists():
        return txt.read_text(encoding="utf-8", errors="ignore")

    prefix = cache_dir / f"page-{page_no:04d}"
    run(["pdftoppm", "-r", "220", "-png", "-f", str(page_no), "-l", str(page_no), str(path), str(prefix)])
    pngs = sorted(cache_dir.glob(f"page-{page_no:04d}-*.png"))
    if not pngs:
        return ""
    text = run(["tesseract", str(pngs[0]), "stdout", "--psm", "6"], allow_fail=True)
    txt.write_text(text, encoding="utf-8")
    for png in pngs:
        png.unlink(missing_ok=True)
    return text


def ocr_pdf_pages(path):
    page_count = pdf_page_count(path)
    pages = []
    for page_no in range(1, page_count + 1):
        pages.append(clean_page_text(ocr_page(path, page_no)))
    return pages


def extract_ocr_pdf(path, source_root, existing_questions, start_no):
    pages = ocr_pdf_pages(path)
    if not pages:
        return [], {"path": str(path), "status": "no_pages", "rows": 0, "pages": 0, "method": "ocr"}

    text, offsets = page_offsets(pages)
    answer_key, answer_note, answer_key_idx = parse_answer_key(text)
    question_text = text[:answer_key_idx] if answer_key_idx >= 0 and len(answer_key) >= 3 else text
    page_images = page_image_counts(path, len(pages))
    relative_path = source_relative_path(path, source_root)
    exam_type, exam_note = infer_exam_type(relative_path)
    rows = []
    next_no = start_no

    for qnum, start, _, end, block in split_numbered_blocks(question_text):
        question, choices = split_question_and_choices(block)
        if not question and not choices:
            continue

        page = page_range_for_offsets(offsets, start, end)
        answer = answer_key.get(qnum, "")
        answer_source = answer_note if answer else ""
        subject = infer_subject_area(relative_path, question)
        topic = infer_topic(subject, question)
        passage_ref = detect_passage(question, qnum, page)
        first_page = int(str(page).split("-")[0])
        image_count = page_images.get(first_page, 0)
        question_image_ref = ""
        has_image = "No"
        notes = [exam_note, "Text extracted by OCR from scanned PDF; reviewer spot-check recommended."]

        if answer_source:
            notes.append(answer_source)
        elif "answer" in text.lower() or "key" in text.lower():
            notes.append("OCR text contains answer-key language, but this item was not matched confidently.")
        else:
            notes.append("No answer key or embedded answer was matched for this OCR item.")

        if image_count > 0 and VISUAL_CUE_RE.search(question):
            question_image_ref = make_image_reference(page, qnum)
            has_image = "Yes"
            notes.append("Scanned source page has visual-reference language; crop must be reviewed/extracted manually.")

        row = {
            "No.": str(next_no),
            "Original No.": str(qnum),
            "Page": page,
            "Source PDF": path.name,
            "Source Path": str(path),
            "Question": normalize_space(question),
            "Passage Reference": passage_ref,
            "Question Image Reference": question_image_ref,
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
            "Has Image": has_image,
            "Duplicate Of": "",
            "Confidence": "",
            "Status": "",
            "Notes": normalize_space(" ".join(notes)),
        }

        existing_no = existing_questions.get(normalize_key(row["Question"]))
        if existing_no:
            row["Duplicate Of"] = existing_no
            row["Status"] = "Duplicate"
            row["Notes"] = normalize_space(row["Notes"] + f" Duplicate or near-duplicate of row {existing_no}.")
        else:
            row["Status"] = status_for(row, image_count)
            if row["Status"] == "Ready for Upload":
                row["Status"] = "Needs Review"
                row["Confidence"] = "0.70"
                row["Notes"] = normalize_space(
                    row["Notes"]
                    + " OCR answer-key alignment and choice text must be manually verified before upload."
                )
            existing_questions[normalize_key(row["Question"])] = row["No."]

        if not row["Confidence"]:
            row["Confidence"] = confidence_for(row, answer_source)
        rows.append(row)
        next_no += 1

    return rows, {
        "path": str(path),
        "status": "processed" if rows else "no_questions_found_after_ocr",
        "rows": len(rows),
        "pages": len(pages),
        "method": "ocr",
        "answer_keys_detected": len(answer_key),
    }


def build_summary(rows, sources, output_paths, input_dir, audit):
    status_counts = Counter(row["Status"] for row in rows)
    exam_counts = Counter(row["LET Exam Type"] for row in rows)
    subject_counts = Counter(row["Subject Area"] for row in rows)
    difficulty_counts = Counter(row["Difficulty"] for row in rows)
    source_counts = Counter(row["Source PDF"] for row in rows)
    return {
        "input_dir": str(input_dir),
        "generated_at": "2026-06-23",
        "total_pdfs_seen": sum(1 for source in sources if str(source.get("path", "")).lower().endswith(".pdf")),
        "total_pdfs_processed": sum(1 for source in sources if source.get("status") == "processed"),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(status_counts.get(status, 0) for status in ["Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"]),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in rows if row["Has Image"] == "Yes"),
        "total_questions_with_image_based_answer_choices": sum(
            1 for row in rows if any(row.get(f"Choice {letter} Image Reference") for letter in "ABCDE")
        ),
        "total_elementary_questions": exam_counts.get("LET Elementary", 0),
        "total_secondary_questions": exam_counts.get("LET Secondary", 0),
        "total_both_or_cannot_determine_questions": exam_counts.get("Both", 0) + exam_counts.get("Cannot Determine", 0),
        "status_counts": dict(status_counts),
        "exam_type_counts": dict(exam_counts),
        "subject_category_breakdown": dict(subject_counts),
        "difficulty_breakdown": dict(difficulty_counts),
        "source_counts_top_50": dict(source_counts.most_common(50)),
        "batches": [],
        "sources": sources,
        "outputs": output_paths,
        "folder_reaudit": audit,
        "suggested_supabase_table_mapping": {
            "exam_type": "LET Exam Type",
            "exam_level": "LET Exam Type",
            "subject_area": "Subject Area",
            "topic": "Topic",
            "question_text": "Question",
            "passage_text": "Passage Reference (resolve/review manually when populated)",
            "question_image_url": "Question Image Reference",
            "choice_a_text": "Choice A",
            "choice_a_image_url": "Choice A Image Reference",
            "choice_b_text": "Choice B",
            "choice_b_image_url": "Choice B Image Reference",
            "choice_c_text": "Choice C",
            "choice_c_image_url": "Choice C Image Reference",
            "choice_d_text": "Choice D",
            "choice_d_image_url": "Choice D Image Reference",
            "choice_e_text": "Choice E",
            "choice_e_image_url": "Choice E Image Reference",
            "correct_answer": "Correct Answer",
            "explanation": "Explanation",
            "difficulty": "Difficulty",
            "source_pdf": "Source PDF",
            "source_page": "Page",
            "original_question_number": "Original No.",
            "duplicate_of": "Duplicate Of",
            "confidence_score": "Confidence",
            "status": "Status",
            "notes": "Notes",
        },
        "recommended_next_action_before_uploading": (
            "Upload only Ready for Upload rows. Non-PDF reviewer files remain outside the original PDF extraction scope "
            "and should be parsed by a separate DOC/DOCX/PPT extraction pass before import."
        ),
    }


def main():
    parser = argparse.ArgumentParser(description="Reaudit Sept 2026 LET extraction and OCR PDFs with no extracted rows.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Folder containing LET reviewer PDFs.")
    parser.add_argument("--output-base", default=BASE, help="Existing output filename base under output/pdf.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    output_base = args.output_base
    rows_path = OUT_DIR / f"{output_base}.json"
    summary_path = OUT_DIR / f"{output_base}_summary.json"
    audit_report = OUT_DIR / f"{output_base}_reaudit_report.json"
    loaded_rows = json.loads(rows_path.read_text(encoding="utf-8"))
    rows = [row for row in loaded_rows if "Text extracted by OCR" not in row.get("Notes", "")]
    previous_summary = json.loads(summary_path.read_text(encoding="utf-8"))
    sources_by_path = {source["path"]: source for source in previous_summary.get("sources", [])}

    all_pdfs = sorted(path for path in input_dir.rglob("*.pdf") if path.is_file())
    row_sources = {row.get("Source Path") for row in rows if row.get("Source Path")}
    missing_pdfs = [path for path in all_pdfs if str(path) not in row_sources]
    existing_questions = {
        normalize_key(row["Question"]): row["No."]
        for row in rows
        if row.get("Question") and row.get("Status") != "Duplicate"
    }

    appended = []
    ocr_sources = []
    next_no = max(int(row["No."]) for row in rows if str(row.get("No.", "")).isdigit()) + 1
    for path in missing_pdfs:
        extracted, source = extract_ocr_pdf(path, input_dir, existing_questions, next_no)
        appended.extend(extracted)
        rows.extend(extracted)
        next_no += len(extracted)
        source["previous_status"] = sources_by_path.get(str(path), {}).get("status")
        sources_by_path[str(path)] = source
        ocr_sources.append(source)
        print(json.dumps({"ocr_processed": str(path), "rows": len(extracted), "pages": source.get("pages", 0)}), flush=True)

    sources = [sources_by_path.get(str(path), {"path": str(path), "status": "not_processed", "rows": 0, "pages": 0}) for path in all_pdfs]
    audit = {
        "file_counts": file_counts(input_dir),
        "pdfs_total": len(all_pdfs),
        "pdfs_with_existing_rows_before_ocr": len(row_sources),
        "pdfs_ocr_attempted": len(missing_pdfs),
        "ocr_rows_appended": len(appended),
        "ocr_ready_for_upload": sum(1 for row in appended if row["Status"] == "Ready for Upload"),
        "ocr_needs_answer": sum(1 for row in appended if row["Status"] == "Needs Answer"),
        "ocr_needs_review_or_incomplete": sum(
            1 for row in appended if row["Status"] in {"Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"}
        ),
        "ocr_duplicates": sum(1 for row in appended if row["Status"] == "Duplicate"),
        "ocr_sources": ocr_sources,
        "non_pdf_files_not_imported": sum(
            count for ext, count in file_counts(input_dir).items() if ext not in {".pdf"}
        ),
    }

    output_paths = write_outputs(rows, {"pending": True}, output_base)
    summary = build_summary(rows, sources, output_paths, input_dir, audit)
    output_paths = write_outputs(rows, summary, output_base)
    summary["outputs"] = output_paths
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    audit_report.write_text(json.dumps(audit, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(audit, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
