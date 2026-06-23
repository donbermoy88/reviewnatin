#!/usr/bin/env python3
import csv
import json
import re
from collections import Counter
from pathlib import Path

from extract_let_elementary_secondary import (
    FIELDS,
    OUT_DIR,
    clean_text,
    joined_pages,
    normalize_key,
    normalize_space,
    page_for_offset,
    page_image_counts,
    parse_question_and_choices,
    set_status,
    split_numbered_blocks,
)


BASE = "let_reviewer_2026_batch2_extracted_questions"
PREVIOUS_JSON = OUT_DIR / "let_elementary_secondary_extracted_questions.json"

PDFS = [
    {
        "slug": "let_final_coaching_with_answer_key_prof_ed",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/1. FINAL COACHING WITH ANSWER KEY.pdf",
        "exam_type": "Both",
        "category": "Professional Education",
        "mode": "no_key",
        "max_q": 200,
        "note": "Professional Education final coaching set. The filename says with answer key, but no usable answer key was exposed in extracted PDF text.",
    },
    {
        "slug": "let_gen_ed_prof_ed_1000_hot_questions",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/3. GEN-ED_PROF_ED.pdf",
        "exam_type": "Both",
        "category": "General/Professional Education",
        "mode": "trailing_key",
        "key_marker": "ANSWER KEY",
        "max_q": 1000,
        "note": "Shared Gen Ed/Prof Ed set with trailing answer key.",
    },
    {
        "slug": "let_professional_education_preboard_a",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/2. LET DRILLS & BOOSTER (BEED-BSED)/Professional-Education-A.pdf",
        "exam_type": "Both",
        "category": "Professional Education",
        "mode": "no_key",
        "max_q": 100,
        "note": "Professional Education Preboard A. No usable answer key was exposed in extracted PDF text.",
    },
    {
        "slug": "let_updated_prof_ed_139",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/2025-2026 UPDATE (GEN ED AND PROF ED)/Updated Prof-Ed-139-items.pdf",
        "exam_type": "Both",
        "category": "Professional Education",
        "mode": "no_key",
        "max_q": 150,
        "note": "Shared Prof Ed 2025-2026 update. No usable answer key was exposed in extracted PDF text.",
    },
    {
        "slug": "let_part1_general_education_150_with_answers",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/GENERAL EDUCATION/Part 1 General Education 150 QUESTIONS With ANSWERS.pdf",
        "exam_type": "Both",
        "category": "General Education",
        "mode": "trailing_key",
        "key_marker": "Answer Key",
        "inline_numbering": True,
        "max_q": 150,
        "note": "Shared General Education Part 1 with trailing answer key.",
    },
    {
        "slug": "let_part3_general_education_100",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/GENERAL EDUCATION/PART 3 GENERAL EDUCATION (100 Items).pdf",
        "exam_type": "Both",
        "category": "General Education",
        "mode": "trailing_key",
        "key_marker": "Answer Keys",
        "inline_numbering": True,
        "max_q": 100,
        "note": "Shared General Education Part 3 with trailing answer key.",
    },
    {
        "slug": "let_part8_general_education_200",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/GENERAL EDUCATION/Part 8 General Education (200 Items).pdf",
        "exam_type": "Both",
        "category": "General Education",
        "mode": "trailing_key",
        "key_marker": "Part 8 General Education LET Reviewer",
        "inline_numbering": True,
        "max_q": 200,
        "note": "Shared General Education Part 8 with trailing answer key where exposed.",
    },
    {
        "slug": "let_filipino_65_with_rationalization",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/F. REVIEWERS WITH RATIONALE/1. FILIPINO LET 60 ITEMS WITH RATIONALIZATION.pdf",
        "exam_type": "Both",
        "category": "Filipino",
        "mode": "inline_letter_rationale",
        "max_q": 65,
        "note": "Filipino LET reviewer with correct letter and rationale immediately after each item.",
    },
    {
        "slug": "let_final_coaching_beed_bsed_marked_answers",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/G. FINAL COACHING (BEED-BSED)/1. FINAL COACHING.pdf",
        "exam_type": "Both",
        "category": "General/Professional Education",
        "mode": "marked_choice",
        "truncate_marker": "ANSWER KEY",
        "max_q": 300,
        "note": "BEED-BSED final coaching; correct answers are marked inline with bullet symbols where available.",
    },
]


