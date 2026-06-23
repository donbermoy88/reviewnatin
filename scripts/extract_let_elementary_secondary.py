#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/pdf"
TMP_DIR = ROOT / "tmp/pdfs/let_extraction"
BASE = "let_elementary_secondary_extracted_questions"

FIELDS = [
    "No.",
    "Page",
    "Source PDF",
    "Question",
    "Choice A",
    "Choice B",
    "Choice C",
    "Choice D",
    "Choice E if there is",
    "Correct Answer",
    "Explanation",
    "Exam Type",
    "Subject Category",
    "Difficulty",
    "Has Image",
    "Image Reference",
    "Status",
    "Notes",
]

PDFS = [
    {
        "slug": "let_general_education_qa_with_answer_keys",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/5. LET GENERAL EDUCATION Q&A WITH ANSWER KEYS.pdf",
        "exam_type": "Both",
        "category": "General Education",
        "mode": "trailing_key",
        "key_marker": "MULTIPLE CHOICE:",
        "max_q": 150,
        "note": "Shared Gen Ed LET reviewer; answer key appears at the end of the PDF.",
    },
    {
        "slug": "let_professional_education_qa",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/6. LET PROF ED Q&A.pdf",
        "exam_type": "Both",
        "category": "Professional Education",
        "mode": "no_key",
        "max_q": 197,
        "note": "Shared Prof Ed LET reviewer; no answer key was exposed in extracted PDF text.",
    },
    {
        "slug": "let_gen_ed_and_prof_ed_embedded_answers",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/2. GEN ED AND PROF ED.pdf",
        "exam_type": "Both",
        "category": "General/Professional Education",
        "mode": "embedded_answer",
        "note": "Shared Gen Ed and Prof Ed compilation; answers are embedded as Answer: X after questions where available.",
    },
    {
        "slug": "let_updated_gen_ed_150",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/2025-2026 UPDATE (GEN ED AND PROF ED)/Updated Gen-Ed-150-items.pdf",
        "exam_type": "Both",
        "category": "General Education",
        "mode": "trailing_key",
        "key_marker": "Answer Key",
        "max_q": 150,
        "note": "Shared Gen Ed 2023/2025-2026 update; answer key appears at the end of the PDF.",
    },
    {
        "slug": "let_updated_prof_ed_150",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/2025-2026 UPDATE (GEN ED AND PROF ED)/Updated Prof-Ed-150-items.pdf",
        "exam_type": "Both",
        "category": "Professional Education",
        "mode": "trailing_key",
        "key_marker": "ANSWER KEY",
        "max_q": 150,
        "note": "Shared Prof Ed 2023/2025-2026 update; answer key appears at the end of the PDF.",
    },
    {
        "slug": "let_prof_ed_child_adolescent_development_50",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/2025-2026 UPDATE (GEN ED AND PROF ED)/Updated Prof-Ed-child-and-adolescent-development 50-items.pdf",
        "exam_type": "Both",
        "category": "Child and Adolescent Development",
        "mode": "trailing_key",
        "key_marker": "Answer key",
        "max_q": 50,
        "note": "Shared Prof Ed specialized set; answer key appears at the end of the PDF.",
    },
    {
        "slug": "let_prof_ed_facilitating_learning_50",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/2025-2026 UPDATE (GEN ED AND PROF ED)/Updated Prof-Ed-Facilitating-Learning-50-items.pdf",
        "exam_type": "Both",
        "category": "Facilitating Learning",
        "mode": "trailing_key",
        "key_marker": "Answer key",
        "max_q": 50,
        "note": "Shared Prof Ed specialized set; answer key appears at the end of the PDF.",
    },
    {
        "slug": "let_secondary_gen_ed_with_explanation",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/J. Other References 21-22/05. GEN ED WITH EXPLANATION (SECONDARY).pdf",
        "exam_type": "LET Secondary",
        "category": "General Education",
        "mode": "secondary_explanation_pages",
        "max_q": 150,
        "note": "PDF explicitly labels this set as Secondary; explanations follow each question page.",
    },
    {
        "slug": "let_beed_200_items_with_answer_key",
        "path": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/B. PROFESSIONAL EDUCATION/PROF ED DRILLS & NOTES/16. 200-ITEMS-BEED-WITH-ANSWER-KEY.pdf",
        "exam_type": "LET Elementary",
        "category": "General Education",
        "mode": "no_key",
        "max_q": 200,
        "note": "PDF filename identifies BEED; no separate answer key was exposed in extracted PDF text.",
    },
]


