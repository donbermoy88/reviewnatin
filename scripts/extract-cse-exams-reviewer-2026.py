#!/usr/bin/env python3
import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
SOURCE_TOKEN = "cse_exams_reviewer_2026"

HEADERS = [
    "No.",
    "Source PDF",
    "Source Path",
    "Original No.",
    "Page",
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
    "Topic Slug",
    "Difficulty",
    "Has Image",
    "Image Reference",
    "Image Path",
    "Status",
    "Notes",
]

SECTION_SPECS = [
    {
        "name": "Word Problems and Operations",
        "start": "Word Problems and Operations",
        "end": "Data Sufficiency",
        "subject": "Numerical Ability",
        "topic": "word-problems",
        "sub_topic": "word-problems-sub",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Data Sufficiency",
        "start": "Data Sufficiency",
        "end": "Clerical Operations (Alphabetizing)",
        "subject": "Numerical Ability",
        "topic": "data-interpretation",
        "sub_topic": "",
        "difficulty": 3,
        "mode": "data_sufficiency",
    },
    {
        "name": "Clerical Operations (Alphabetizing)",
        "start": "Clerical Operations (Alphabetizing)",
        "end": "Synonyms",
        "subject": "Clerical Operations",
        "topic": "filing-coding",
        "sub_topic": "filing-coding",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Synonyms",
        "start": "Synonyms",
        "end": "Antonyms",
        "subject": "Verbal Ability",
        "topic": "vocabulary",
        "sub_topic": "vocabulary",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Antonyms",
        "start": "Antonyms",
        "end": "Single-Word Analogy",
        "subject": "Verbal Ability",
        "topic": "vocabulary",
        "sub_topic": "vocabulary",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Single-Word Analogy",
        "start": "Single-Word Analogy",
        "end": "Double-Word Analogy",
        "subject": "Verbal Ability",
        "topic": "verbal-comprehension",
        "sub_topic": "",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Double-Word Analogy",
        "start": "Double-Word Analogy",
        "end": "Identifying Errors",
        "subject": "Verbal Ability",
        "topic": "word-association",
        "sub_topic": "",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Correct Usage",
        "start": "Correct Usage",
        "end": "Reading Comprehension",
        "subject": "Verbal Ability",
        "topic": "grammar",
        "sub_topic": "grammar",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Kasingkahulugan",
        "start": "Kasingkahulugan",
        "end": "Kasalungat",
        "subject": "Verbal Ability",
        "topic": "vocabulary-fil",
        "sub_topic": "vocabulary-fil",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Kasalungat",
        "start": "Kasalungat",
        "end": "Kawikaan",
        "subject": "Verbal Ability",
        "topic": "vocabulary-fil",
        "sub_topic": "vocabulary-fil",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Kawikaan",
        "start": "Kawikaan",
        "end": "Wastong Gamit",
        "subject": "Verbal Ability",
        "topic": "vocabulary-fil",
        "sub_topic": "vocabulary-fil",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Wastong Gamit",
        "start": "Wastong Gamit",
        "end": "Pagkilala sa Mali",
        "subject": "Verbal Ability",
        "topic": "grammar-fil",
        "sub_topic": "grammar-fil",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Constitution",
        "start": "Constitution",
        "end": "Inductive Reasoning",
        "subject": "General Information",
        "topic": "constitution",
        "sub_topic": "phil-government",
        "difficulty": 2,
        "mode": "standard",
    },
    {
        "name": "Inductive Reasoning",
        "start": "Inductive Reasoning",
        "end": "Abstract Reasoning",
        "subject": "Analytical Ability",
        "topic": "number-series",
        "sub_topic": "number-series-sub",
        "difficulty": 2,
        "mode": "standard",
    },
]

SKIPPED_SECTIONS = [
    "Identifying Errors",
    "Paragraph Development",
    "Reading Comprehension",
    "Pagkilala sa Mali",
    "Pag-unawa sa Binasa",
    "Pagtatalata",
    "Abstract Reasoning",
]

