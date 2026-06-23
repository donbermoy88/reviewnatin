#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/pdf"
BASE = "sept2026_let_extracted_questions"
REPORT = OUT_DIR / "sept2026_let_answer_key_resolution_report.json"

FIELDS = [
    "No.",
    "Original No.",
    "Page",
    "Source PDF",
    "Source Path",
    "Question",
    "Passage Reference",
    "Question Image Reference",
    "Choice A",
    "Choice A Image Reference",
    "Choice B",
    "Choice B Image Reference",
    "Choice C",
    "Choice C Image Reference",
    "Choice D",
    "Choice D Image Reference",
    "Choice E",
    "Choice E Image Reference",
    "Correct Answer",
    "Explanation",
    "LET Exam Type",
    "Subject Area",
    "Topic",
    "Difficulty",
    "Has Image",
    "Duplicate Of",
    "Confidence",
    "Status",
    "Notes",
]


def run(args):
    return subprocess.run(args, capture_output=True, text=True).stdout


def normalize_space(value):
    value = str(value or "").replace("\x0c", "\n")
    value = value.replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", value).strip()


def normalize_key(value):
    return re.sub(r"[^a-z0-9]+", "", normalize_space(value).lower())


def pdf_text(path):
    return run(["pdftotext", "-raw", str(path), "-"])


def find_key_start(text):
    low = text.lower()
    markers = [
        "answer key",
        "answer keys",
        "key to",
        "answers:",
        "correct answers",
        "sagot",
    ]
    positions = [low.find(marker) for marker in markers if low.find(marker) >= 0]
    if positions:
        return min(positions)

    # Some files append a dense key with no heading, e.g. "101. c 102. d ...".
    tail_start = int(len(text) * 0.60)
    tail = text[tail_start:]
    matches = list(re.finditer(r"(?<!\d)(\d{1,4})\s*[\.\)\-]?\s*([A-Ea-e])(?:\b|[\s,;])", tail))
    for idx, match in enumerate(matches):
        nearby = [m for m in matches[idx : idx + 12] if m.start() - match.start() < 1200]
        if len(nearby) >= 8:
            return tail_start + match.start()
    return -1


def parse_letter_answers(key_text):
    answers = {}
    patterns = [
        r"(?<!\d)(\d{1,4})\s*[\.\)]?\s*[-:]?\s*([A-Ea-e])(?:\b|[\s,;])",
        r"(?<!\d)(\d{1,4})\s*[-]\s*([A-Ea-e])(?:\b|[\s,;])",
    ]
    for pattern in patterns:
        for qnum, letter in re.findall(pattern, key_text):
            answers[int(qnum)] = letter.upper()
    return answers


def parse_answer_texts(key_text):
    answers = {}
    text = key_text.replace("\x0c", "\n")
    for match in re.finditer(r"(?<!\d)(\d{1,4})\s*[\.\)]\s+", text):
        qnum = int(match.group(1))
        start = match.end()
        next_match = re.search(r"(?<!\d)\d{1,4}\s*[\.\)]\s+", text[start:])
        end = start + next_match.start() if next_match else min(len(text), start + 240)
        raw = normalize_space(text[start:end])
        if not raw or re.fullmatch(r"[A-Ea-e]", raw[:1]):
            continue
        answer = normalize_space(re.split(r"\s+-\s+|\s+–\s+|\s+—\s+", raw, maxsplit=1)[0])
        if 2 <= len(answer) <= 120:
            answers[qnum] = answer
    return answers


def match_answer_text_to_choice(row, answer_text):
    answer_key = normalize_key(answer_text)
    if len(answer_key) < 3:
        return ""
    for letter in "ABCDE":
        choice = row.get(f"Choice {letter}", "")
        choice_key = normalize_key(choice)
        if not choice_key:
            continue
        if choice_key == answer_key:
            return letter
        if len(answer_key) >= 5 and (choice_key.startswith(answer_key) or answer_key.startswith(choice_key)):
            return letter
    return ""


