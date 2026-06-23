#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files/L. BSED - Mathematics-")
OUT_DIR = ROOT / "output/pdf"
BASE = "bsed_mathematics_sept2026_extracted_questions"

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
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f"Command failed: {' '.join(map(str, args))}\n{result.stderr}")
    return result.stdout


def normalize_space(value):
    return re.sub(r"\s+", " ", str(value or "").replace("\x0c", " ")).strip()


def normalize_key(value):
    text = normalize_space(value).lower()
    replacements = {
        "−": "-",
        "–": "-",
        "—": "-",
        "π": "pi",
        "√": "sqrt",
        "½": "1/2",
        "¼": "1/4",
        "¾": "3/4",
        "⁰": "0",
        "¹": "1",
        "²": "2",
        "³": "3",
        "⁴": "4",
        "⁵": "5",
        "⁶": "6",
        "⁷": "7",
        "⁸": "8",
        "⁹": "9",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = text.replace("^", "")
    return re.sub(r"[^a-z0-9]+", "", text)


def clean_pdf_text(text):
    cleaned = []
    for line in str(text or "").replace("\x0c", "\n").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if re.fullmatch(r"2026 LET REVIEWER FILES", stripped, re.I):
            continue
        if re.fullmatch(r"By:\s*Professionals Review PH", stripped, re.I):
            continue
        if re.fullmatch(r"Secondary\s*Level-?\s*MATHEMATICS", stripped, re.I):
            continue
        if re.fullmatch(r"Questions", stripped, re.I):
            continue
        if re.fullmatch(r"LET\s*Reviewer\s*MATHEMATICS\s*2026", stripped, re.I):
            continue
        if re.fullmatch(r"LETReviewer\s*MATHEMATICS\s*2026", stripped, re.I):
            continue
        if re.fullmatch(r"LETReviewer\s*MATHEMATICS", stripped, re.I):
            continue
        if re.fullmatch(r"2026", stripped):
            continue
        cleaned.append(stripped)
    return "\n".join(cleaned)


def pdf_text(path):
    return clean_pdf_text(run(["pdftotext", "-raw", str(path), "-"]))


def page_texts(path):
    info = run(["pdfinfo", str(path)])
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    pages = int(match.group(1)) if match else 0
    return [clean_pdf_text(run(["pdftotext", "-raw", "-f", str(i), "-l", str(i), str(path), "-"])) for i in range(1, pages + 1)]


def page_for_question(path, qnum):
    marker = re.compile(rf"(?<!\d){qnum}\.(?!\d)")
    for index, text in enumerate(page_texts(path), 1):
        if marker.search(text):
            return str(index)
    return ""


QUESTION_RE = re.compile(r"(?m)^\s*([1-9]|[1-4]\d|50)\.")
CHOICE_RE = re.compile(r"(?<![A-Za-z0-9])([A-D])\.\s*")


def split_numbered_items(text):
    markers = []
    for match in QUESTION_RE.finditer(text):
        qnum = int(match.group(1))
        if 1 <= qnum <= 50:
            markers.append((qnum, match.start(), match.end()))
    items = []
    seen = set()
    for index, (qnum, start, marker_end) in enumerate(markers):
        if qnum in seen:
            continue
        end = markers[index + 1][1] if index + 1 < len(markers) else len(text)
        items.append((qnum, text[marker_end:end]))
        seen.add(qnum)
    return items


def split_question_choices(block):
    block = normalize_space(block)
    markers = list(CHOICE_RE.finditer(block))
    if not markers:
        return block, {}
    question = normalize_space(block[: markers[0].start()])
    choices = {}
    for index, match in enumerate(markers):
        letter = match.group(1)
        end = markers[index + 1].start() if index + 1 < len(markers) else len(block)
        choices[letter] = normalize_space(block[match.end() : end])
    return question, choices


def split_answer_key(key_text):
    items = {}
    for qnum, block in split_numbered_items(key_text):
        raw = normalize_space(block)
        if not raw:
            continue
        parts = re.split(r"\s+[–-]\s+", raw, maxsplit=1)
        answer_text = normalize_space(parts[0])
        rationale = normalize_space(parts[1]) if len(parts) > 1 else ""
        items[qnum] = {"answer_text": answer_text, "rationale": rationale}
    return items


def answer_letter(answer_text, choices):
    key = normalize_key(answer_text)
    if not key:
        return ""
    for letter, choice in choices.items():
        choice_key = normalize_key(choice)
        if choice_key == key:
            return letter
    for letter, choice in choices.items():
        choice_key = normalize_key(choice)
        if len(key) >= 4 and (choice_key.startswith(key) or key.startswith(choice_key)):
            return letter
    return ""


def infer_topic(question):
    text = normalize_space(question).lower()
    if any(word in text for word in ["differentiate", "derivative", "dy/dx", "integral", "limit", "area under"]):
        return "Calculus"
    if any(word in text for word in ["probability", "mean", "median", "mode", "variance", "standard deviation", "z-score", "correlation", "regression"]):
        return "Statistics and Probability"
    if any(word in text for word in ["triangle", "circle", "rectangle", "square", "sphere", "cone", "cylinder", "polygon", "angle", "diagonal", "volume", "area", "perimeter", "circumference"]):
        return "Geometry"
    if any(word in text for word in ["sin", "cos", "tan", "radian", "degree", "trigonometric"]):
        return "Trigonometry"
    if any(word in text for word in ["matrix", "determinant", "transpose", "complex", "conjugate", "modulus"]):
        return "Linear Algebra and Complex Numbers"
    if any(word in text for word in ["sequence", "series", "ratio", "proportion", "interest", "depreciation", "percent"]):
        return "Sequences, Ratio, and Financial Mathematics"
    if any(word in text for word in ["assessment", "constructivist", "spiral", "geogebra", "rubric", "problem-based", "scaffolding"]):
        return "Mathematics Pedagogy"
    return "Algebra"


def status_for(row):
    if row["Duplicate Of"]:
        return "Duplicate"
    if not row["Question"] or sum(1 for letter in "ABCD" if row[f"Choice {letter}"]) < 4:
        return "Incomplete"
    if not row["Correct Answer"]:
        return "Needs Answer"
    return "Ready for Upload"


def extract_pdf(path, start_no):
    text = pdf_text(path)
    key_match = re.search(r"\bAnswer Keys\b", text, re.I)
    if not key_match:
        raise RuntimeError(f"No answer key found in {path}")
    question_text = text[: key_match.start()]
    key_text = text[key_match.end() :]
    answer_key = split_answer_key(key_text)
    rows = []
    next_no = start_no
    for qnum, block in split_numbered_items(question_text):
        question, choices = split_question_choices(block)
        answer_info = answer_key.get(qnum, {})
        letter = answer_letter(answer_info.get("answer_text", ""), choices)
        row = {
            "No.": str(next_no),
            "Original No.": str(qnum),
            "Page": page_for_question(path, qnum),
            "Source PDF": path.name,
            "Source Path": str(path),
            "Question": question,
            "Passage Reference": "",
            "Question Image Reference": "",
            "Choice A": choices.get("A", ""),
            "Choice A Image Reference": "",
            "Choice B": choices.get("B", ""),
            "Choice B Image Reference": "",
            "Choice C": choices.get("C", ""),
            "Choice C Image Reference": "",
            "Choice D": choices.get("D", ""),
            "Choice D Image Reference": "",
            "Choice E": "",
            "Choice E Image Reference": "",
            "Correct Answer": letter,
            "Explanation": answer_info.get("rationale", ""),
            "LET Exam Type": "LET Secondary",
            "Subject Area": "Mathematics",
            "Topic": infer_topic(question),
            "Difficulty": "3",
            "Has Image": "No",
            "Duplicate Of": "",
            "Confidence": "0.98" if letter else "0.74",
            "Status": "",
            "Notes": "Path indicates BSED/Secondary. Correct answer and rationale sourced from source PDF answer key.",
        }
        row["Status"] = status_for(row)
        rows.append(row)
        next_no += 1
    return rows


def mark_duplicates(rows):
    seen = {}
    for row in rows:
        key = normalize_key(row["Question"])
        if not key:
            continue
        if key in seen:
            row["Duplicate Of"] = seen[key]
            row["Status"] = "Duplicate"
            row["Confidence"] = "0.90"
            row["Notes"] = normalize_space(row["Notes"] + f" Duplicate or near-duplicate of row {seen[key]}.")
        else:
            seen[key] = row["No."]


def write_outputs(rows):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
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

    md_lines = ["| " + " | ".join(FIELDS) + " |", "| " + " | ".join(["---"] * len(FIELDS)) + " |"]
    for row in rows:
        md_lines.append("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |")
    md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    status_counts = Counter(row["Status"] for row in rows)
    topic_counts = Counter(row["Topic"] for row in rows)
    pdf_counts = Counter(row["Source PDF"] for row in rows)
    summary = {
        "source_dir": str(SOURCE_DIR),
        "source_pdfs": len(list(SOURCE_DIR.glob("*.pdf"))),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(status_counts.get(status, 0) for status in ["Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"]),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": 0,
        "total_questions_with_image_based_answer_choices": 0,
        "total_elementary_questions": 0,
        "total_secondary_questions": len(rows),
        "total_both_or_cannot_determine_questions": 0,
        "status_counts": dict(status_counts),
        "subject_category_breakdown": {"Mathematics": len(rows)},
        "topic_breakdown": dict(topic_counts),
        "difficulty_breakdown": dict(Counter(row["Difficulty"] for row in rows)),
        "source_counts": dict(pdf_counts),
        "suggested_supabase_table_mapping": {
            "exam_type": "LET Exam Type",
            "exam_level": "LET Exam Type",
            "subject_area": "Subject Area",
            "topic": "Topic",
            "question_text": "Question",
            "choice_a_text": "Choice A",
            "choice_b_text": "Choice B",
            "choice_c_text": "Choice C",
            "choice_d_text": "Choice D",
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
        "recommended_next_action_before_uploading": "Upload Ready for Upload rows after source-key duplicate check against Supabase.",
        "outputs": {
            "csv": str(csv_path),
            "json": str(json_path),
            "markdown": str(md_path),
            "summary": str(summary_path),
        },
    }
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


def main():
    rows = []
    next_no = 1
    for path in sorted(SOURCE_DIR.glob("*.pdf")):
        extracted = extract_pdf(path, next_no)
        if len(extracted) != 50:
            raise RuntimeError(f"Expected 50 questions in {path.name}, found {len(extracted)}")
        rows.extend(extracted)
        next_no += len(extracted)
    mark_duplicates(rows)
    summary = write_outputs(rows)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