DATA_SUFFICIENCY_CHOICES = {
    "A": "Statement (1) alone is sufficient, but statement (2) alone is not sufficient.",
    "B": "Statement (2) alone is sufficient, but statement (1) alone is not sufficient.",
    "C": "Both statements together are sufficient, but neither statement alone is sufficient.",
    "D": "Each statement alone is sufficient.",
    "E": "Statements (1) and (2) together are not sufficient.",
}


def normalize_space(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def is_red(color):
    return isinstance(color, tuple) and len(color) >= 3 and color[0] > 0.8 and color[1] < 0.2 and color[2] < 0.2


def clean_line(text):
    text = normalize_space(text)
    if re.fullmatch(r"P\s*a\s*g\s*e\s*\|\s*\d+", text, re.I):
        return ""
    if text in {"REVIEWER 2026", "==== END ====", "CONGRATULATIONS! You made it here!"}:
        return ""
    return text


def page_lines(page, page_no):
    words = page.extract_words(extra_attrs=["non_stroking_color"], x_tolerance=2, y_tolerance=3)
    buckets = []
    for word in words:
        if not word["text"].strip():
            continue
        top = round(word["top"] / 3) * 3
        for bucket in buckets:
            if abs(bucket["top"] - top) <= 3:
                bucket["words"].append(word)
                break
        else:
            buckets.append({"top": top, "page": page_no, "words": [word]})

    lines = []
    for bucket in sorted(buckets, key=lambda item: item["top"]):
        words_sorted = sorted(bucket["words"], key=lambda item: item["x0"])
        text = clean_line(" ".join(word["text"] for word in words_sorted))
        if not text:
            continue
        red = " ".join(word["text"] for word in words_sorted if is_red(word.get("non_stroking_color")))
        lines.append({
            "page": page_no,
            "top": bucket["top"],
            "text": text,
            "red": normalize_space(red),
        })
    return lines


def collect_lines(pdf_path):
    lines = []
    with pdfplumber.open(pdf_path) as pdf:
        for idx, page in enumerate(pdf.pages, start=1):
            if 4 <= idx <= 153:
                lines.extend(page_lines(page, idx))
    return lines


def line_matches_heading(line, heading):
    return normalize_space(line["text"]).lower() == heading.lower()


def find_heading(lines, heading, start_index=0):
    for i in range(start_index, len(lines)):
        if line_matches_heading(lines[i], heading):
            return i
    return -1


def section_slice(lines, start_heading, end_heading):
    start = find_heading(lines, start_heading)
    if start < 0:
        return []
    end = find_heading(lines, end_heading, start + 1) if end_heading else len(lines)
    if end < 0:
        end = len(lines)
    return lines[start + 1:end]


def split_blocks(lines):
    blocks = []
    current = []
    for line in lines:
        text = line["text"]
        if re.match(r"^\d+\.", text):
            if current:
                blocks.append(current)
            current = [line]
        elif current:
            current.append(line)
    if current:
        blocks.append(current)
    return blocks


def strip_directions(text):
    text = re.sub(r"^Directions?:.*?(?=\d+\.)", "", text, flags=re.I)
    text = re.sub(r"^Panuto:.*?(?=\d+\.)", "", text, flags=re.I)
    return normalize_space(text)


def answer_from_red(block_lines, choices):
    red_text = normalize_space(" ".join(line["red"] for line in block_lines if line["red"]))
    red_norm = normalize_space(red_text).lower()
    candidates = []
    if not red_norm:
        return "", "No red answer text detected."

    for line in block_lines:
        if not line["red"]:
            continue
        m = re.match(r"^([abcde])\.", line["red"].strip(), flags=re.I)
        if m:
            candidates.append(m.group(1).upper())

    for letter, choice in choices.items():
        choice_norm = normalize_space(choice).lower()
        if not choice_norm:
            continue
        if choice_norm == red_norm or choice_norm in red_norm or red_norm in choice_norm:
            candidates.append(letter)
        else:
            red_parts = [part for part in re.split(r"\s{2,}| \| ", red_norm) if len(part) >= 2]
            if any(part and part in choice_norm for part in red_parts):
                candidates.append(letter)

    unique = sorted(set(candidates))
    if len(unique) == 1:
        return unique[0], ""
    return "", f"Could not uniquely map red answer text: {red_text}"


def parse_standard_block(block_lines):
    text = strip_directions(" ".join(line["text"] for line in block_lines))
    m = re.match(r"^(\d+)\.\s*(.*)$", text)
    if not m:
        return None
    qnum = m.group(1)
    body = m.group(2)
    markers = list(re.finditer(r"(?<![A-Za-z0-9])([abcde])\.\s*", body))
    if len(markers) < 4:
        return {
            "qnum": qnum,
            "question": normalize_space(body),
            "choices": {},
            "answer": "",
            "status": "Incomplete",
            "notes": "Could not parse four answer choices.",
        }

    first = markers[0]
    question = normalize_space(body[:first.start()])
    choices = {}
    for i, marker in enumerate(markers):
        label = marker.group(1).upper()
        end = markers[i + 1].start() if i + 1 < len(markers) else len(body)
        value = normalize_space(body[marker.end():end])
        if label not in choices:
            choices[label] = value

    # Keep only contiguous A-D/E choices. Stray statement labels inside stems are rejected.
    wanted = ["A", "B", "C", "D"] + (["E"] if "E" in choices else [])
    choices = {letter: choices.get(letter, "") for letter in wanted if choices.get(letter)}
    answer, answer_note = answer_from_red(block_lines, choices)

    status = "Ready for Upload"
    notes = []
    if len([letter for letter in ["A", "B", "C", "D"] if choices.get(letter)]) < 4:
        status = "Incomplete"
        notes.append("Missing one or more A-D choices.")
    normalized_choices = [normalize_space(choices.get(letter, "")).lower() for letter in ["A", "B", "C", "D"] if choices.get(letter)]
    if len(set(normalized_choices)) != len(normalized_choices):
        status = "Needs Review"
        notes.append("Duplicate answer-choice text detected.")
    if not question or len(question) < 8:
        status = "Needs Review"
        notes.append("Question stem is too short or unclear.")
    if not answer:
        status = "Needs Answer"
        notes.append(answer_note)

    return {
        "qnum": qnum,
        "question": question,
        "choices": choices,
        "answer": answer,
        "status": status,
        "notes": " ".join(notes).strip(),
    }


def parse_data_sufficiency_block(block_lines):
    text = strip_directions(" ".join(line["text"] for line in block_lines))
    m = re.match(r"^(\d+)\.\s*(.*)$", text)
    if not m:
        return None
    qnum = m.group(1)
    body = m.group(2)
    ans = re.search(r"Answer:\s*([abcde])", body, flags=re.I)
    answer = ans.group(1).upper() if ans else ""
    question = normalize_space(re.sub(r"Answer:\s*[abcde]\.?", "", body, flags=re.I))
    status = "Ready for Upload" if answer in DATA_SUFFICIENCY_CHOICES else "Needs Answer"
    return {
        "qnum": qnum,
        "question": question,
        "choices": DATA_SUFFICIENCY_CHOICES.copy(),
        "answer": answer,
        "status": status,
        "notes": "" if status == "Ready for Upload" else "Could not parse explicit Answer marker.",
    }


def make_row(index, pdf_path, spec, parsed, block_lines):
    choices = parsed["choices"]
    page_values = sorted({line["page"] for line in block_lines})
    page_text = str(page_values[0]) if len(page_values) == 1 else f"{page_values[0]}-{page_values[-1]}"
    return {
        "No.": index,
        "Source PDF": pdf_path.name,
        "Source Path": str(pdf_path),
        "Original No.": parsed["qnum"],
        "Page": page_text,
        "Question": parsed["question"],
        "Choice A": choices.get("A", ""),
        "Choice B": choices.get("B", ""),
        "Choice C": choices.get("C", ""),
        "Choice D": choices.get("D", ""),
        "Choice E if there is": choices.get("E", ""),
        "Correct Answer": parsed["answer"],
        "Explanation": f"Correct answer is marked in red in the source PDF: {parsed['answer']}." if parsed["answer"] else "",
        "Exam Type": "Both",
        "Subject Category": spec["subject"],
        "Topic Slug": spec["topic"],
        "Difficulty": spec["difficulty"],
        "Has Image": "No",
        "Image Reference": "",
        "Image Path": "",
        "Status": parsed["status"],
        "Notes": normalize_space(f"{spec['name']}. {parsed['notes']}"),
    }


def extract(pdf_path):
    lines = collect_lines(pdf_path)
    rows = []
    section_counts = {}
    nonready = []

    for spec in SECTION_SPECS:
        sec_lines = section_slice(lines, spec["start"], spec["end"])
        blocks = split_blocks(sec_lines)
        count_before = len(rows)
        for block in blocks:
            parsed = parse_data_sufficiency_block(block) if spec["mode"] == "data_sufficiency" else parse_standard_block(block)
            if not parsed:
                continue
            row = make_row(len(rows) + 1, pdf_path, spec, parsed, block)
            if spec["sub_topic"]:
                row["Notes"] = normalize_space(f"{row['Notes']} sub_topic:{spec['sub_topic']}")
            rows.append(row)
            if row["Status"] != "Ready for Upload":
                nonready.append({
                    "section": spec["name"],
                    "original_no": row["Original No."],
                    "status": row["Status"],
                    "notes": row["Notes"],
                })
        section_counts[spec["name"]] = len(rows) - count_before

    return rows, {
        "sections": section_counts,
        "nonready_samples": nonready[:100],
        "skipped_sections": SKIPPED_SECTIONS,
    }


def write_outputs(rows, summary, base):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUT_DIR / f"{base}.csv"
    json_path = OUT_DIR / f"{base}.json"
    md_path = OUT_DIR / f"{base}.md"
    summary_path = OUT_DIR / f"{base}_summary.json"

    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)

    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    md_lines = ["| " + " | ".join(HEADERS) + " |", "|" + "|".join(["---"] * len(HEADERS)) + "|"]
    for row in rows:
        md_lines.append("| " + " | ".join(str(row.get(header, "")).replace("|", "\\|") for header in HEADERS) + " |")
    md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    summary["outputs"] = {
        "csv": str(csv_path),
        "json": str(json_path),
        "md": str(md_path),
        "summary": str(summary_path),
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return csv_path, json_path, md_path, summary_path


def main():
    parser = argparse.ArgumentParser(description="Extract CSE Exams and Reviewer 2026 questions.")
    parser.add_argument("--input", required=True, help="Folder containing the CSE reviewer PDF.")
    parser.add_argument("--output-base", default="cse_exams_reviewer_2026_extracted_questions")
    args = parser.parse_args()

    input_dir = Path(args.input)
    pdf_path = input_dir / "Done - Civil Service Exam Reviewer for 2026.pdf"
    answer_sheet = input_dir / "Sample Answer Sheet for Civil Service Exam.pdf"
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    rows, extraction_info = extract(pdf_path)
    status_counts = Counter(row["Status"] for row in rows)
    topic_counts = Counter(row["Topic Slug"] for row in rows)
    summary = {
        "input_dir": str(input_dir),
        "generated_at": date.today().isoformat(),
        "source_pdf": str(pdf_path),
        "answer_sheet_pdf": str(answer_sheet) if answer_sheet.exists() else "",
        "answer_sheet_status": "ignored_blank_answer_sheet" if answer_sheet.exists() else "not_found",
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(count for status, count in status_counts.items() if status != "Ready for Upload"),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": 0,
        "total_questions_with_images": 0,
        "status_counts": dict(status_counts),
        "topic_counts": dict(topic_counts),
        **extraction_info,
        "recommended_next_action": "Upload Ready for Upload rows only. Skipped complex passage, error-identification, paragraph-order, and visual sections need manual or section-specific extraction.",
    }
    paths = write_outputs(rows, summary, args.output_base)
    print(json.dumps({"rows": len(rows), "ready": summary["total_ready_for_upload"], "outputs": [str(p) for p in paths]}, indent=2))


if __name__ == "__main__":
    main()