def parse_answer_key_loose(text):
    answers = {}
    for qnum, value in re.findall(r"(?<!\d)(\d{1,4})\.?\s*(?:\|\s*)?(NO ANSWER|no answer|[A-Ea-e?–-])(?:\b|[\.\s|])", text):
        answers[int(qnum)] = "" if value.lower() == "no answer" or value in "?–-" else value.upper()
    return answers


def split_numbered_blocks_inline(text, max_q=None):
    markers = []
    pattern = re.compile(r"(?<!\d)(?:^|\s)(?:Question\s+)?(\d{1,4})[\.\)]\s*")
    expected = 1
    for match in pattern.finditer(text):
        qnum = int(match.group(1))
        if qnum == 0:
            continue
        if max_q and qnum > max_q:
            continue
        if qnum < expected:
            continue
        if qnum > expected + 3:
            continue
        markers.append((match.start(), qnum))
        expected = qnum + 1
        if max_q and expected > max_q:
            break
    blocks = []
    for idx, (start, qnum) in enumerate(markers):
        end = markers[idx + 1][0] if idx + 1 < len(markers) else len(text)
        blocks.append((qnum, start, text[start:end]))
    return blocks


def split_blocks(spec, text):
    if spec.get("inline_numbering") or spec["mode"] in {"trailing_key", "marked_choice", "no_key", "inline_letter_rationale"}:
        return split_numbered_blocks_inline(text, spec.get("max_q"))
    if spec.get("inline_numbering"):
        return split_numbered_blocks_inline(text, spec.get("max_q"))
    return split_numbered_blocks(text, spec.get("max_q"))


def make_row(spec, qnum, page, question, choices, answer, explanation, note):
    return {
        "source_slug": spec["slug"],
        "source_path": spec["path"],
        "source_question_no": qnum,
        "No.": "",
        "Page": page,
        "Source PDF": Path(spec["path"]).name,
        "Question": normalize_space(question),
        "Choice A": normalize_space(choices.get("A", "")),
        "Choice B": normalize_space(choices.get("B", "")),
        "Choice C": normalize_space(choices.get("C", "")),
        "Choice D": normalize_space(choices.get("D", "")),
        "Choice E if there is": normalize_space(choices.get("E", "")),
        "Correct Answer": answer,
        "Explanation": normalize_space(explanation),
        "Exam Type": spec["exam_type"],
        "Subject Category": spec["category"],
        "Difficulty": "Cannot Determine",
        "Has Image": "No",
        "Image Reference": "",
        "Status": "",
        "Notes": normalize_space(f"{spec['note']} {note}".strip()),
    }


def extract_trailing_key(spec):
    text, offsets, _ = joined_pages(Path(spec["path"]))
    idx = text.lower().find(spec["key_marker"].lower())
    if idx < 0:
        question_text = text
        answers = {}
        note = "Answer key marker not found in extracted PDF text."
    else:
        question_text = text[:idx]
        answers = parse_answer_key_loose(text[idx:])
        note = "Correct answer sourced from trailing answer key."
    rows = []
    for qnum, offset, block in split_blocks(spec, question_text):
        question, choices = parse_question_and_choices(block)
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, answers.get(qnum, ""), "", note))
    return rows


def extract_no_key(spec):
    text, offsets, _ = joined_pages(Path(spec["path"]))
    rows = []
    for qnum, offset, block in split_blocks(spec, text):
        question, choices = parse_question_and_choices(block)
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, "", "", "No answer key found in extracted PDF text."))
    return rows


def extract_inline_letter_rationale(spec):
    text, offsets, _ = joined_pages(Path(spec["path"]))
    rows = []
    for qnum, offset, block in split_blocks(spec, text):
        answer = ""
        explanation = ""
        m = re.search(r"(?m)^\s*([A-Ea-e])\s*[-–]\s*(.+?)(?=\n\s*\d{1,3}[\.\)]|\Z)", block, re.S)
        qblock = block
        if m:
            answer = m.group(1).upper()
            explanation = clean_text(m.group(2))
            qblock = block[: m.start()]
        question, choices = parse_question_and_choices(qblock)
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, answer, explanation, "Correct answer and rationale are embedded after the item." if answer else "No embedded answer found."))
    return rows


def extract_marked_choice(spec):
    text, offsets, _ = joined_pages(Path(spec["path"]))
    if spec.get("truncate_marker"):
        idx = text.lower().find(spec["truncate_marker"].lower())
        if idx >= 0:
            text = text[:idx]
    rows = []
    for qnum, offset, block in split_blocks(spec, text):
        question, choices = parse_question_and_choices(block)
        answer = ""
        for letter, value in list(choices.items()):
            if re.search(r"[•●]{2,}|\*{2,}", value):
                answer = letter
                choices[letter] = normalize_space(re.sub(r"[•●*]+", "", value))
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, answer, "", "Correct choice is marked inline in the PDF." if answer else "No inline correct-choice marker found."))
    return rows