def sh(args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def normalize_space(value):
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_key(value):
    return re.sub(r"[^a-z0-9]+", "", normalize_space(value).lower())


def clean_text(value):
    value = (value or "").replace("\x0c", "\n")
    value = re.sub(r"(?m)^\s*Page\s+\d+\s*(?:of\s+\d+)?\s*$", "", value)
    value = re.sub(r"(?m)^\s*\d+\s*$", "", value)
    return value.strip()


def pdftotext_raw(path, first=None, last=None):
    args = ["pdftotext", "-raw"]
    if first is not None:
        args.extend(["-f", str(first)])
    if last is not None:
        args.extend(["-l", str(last)])
    args.extend([str(path), "-"])
    return clean_text(sh(args))


def pdf_page_count(path):
    info = sh(["pdfinfo", str(path)])
    m = re.search(r"^Pages:\s+(\d+)", info, re.M)
    return int(m.group(1)) if m else 0


def read_pages(path):
    pages = []
    for page in range(1, pdf_page_count(path) + 1):
        pages.append(pdftotext_raw(path, page, page))
    return pages


def page_for_offset(page_offsets, offset):
    page = 1
    for idx, start in enumerate(page_offsets, 1):
        if start <= offset:
            page = idx
        else:
            break
    return page


def joined_pages(path):
    pages = read_pages(path)
    offsets = []
    chunks = []
    cursor = 0
    for page in pages:
        offsets.append(cursor)
        chunks.append(page)
        cursor += len(page) + 2
    return "\n\n".join(chunks), offsets, pages


def page_image_counts(path):
    counts = {}
    with pdfplumber.open(str(path)) as pdf:
        for idx, page in enumerate(pdf.pages, 1):
            counts[idx] = len(page.images)
    return counts


OPTION_RE = re.compile(r"(?<![A-Za-z0-9])([A-Ea-e])[\.\)]\s*")


def parse_question_and_choices(block):
    block = clean_text(block)
    block = re.sub(r"^(?:Question\s+)?\d{1,3}[\.\)]\s*", "", block, flags=re.I).strip()
    block = re.sub(r"\n+", "\n", block)
    text = normalize_space(block)
    markers = [(m.start(), m.end(), m.group(1).upper()) for m in OPTION_RE.finditer(text)]
    markers = [(start, end, letter) for start, end, letter in markers if letter in "ABCDE"]
    if not markers:
        return normalize_space(text), {}
    question = normalize_space(text[: markers[0][0]])
    choices = {}
    for idx, (_, end, letter) in enumerate(markers):
        next_start = markers[idx + 1][0] if idx + 1 < len(markers) else len(text)
        value = normalize_space(text[end:next_start])
        value = re.sub(r"\bAnswer\s*:.*$", "", value, flags=re.I).strip()
        choices[letter] = value
    return question, choices


def split_numbered_blocks(text, max_q=None):
    markers = []
    pattern = re.compile(r"(?m)^\s*(?:Question\s+)?(\d{1,3})[\.\)]\s*")
    for match in pattern.finditer(text):
        qnum = int(match.group(1))
        if qnum == 0:
            continue
        if max_q and qnum > max_q:
            continue
        markers.append((match.start(), qnum))
    blocks = []
    for idx, (start, qnum) in enumerate(markers):
        end = markers[idx + 1][0] if idx + 1 < len(markers) else len(text)
        blocks.append((qnum, start, text[start:end]))
    return blocks


def parse_answer_key(text):
    answers = {}
    for qnum, letter in re.findall(r"(?<!\d)(\d{1,3})\.\s*([A-Ea-e])(?:\b|[\.\)])", text):
        answers[int(qnum)] = letter.upper()
    return answers


def truncate_to_key(text, key_marker):
    idx = text.lower().find(key_marker.lower())
    if idx < 0:
        return text, "", "Answer key marker not found."
    return text[:idx], text[idx:], ""


def extract_trailing_key(spec):
    path = Path(spec["path"])
    text, offsets, _ = joined_pages(path)
    q_text, key_text, key_note = truncate_to_key(text, spec["key_marker"])
    answers = parse_answer_key(key_text)
    rows = []
    for qnum, offset, block in split_numbered_blocks(q_text, spec.get("max_q")):
        question, choices = parse_question_and_choices(block)
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, answers.get(qnum, ""), "", key_note))
    return rows


