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
    set_status,
    split_numbered_blocks,
)


BASE = "let_reviewer_2026_batch3_extracted_questions"
PREVIOUS_JSONS = [
    OUT_DIR / "let_elementary_secondary_extracted_questions.json",
    OUT_DIR / "let_reviewer_2026_batch2_extracted_questions.json",
]

PDFS = [
    {
        "slug": "let_english_proficiency_test_20_elementary",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/A. GENERAL EDUCATION/1. ENGLISH/07. ENGLISH PROFICIENCY TEST 20 ITEMS.pdf",
        "exam_type": "LET Elementary",
        "category": "English",
        "mode": "trailing_key",
        "key_marker": "Answer Key:",
        "max_q": 20,
        "note": "English proficiency test explicitly labeled Elementary Level; answer key appears at the end.",
    },
    {
        "slug": "let_general_education_english_practice_30",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/A. GENERAL EDUCATION/1. ENGLISH/11. GENERAL EDUCATION- ENGLISH PRACTICE TEST WITH ANSWER KEY.pdf",
        "exam_type": "Both",
        "category": "English",
        "mode": "trailing_key",
        "key_marker": "Answers:",
        "max_q": 30,
        "note": "General Education English practice test; answer key appears at the end.",
    },
    {
        "slug": "let_gen_ed_reviewer_50_inline_answers",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/A. GENERAL EDUCATION/3. GENERAL EDUCATION/G. Others/1. GEN. ED REVIEWER 50 ITEMS.pdf",
        "exam_type": "Both",
        "category": "General Education",
        "mode": "inline_ans",
        "max_q": 50,
        "note": "General Education 50-item reviewer; answers are embedded after each question as Ans: X.",
    },
    {
        "slug": "let_gen_ed_reviewer_100_with_answer_key",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/A. GENERAL EDUCATION/3. GENERAL EDUCATION/G. Others/2. GEN. ED. REVIEWER 100 ITEMS WITH ANSWER KEY.pdf",
        "exam_type": "Both",
        "category": "English",
        "mode": "trailing_key",
        "key_marker": "ANSWER KEY",
        "max_q": 100,
        "note": "General Education 100-item English/language reviewer; answer key appears at the end.",
    },
    {
        "slug": "let_general_science_100_with_answer_key",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/A. GENERAL EDUCATION/4. GENERAL SCIENCE/GEN. SCIENCE DRILLS II/GENERAL SCIENCE 100 ITEMS.pdf",
        "exam_type": "Both",
        "category": "General Science",
        "mode": "trailing_key",
        "key_marker": "***** THE END *****",
        "max_q": 100,
        "note": "General Science 100-item drill; answer key appears at the end.",
    },
    {
        "slug": "let_professional_education_150_inline_answers",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/B. PROFESSIONAL EDUCATION/PROF ED DRILLS & NOTES/22. PROFESIONAL-EDUCATION-150-ITEMS-WITH-ANSWERS-KEY.pdf",
        "exam_type": "Both",
        "category": "Professional Education",
        "mode": "inline_ans",
        "max_q": 150,
        "note": "Professional Education 150-question reviewer; answers are embedded after each question as Ans: X.",
    },
]

SOURCE_BACKED_REPAIRS = {
    ("GENERAL SCIENCE 100 ITEMS.pdf", 58): {
        "Choice A": "rotor",
        "Choice B": "generator",
        "Choice C": "motor",
        "Choice D": "circuit",
        "Notes": "Repaired compressed option markers from raw PDF text: 'a. rotor b. generatorc. motor d. circuit'.",
    },
    ("GENERAL SCIENCE 100 ITEMS.pdf", 90): {
        "Choice A": "increase in volume",
        "Choice B": "decrease in volume",
        "Choice C": "repel each other",
        "Choice D": "attract and liquefy",
        "Notes": "Repaired compressed option marker from raw PDF text: 'd.attract and liquefy'.",
    },
}


OPTION_RE = re.compile(r"(?<![A-Za-z0-9.])(?:\(([A-Ea-e])\)|([A-Ea-e])[\.\)]\s+)")