def status_for(row):
    if row.get("Duplicate Of"):
        return "Duplicate"
    if row.get("Question Image Reference") or any(row.get(f"Choice {letter} Image Reference") for letter in "ABCDE"):
        return "Needs Image Extraction"
    choices = [row.get(f"Choice {letter}", "") for letter in "ABCD"]
    if not row.get("Question") or sum(bool(normalize_space(choice)) for choice in choices) < 4:
        return "Incomplete"
    if row.get("LET Exam Type") == "Cannot Determine" or row.get("Subject Area") == "Cannot Determine":
        return "Needs Review"
    if not row.get("Correct Answer"):
        return "Needs Answer"
    return "Ready for Upload"


def confidence_for(row):
    score = 0.95
    if row["Status"] != "Ready for Upload":
        score -= 0.2
    if row.get("LET Exam Type") == "Cannot Determine" or row.get("Subject Area") == "Cannot Determine":
        score -= 0.2
    if not row.get("Correct Answer"):
        score -= 0.18
    return f"{max(0.05, min(score, 0.99)):.2f}"


def write_outputs(rows):
    csv_path = OUT_DIR / f"{BASE}.csv"
    json_path = OUT_DIR / f"{BASE}.json"
    md_path = OUT_DIR / f"{BASE}.md"
    summary_path = OUT_DIR / f"{BASE}_summary.json"

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    json_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")

    def esc(value):
        return str(value or "").replace("|", "\\|").replace("\n", "<br>")

    lines = ["| " + " | ".join(FIELDS) + " |", "| " + " | ".join(["---"] * len(FIELDS)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    old_summary = json.loads(summary_path.read_text(encoding="utf-8"))
    status_counts = Counter(row["Status"] for row in rows)
    exam_counts = Counter(row["LET Exam Type"] for row in rows)
    subject_counts = Counter(row["Subject Area"] for row in rows)
    difficulty_counts = Counter(row["Difficulty"] for row in rows)
    old_summary.update(
        {
            "total_questions_found": len(rows),
            "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
            "total_needing_review": sum(
                status_counts.get(status, 0)
                for status in ["Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"]
            ),
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
        }
    )
    summary_path.write_text(json.dumps(old_summary, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    rows = json.loads((OUT_DIR / f"{BASE}.json").read_text(encoding="utf-8"))
    by_source = defaultdict(list)
    for row in rows:
        if row["Status"] == "Needs Answer":
            by_source[row["Source Path"]].append(row)

    source_reports = []
    resolved = 0
    newly_ready = 0
    for source_path, source_rows in by_source.items():
        path = Path(source_path)
        if not path.exists():
            source_reports.append({"source_path": source_path, "status": "missing", "resolved": 0})
            continue
        text = pdf_text(path)
        key_start = find_key_start(text)
        if key_start < 0:
            source_reports.append({"source_path": source_path, "status": "no_key_section", "resolved": 0})
            continue
        key_text = text[key_start:]
        letter_answers = parse_letter_answers(key_text)
        answer_texts = parse_answer_texts(key_text)
        source_resolved = 0
        for row in source_rows:
            qnum = int(row["Original No."]) if str(row["Original No."]).isdigit() else None
            if qnum is None:
                continue
            answer = letter_answers.get(qnum, "")
            if not answer and qnum in answer_texts:
                answer = match_answer_text_to_choice(row, answer_texts[qnum])
            if not answer:
                continue
            old_status = row["Status"]
            row["Correct Answer"] = answer
            row["Notes"] = normalize_space(row.get("Notes", "") + " Correct answer resolved from source PDF answer key in second pass.")
            row["Status"] = status_for(row)
            row["Confidence"] = confidence_for(row)
            source_resolved += 1
            resolved += 1
            if old_status != "Ready for Upload" and row["Status"] == "Ready for Upload":
                newly_ready += 1
        source_reports.append(
            {
                "source_path": source_path,
                "status": "processed",
                "needs_answer_rows": len(source_rows),
                "letter_answers_found": len(letter_answers),
                "answer_texts_found": len(answer_texts),
                "resolved": source_resolved,
            }
        )

    write_outputs(rows)
    report = {
        "resolved_answers": resolved,
        "newly_ready_for_upload": newly_ready,
        "status_counts": dict(Counter(row["Status"] for row in rows)),
        "sources_processed": len(source_reports),
        "source_reports": source_reports,
    }
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