def extract_no_key(spec):
    path = Path(spec["path"])
    text, offsets, _ = joined_pages(path)
    rows = []
    for qnum, offset, block in split_numbered_blocks(text, spec.get("max_q")):
        question, choices = parse_question_and_choices(block)
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, "", "", "No answer key found in extracted PDF text."))
    return rows


def extract_embedded_answer(spec):
    path = Path(spec["path"])
    text, offsets, _ = joined_pages(path)
    rows = []
    for qnum, offset, block in split_numbered_blocks(text):
        m = re.search(r"\bAnswer\s*:\s*([A-Ea-e])\b", block)
        if not m:
            continue
        before = block[: m.start()]
        after = block[m.end() :]
        explanation = ""
        next_answer_note = re.search(r"- See more at:|SEE ALSO:|Below is the LET Reviewer", after, re.I)
        if next_answer_note:
            after = after[: next_answer_note.start()]
        answer = m.group(1).upper()
        question, choices = parse_question_and_choices(before)
        rows.append(make_row(spec, qnum, page_for_offset(offsets, offset), question, choices, answer, explanation, "Correct answer is embedded in PDF text."))
    return rows


def match_answer_from_explanation(choices, explanation):
    first_line = normalize_space((explanation or "").splitlines()[0] if explanation else "")
    first_key = normalize_key(first_line)
    for letter, choice in choices.items():
        choice_key = normalize_key(choice)
        if choice_key and (first_key.startswith(choice_key) or choice_key.startswith(first_key[: max(4, len(choice_key))])):
            return letter
    for letter, choice in choices.items():
        choice_text = normalize_space(choice).lower()
        if not choice_text:
            continue
        pattern = r"(?<![a-z0-9])" + re.escape(choice_text) + r"(?![a-z0-9])"
        if re.search(pattern, first_line.lower()):
            return letter
    return ""


def extract_secondary_explanations(spec):
    path = Path(spec["path"])
    pages = read_pages(path)
    rows = []
    q_pages = []
    for idx, text in enumerate(pages, 1):
        m = re.search(r"(?m)^\s*\W{0,3}(\d{1,3})[\.\)]\s*", text)
        if m:
            qnum = int(m.group(1))
            if not spec.get("max_q") or qnum <= spec["max_q"]:
                qtext = text[m.start() :]
                if len(OPTION_RE.findall(qtext)) >= 3:
                    q_pages.append((idx, qnum, qtext))
    for idx, qnum, qtext in q_pages:
        explanation = pages[idx] if idx < len(pages) else ""
        question, choices = parse_question_and_choices(qtext)
        answer = match_answer_from_explanation(choices, explanation)
        note = "Correct answer matched from the explanation page." if answer else "Explanation found, but answer letter could not be matched confidently."
        rows.append(make_row(spec, qnum, idx, question, choices, answer, normalize_space(explanation), note))
    return rows


def make_row(spec, qnum, page, question, choices, answer, explanation, note):
    has_image = "No"
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
        "Has Image": has_image,
        "Image Reference": "",
        "Status": "",
        "Notes": normalize_space(f"{spec['note']} {note}".strip()),
    }