def parse_question_and_choices(block):
    block = clean_text(block)
    block = re.sub(r"^(?:Question\s+)?\d{1,3}[\.\)]\s*", "", block, flags=re.I).strip()
    text = normalize_space(block)
    markers = []
    for match in OPTION_RE.finditer(text):
        letter = (match.group(1) or match.group(2) or "").upper()
        if letter in "ABCDE":
            markers.append((match.start(), match.end(), letter))
    if not markers:
        lines = [normalize_space(line) for line in block.splitlines() if normalize_space(line)]
        if len(lines) >= 5:
            lines[0] = re.sub(r"^(?:Question\s+)?\d{1,3}[\.\)]\s*", "", lines[0], flags=re.I).strip()
            question_end = None
            for idx, line in enumerate(lines[:-4]):
                if line.endswith("?"):
                    question_end = idx + 1
                    break
            if question_end is None:
                question_end = len(lines) - 4
            choices_raw = lines[question_end : question_end + 4]
            if len(choices_raw) == 4:
                return normalize_space(" ".join(lines[:question_end])), dict(zip("ABCD", choices_raw))
        return text, {}
    question = normalize_space(text[: markers[0][0]])
    choices = {}
    for idx, (_, end, letter) in enumerate(markers):
        next_start = markers[idx + 1][0] if idx + 1 < len(markers) else len(text)
        value = normalize_space(text[end:next_start])
        value = re.sub(r"\b(?:Ans|Answer)\s*:.*$", "", value, flags=re.I).strip()
        choices[letter] = value
    return question, choices


def parse_answer_key(text):
    answers = {}
    for qnum, letter in re.findall(r"(?<!\d)(\d{1,3})\s*[\.\)]?\s*([A-Ea-e])(?:\b|[\s\.])", text):
        answers[int(qnum)] = letter.upper()
    return answers


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
    idx = text.lower().rfind(spec["key_marker"].lower())
    if idx < 0:
        question_text = text
        answers = {}
        note = "Answer key marker not found in extracted PDF text."
    else:
        question_text = text[:idx]
        answers = parse_answer_key(text[idx:])
        note = "Correct answer sourced from trailing answer key."
    rows = []
    for qnum, offset, block in split_numbered_blocks(question_text, spec.get("max_q")):
        question, choices = parse_question_and_choices(block)
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, answers.get(qnum, ""), "", note))
    return rows


def extract_inline_ans(spec):
    text, offsets, _ = joined_pages(Path(spec["path"]))
    rows = []
    for qnum, offset, block in split_numbered_blocks(text, spec.get("max_q")):
        answer = ""
        m = re.search(r"\bAns\s*:\s*([A-Ea-e])\b", block)
        qblock = block
        if m:
            answer = m.group(1).upper()
            qblock = block[: m.start()]
        question, choices = parse_question_and_choices(qblock)
        note = "Correct answer is embedded after the question." if answer else "No embedded answer found."
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, answer, "", note))
    return rows


def previous_question_keys():
    keys = set()
    for path in PREVIOUS_JSONS:
        if not path.exists():
            continue
        rows = json.loads(path.read_text(encoding="utf-8"))
        keys.update(normalize_key(row.get("Question", "")) for row in rows if row.get("Question"))
    return keys


def mark_duplicates(rows):
    previous = previous_question_keys()
    seen = {}
    for row in rows:
        key = normalize_key(row.get("Question", ""))
        if not key:
            continue
        if key in previous:
            row["Status"] = "Duplicate"
            row["Notes"] = normalize_space(row["Notes"] + " Duplicate or near-duplicate of an earlier LET extraction batch.")
        elif key in seen:
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
        if spec["mode"] == "inline_ans":
            extracted = extract_inline_ans(spec)
        else:
            extracted = extract_trailing_key(spec)
        rows.extend(extracted)
        sources.append({"slug": spec["slug"], "status": "processed", "rows": len(extracted), "path": spec["path"]})

    for idx, row in enumerate(rows, 1):
        row["No."] = idx
        repair = SOURCE_BACKED_REPAIRS.get((row["Source PDF"], row["source_question_no"]))
        if repair:
            for key, value in repair.items():
                if key == "Notes":
                    row["Notes"] = normalize_space(row["Notes"] + " " + value)
                else:
                    row[key] = normalize_space(value)
        set_status(row)
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
        "image_extraction_note": "No visually verified question/answer figures were found in this batch. Page-sized scan/background images and decorative repeated page images were not attached as question assets.",
        "suggested_supabase_mapping": {
            "Question": "questions.stem",
            "Choice A-D/E": "questions.choices JSONB",
            "Correct Answer": "questions.correct_choice_id",
            "Explanation": "questions.explanation",
            "Exam Type": "exam_types.slug/name (let-elementary, let-secondary; Both should target both exams)",
            "Subject Category": "subject_areas/topics mapping",
            "Source PDF/Page/Notes": "questions.source_note",
            "Status": "questions.status or import staging status",
            "Image Reference": "question_assets.storage_path or question_media.url when Has Image is Yes",
        },
        "recommended_next_action": "Upload Ready for Upload rows after duplicate review; keep Needs Answer/Incomplete out of production until manually checked.",
    }
    write_outputs(rows, summary)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