def previous_question_keys():
    if not PREVIOUS_JSON.exists():
        return set()
    rows = json.loads(PREVIOUS_JSON.read_text(encoding="utf-8"))
    return {normalize_key(row.get("Question", "")) for row in rows if row.get("Question")}


def mark_duplicates(rows):
    previous = previous_question_keys()
    seen = {}
    for row in rows:
        key = normalize_key(row["Question"])
        if not key:
            continue
        if key in previous:
            row["Status"] = "Duplicate"
            row["Notes"] = normalize_space(row["Notes"] + " Duplicate or near-duplicate of the earlier LET extraction batch.")
            continue
        if key in seen:
            row["Status"] = "Duplicate"
            row["Notes"] = normalize_space(row["Notes"] + f" Duplicate or near-duplicate of row {seen[key]['No.']}.")
        else:
            seen[key] = row


def write_outputs(rows, summary):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUT_DIR / f"{BASE}.csv"
    json_path = OUT_DIR / f"{BASE}.json"
    md_path = OUT_DIR / f"{BASE}.md"
    summary_path = OUT_DIR / f"{BASE}_summary.json"

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    clean_rows = [
        {field: row.get(field, "") for field in FIELDS}
        | {"source_slug": row["source_slug"], "source_question_no": row["source_question_no"], "source_path": row["source_path"]}
        for row in rows
    ]
    json_path.write_text(json.dumps(clean_rows, indent=2, ensure_ascii=False), encoding="utf-8")
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    def esc(value):
        return str(value or "").replace("|", "\\|").replace("\n", "<br>")

    lines = ["| " + " | ".join(FIELDS) + " |", "| " + " | ".join(["---"] * len(FIELDS)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    rows = []
    sources = []
    for spec in PDFS:
        path = Path(spec["path"])
        if not path.exists():
            sources.append({"slug": spec["slug"], "status": "missing", "path": spec["path"]})
            continue
        if spec["mode"] == "trailing_key":
            extracted = extract_trailing_key(spec)
        elif spec["mode"] == "inline_letter_rationale":
            extracted = extract_inline_letter_rationale(spec)
        elif spec["mode"] == "marked_choice":
            extracted = extract_marked_choice(spec)
        else:
            extracted = extract_no_key(spec)
        rows.extend(extracted)
        sources.append({"slug": spec["slug"], "status": "processed", "rows": len(extracted), "path": spec["path"]})

    image_cache = {}
    for row in rows:
        if row["source_path"] not in image_cache:
            image_cache[row["source_path"]] = page_image_counts(Path(row["source_path"]))
        if image_cache[row["source_path"]].get(int(row["Page"] or 0), 0) > 0:
            row["Has Image"] = "Yes"
            row["Notes"] = normalize_space(row["Notes"] + " Page contains embedded image(s); crop reference not extracted in this pass.")

    for idx, row in enumerate(rows, 1):
        row["No."] = idx
        set_status(row)
        if row["Has Image"] == "Yes" and row["Status"] == "Ready for Upload":
            row["Status"] = "Needs Review"
    mark_duplicates(rows)

    status_counts = Counter(row["Status"] for row in rows)
    summary = {
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": status_counts.get("Needs Review", 0) + status_counts.get("Incomplete", 0),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in rows if row["Has Image"] == "Yes"),
        "status_counts": dict(status_counts),
        "exam_type_counts": dict(Counter(row["Exam Type"] for row in rows)),
        "source_counts": dict(Counter(row["source_slug"] for row in rows)),
        "sources": sources,
        "suggested_supabase_mapping": {
            "Question": "questions.stem",
            "Choice A-D/E": "questions.choices JSONB",
            "Correct Answer": "questions.correct_choice_id",
            "Explanation": "questions.explanation",
            "Exam Type": "exam_types.slug/name (let-elementary, let-secondary; Both should target both exams)",
            "Subject Category": "subject_areas/topics mapping",
            "Source PDF/Page/Notes": "questions.source_note",
            "Status": "questions.status or import staging status",
        },
        "recommended_next_action": "Review Needs Answer, Needs Review, and Incomplete rows before uploading. Upload Ready for Upload rows only after topic mapping is confirmed.",
    }
    write_outputs(rows, summary)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