def set_status(row):
    choices = [row[f"Choice {letter}"] for letter in "ABCD"]
    if not row["Question"] or sum(bool(c) for c in choices) < 2:
        row["Status"] = "Incomplete"
        row["Notes"] = normalize_space(row["Notes"] + " Incomplete question/options after extraction.")
    elif not row["Correct Answer"]:
        row["Status"] = "Needs Answer"
    else:
        row["Status"] = "Ready for Upload"


def mark_duplicates(rows):
    seen = {}
    for row in rows:
        key = normalize_key(row["Question"])
        if not key:
            continue
        if key in seen:
            original = seen[key]
            if row["Status"] == "Ready for Upload":
                row["Status"] = "Duplicate"
            row["Notes"] = normalize_space(row["Notes"] + f" Duplicate or near-duplicate of row {original['No.']}.")
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

    clean_rows = [{k: row.get(k, "") for k in FIELDS} | {"source_slug": row["source_slug"], "source_question_no": row["source_question_no"], "source_path": row["source_path"]} for row in rows]
    json_path.write_text(json.dumps(clean_rows, indent=2, ensure_ascii=False), encoding="utf-8")
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    def esc(value):
        return str(value or "").replace("|", "\\|").replace("\n", "<br>")

    lines = ["| " + " | ".join(FIELDS) + " |", "| " + " | ".join(["---"] * len(FIELDS)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    all_rows = []
    source_summaries = []
    for spec in PDFS:
        path = Path(spec["path"])
        if not path.exists():
            source_summaries.append({"slug": spec["slug"], "status": "missing", "path": spec["path"]})
            continue
        if spec["mode"] == "trailing_key":
            rows = extract_trailing_key(spec)
        elif spec["mode"] == "embedded_answer":
            rows = extract_embedded_answer(spec)
        elif spec["mode"] == "secondary_explanation_pages":
            rows = extract_secondary_explanations(spec)
        elif spec["mode"] == "no_key":
            rows = extract_no_key(spec)
        else:
            rows = []
        all_rows.extend(rows)
        if not rows:
            source_summaries.append({"slug": spec["slug"], "status": "no_rows", "path": spec["path"]})
        else:
            source_summaries.append({"slug": spec["slug"], "status": "processed", "rows": len(rows), "path": spec["path"]})

    # Apply page image flags per source after collecting rows.
    image_cache = {}
    for row in all_rows:
        if row["source_path"] not in image_cache:
            image_cache[row["source_path"]] = page_image_counts(Path(row["source_path"]))
        if image_cache[row["source_path"]].get(int(row["Page"] or 0), 0) > 0:
            row["Has Image"] = "Yes"
            row["Notes"] = normalize_space(row["Notes"] + " Page contains embedded image(s); crop reference not extracted in this pass.")

    # Deduplicate exact repeated object references accidentally added above.
    unique = []
    seen_identity = set()
    for row in all_rows:
        identity = (row["source_slug"], row["source_question_no"], row["Question"])
        if identity not in seen_identity:
            unique.append(row)
            seen_identity.add(identity)
    all_rows = unique

    for idx, row in enumerate(all_rows, 1):
        row["No."] = idx
        set_status(row)
        if row["Has Image"] == "Yes" and row["Status"] == "Ready for Upload":
            row["Status"] = "Needs Review"
    mark_duplicates(all_rows)

    status_counts = Counter(row["Status"] for row in all_rows)
    exam_counts = Counter(row["Exam Type"] for row in all_rows)
    source_counts = Counter(row["source_slug"] for row in all_rows)
    summary = {
        "total_questions_found": len(all_rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": status_counts.get("Needs Review", 0) + status_counts.get("Incomplete", 0),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in all_rows if row["Has Image"] == "Yes"),
        "status_counts": dict(status_counts),
        "exam_type_counts": dict(exam_counts),
        "source_counts": dict(source_counts),
        "sources": source_summaries,
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
        "recommended_next_action": "Review Needs Answer and Needs Review rows first, then upload only Ready for Upload rows to LET Elementary/Secondary topics with duplicate checks.",
    }
    write_outputs(all_rows, summary)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
