#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path("/Users/lyndon/All reviewers/-LET REVIEWER 2026/C. MAJOR SUBJECTS/G. T L E/A. Q&A Drills")
OUT_DIR = ROOT / "output/pdf"
BASE = "let_tle_qa_drills_2026_extracted_questions"

FIELDS = [
    "No.", "Original No.", "Page", "Source PDF", "Source Path", "Question",
    "Passage Reference", "Question Image Reference",
    "Choice A", "Choice A Image Reference", "Choice B", "Choice B Image Reference",
    "Choice C", "Choice C Image Reference", "Choice D", "Choice D Image Reference",
    "Choice E", "Choice E Image Reference", "Correct Answer", "Explanation",
    "LET Exam Type", "Subject Area", "Topic", "Difficulty", "Has Image",
    "Duplicate Of", "Confidence", "Status", "Notes",
]

QUESTION_RE = re.compile(r"(?m)^\s*([1-9]\d{0,2})\.\s*")
CHOICE_RE = re.compile(r"(?m)^\s*([A-Da-d])\.\s+")


def run(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f"Command failed: {' '.join(map(str, args))}\n{result.stderr}")
    return result.stdout


def normalize_space(value):
    text = str(value or "").replace("\x0c", "\n")
    text = re.sub(r"Get more Free LET Reviewers @ www\.teachpinas\.com", "", text, flags=re.I)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def pdf_text(path):
    return run(["pdftotext", "-raw", str(path), "-"])


def page_lookup(path):
    info = run(["pdfinfo", str(path)])
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    pages = int(match.group(1)) if match else 0
    lookup = {}
    for page in range(1, pages + 1):
        text = run(["pdftotext", "-raw", "-f", str(page), "-l", str(page), str(path), "-"])
        if re.search(r"\bAnswer Keys?:", text, re.I):
            text = text[: re.search(r"\bAnswer Keys?:", text, re.I).start()]
        for qmatch in QUESTION_RE.finditer(text):
            lookup.setdefault(int(qmatch.group(1)), str(page))
    return lookup


def split_items(text):
    markers = [(int(m.group(1)), m.start(), m.end()) for m in QUESTION_RE.finditer(text)]
    items = []
    for index, (number, start, end_marker) in enumerate(markers):
        end = markers[index + 1][1] if index + 1 < len(markers) else len(text)
        if 1 <= number <= 200:
            items.append((number, text[end_marker:end]))
    return items


def split_question_choices(block):
    markers = list(CHOICE_RE.finditer(block))
    if not markers:
        return normalize_space(block), {}
    question = normalize_space(block[: markers[0].start()])
    choices = {}
    for index, match in enumerate(markers):
        end = markers[index + 1].start() if index + 1 < len(markers) else len(block)
        choices[match.group(1).upper()] = normalize_space(block[match.end():end])
    return question, choices


def extract_answer_key(text):
    key_match = re.search(r"\bAnswer Keys?:", text, re.I)
    if not key_match:
        return None, text
    question_text = text[: key_match.start()]
    key_text = text[key_match.end():]
    answers = {
        int(number): letter.upper()
        for number, letter in re.findall(r"(?<!\d)([1-9]\d{0,2})\.\s*([A-Da-d])\b", key_text)
    }
    return answers, question_text


def infer_topic(question, source_name):
    text = f"{source_name} {question}".lower()
    if re.search(r"farm|fish|crop|soil|pond|fertilizer|poultry|livestock|aquaculture|agriculture", text):
        return "Agriculture and Fishery Arts"
    if re.search(r"plumb|mason|carpentry|weld|draft|wood|lumber|concrete|blueprint|orthographic|isometric", text):
        return "Industrial Arts"
    if re.search(r"circuit|resistor|voltage|current|ohm|computer|software|hardware|network|electronics|diode|fuse", text):
        return "ICT and Electronics"
    if re.search(r"food|cook|nutrition|meal|pastry|sewing|garment|family|home|housekeeping", text):
        return "Home Economics"
    if re.search(r"business|entrepreneur|market|retail|profit|capital|sales|customer|pricing", text):
        return "Entrepreneurship and Business Management"
    return "TLE General"


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
    answers, question_text = extract_answer_key(text)
    if answers is None:
        return [], {
            "source_path": str(path),
            "status": "no_answer_key",
            "text_chars": len(text),
        }, start_no

    pages = page_lookup(path)
    rows = []
    next_no = start_no
    for original_no, block in split_items(question_text):
        question, choices = split_question_choices(block)
        answer = answers.get(original_no, "")
        row = {
            "No.": str(next_no),
            "Original No.": str(original_no),
            "Page": pages.get(original_no, ""),
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
            "Correct Answer": answer,
            "Explanation": f"Correct answer sourced from the trailing answer key: {answer}.",
            "LET Exam Type": "LET Secondary",
            "Subject Area": "Technology and Livelihood Education",
            "Topic": infer_topic(question, path.name),
            "Difficulty": "3",
            "Has Image": "No",
            "Duplicate Of": "",
            "Confidence": "0.96" if answer else "0.70",
            "Status": "",
            "Notes": "LET Secondary TLE Q&A drill. Correct answer sourced from trailing answer key.",
        }
        row["Status"] = status_for(row)
        rows.append(row)
        next_no += 1
    return rows, {
        "source_path": str(path),
        "status": "processed",
        "rows": len(rows),
        "ready": sum(1 for row in rows if row["Status"] == "Ready for Upload"),
        "answers": len(answers),
    }, next_no


def mark_duplicates(rows):
    seen = {}
    for row in rows:
        key = re.sub(r"\W+", "", row["Question"].lower())
        if key in seen:
            row["Duplicate Of"] = seen[key]
            row["Status"] = status_for(row)
        else:
            seen[key] = row["No."]


def write_outputs(rows, summary):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUT_DIR / f"{BASE}.json"
    csv_path = OUT_DIR / f"{BASE}.csv"
    md_path = OUT_DIR / f"{BASE}.md"
    summary_path = OUT_DIR / f"{BASE}_summary.json"

    json_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    lines = ["# LET TLE Q&A Drills 2026 Extraction", ""]
    for row in rows:
        question = row["Question"] or "(missing question text)"
        lines.append(f"## {row['No.']}. {question}")
        for letter in "ABCD":
            choice = row[f"Choice {letter}"]
            lines.append(f"- {letter}. {choice}" if choice else f"- {letter}.")
        lines.append(f"- Answer: {row['Correct Answer']}")
        lines.append("")
    md_path.write_text("\n".join(lines), encoding="utf-8")
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    rows = []
    sources = []
    next_no = 1
    for path in sorted(SOURCE_DIR.glob("*.pdf")):
        if not re.fullmatch(r"[1-6]\.pdf", path.name):
            sources.append({"source_path": str(path), "status": "not_keyed_drill"})
            continue
        extracted, source_summary, next_no = extract_pdf(path, next_no)
        rows.extend(extracted)
        sources.append(source_summary)
    mark_duplicates(rows)
    summary = {
        "input_dir": str(SOURCE_DIR),
        "sources": sources,
        "extracted_rows": len(rows),
        "status_counts": dict(Counter(row["Status"] for row in rows)),
        "topic_counts": dict(Counter(row["Topic"] for row in rows)),
        "outputs": {
            "json": str(OUT_DIR / f"{BASE}.json"),
            "csv": str(OUT_DIR / f"{BASE}.csv"),
            "markdown": str(OUT_DIR / f"{BASE}.md"),
        },
    }
    write_outputs(rows, summary)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
