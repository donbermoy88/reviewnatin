#!/usr/bin/env python3
import argparse
import csv
import json
import re
from collections import Counter
from datetime import date
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"

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


def normalize_space(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def clean_text(text):
    text = text.replace("\x00", " ")
    text = re.sub(r"\(cid:\d+\)", " ", text)
    text = text.replace("–QUESTIONS–", " ").replace("-QUESTIONS-", " ")
    text = text.replace("–ANSWERS–", " ").replace("-ANSWERS-", " ")
    return normalize_space(text)


def column_text(page, side):
    width = page.width
    height = page.height
    margin = 24
    gutter = 8
    mid = width / 2
    if side == "left":
        bbox = (0, margin, mid + gutter, height - margin)
    else:
        bbox = (mid - gutter, margin, width, height - margin)
    raw = page.crop(bbox).extract_text(x_tolerance=2, y_tolerance=3) or ""
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if re.fullmatch(r"\d{1,3}", line):
            continue
        lines.append(line)
    return clean_text("\n".join(lines))


def answer_pages_start(pdf):
    for idx, page in enumerate(pdf.pages):
        text = clean_text(page.extract_text() or "")
        if "ANSWERS" in text.upper() and re.search(r"\b1\.\s*[a-e]\.", text, flags=re.I):
            return idx
    return len(pdf.pages)


def extract_answers(pdf, start_idx):
    answer_text_parts = []
    for page in pdf.pages[start_idx:]:
        answer_text_parts.append(column_text(page, "left"))
        answer_text_parts.append(column_text(page, "right"))
    text = "\n".join(answer_text_parts)
    answers = {}
    answer_markers = list(re.finditer(r"(?<!\d)(\d{1,3})\.\s*([a-e])\.\s*", text, flags=re.I))
    for idx, match in enumerate(answer_markers):
        qnum = int(match.group(1))
        if 1 <= qnum <= 501 and qnum not in answers:
            end = answer_markers[idx + 1].start() if idx + 1 < len(answer_markers) else len(text)
            explanation = clean_answer_explanation(text[match.end():end])
            answers[qnum] = {
                "answer": match.group(2).upper(),
                "explanation": explanation,
            }
    return answers


def clean_answer_explanation(text):
    text = re.sub(r"\(cid:\d+\)\s*Set\s+\d+\s+\(Page\s+\d+\)", " ", text, flags=re.I)
    text = re.sub(r"\bSet\s+\d+\s+\(Page\s+\d+\)", " ", text, flags=re.I)
    text = re.sub(r"Here.s a quick illustration.*", " ", text, flags=re.I)
    text = clean_text(text)
    return text


def split_question_blocks(text):
    marker_re = re.compile(r"(?<!\d)(\d{1,3})\.\s+")
    markers = list(marker_re.finditer(text))
    blocks = []
    for idx, marker in enumerate(markers):
        qnum = int(marker.group(1))
        if not 1 <= qnum <= 501:
            continue
        end = markers[idx + 1].start() if idx + 1 < len(markers) else len(text)
        body = normalize_space(text[marker.end():end])
        blocks.append((qnum, body))
    return blocks


def parse_choices(body):
    markers = list(re.finditer(r"(?<![A-Za-z0-9])([abcde])\.\s+", body))
    if len(markers) < 4:
        return "", {}
    question = normalize_space(body[: markers[0].start()])
    choices = {}
    for idx, marker in enumerate(markers):
        label = marker.group(1).upper()
        end = markers[idx + 1].start() if idx + 1 < len(markers) else len(body)
        value = normalize_space(body[marker.end():end])
        if label not in choices:
            choices[label] = value
    wanted = ["A", "B", "C", "D"] + (["E"] if choices.get("E") else [])
    return question, {letter: choices.get(letter, "") for letter in wanted if choices.get(letter)}


def likely_visual_or_bad(question, choices):
    if len(question) < 18:
        return True
    if not all(choices.get(letter) for letter in ["A", "B", "C", "D"]):
        return True
    normalized = [normalize_space(value).lower() for value in choices.values()]
    if len(set(normalized)) != len(normalized):
        return True
    short = [item for item in normalized if len(item) <= 1]
    if short and len(short) >= 2:
        return True
    if re.fullmatch(r"[a-e](?: [a-e])+", question.lower()):
        return True
    return False


def classify_topic(qnum, question):
    text = question.lower()
    if 1 <= qnum <= 75:
        return "number-series"
    if 76 <= qnum <= 87:
        return "series-completion"
    if 182 <= qnum <= 201 or 276 <= qnum <= 296:
        return "word-association"
    if any(token in text for token in [" : ", "analogy", "same relationship", "pair of words", " is to "]):
        return "word-association"
    return "logic"


def subject_category(topic):
    if topic == "number-series":
        return "Numerical Ability"
    if topic == "series-completion":
        return "Abstract Reasoning"
    return "Analytical Ability"


def extract(pdf_path):
    rows = []
    rejected = []
    seen = set()
    with pdfplumber.open(pdf_path) as pdf:
        ans_start = answer_pages_start(pdf)
        answers = extract_answers(pdf, ans_start)
        for page_idx, page in enumerate(pdf.pages[:ans_start], start=1):
            if page_idx <= 10:
                continue
            for side in ["left", "right"]:
                text = column_text(page, side)
                if not text or "Set " not in text and not re.search(r"\b\d{1,3}\.\s+", text):
                    continue
                for qnum, body in split_question_blocks(text):
                    key = (qnum, page_idx)
                    if key in seen:
                        continue
                    seen.add(key)
                    question, choices = parse_choices(body)
                    answer_info = answers.get(qnum, {})
                    answer = answer_info.get("answer", "")
                    status = "Ready for Upload"
                    notes = []
                    if likely_visual_or_bad(question, choices):
                        status = "Needs Review"
                        notes.append("Visual, symbolic, or malformed text item.")
                    if not answer or answer not in choices:
                        status = "Needs Answer"
                        notes.append("Answer key was missing or did not match parsed choices.")
                    topic = classify_topic(qnum, question)
                    row = {
                        "No.": len(rows) + 1,
                        "Source PDF": pdf_path.name,
                        "Source Path": str(pdf_path),
                        "Original No.": str(qnum),
                        "Page": str(page_idx),
                        "Question": question,
                        "Choice A": choices.get("A", ""),
                        "Choice B": choices.get("B", ""),
                        "Choice C": choices.get("C", ""),
                        "Choice D": choices.get("D", ""),
                        "Choice E if there is": choices.get("E", ""),
                        "Correct Answer": answer,
                        "Explanation": answer_info.get("explanation", "") or (f"Correct answer is provided in the source answer key: {answer}." if answer else ""),
                        "Exam Type": "CSE Professional",
                        "Subject Category": subject_category(topic),
                        "Topic Slug": topic,
                        "Difficulty": 3,
                        "Has Image": "No",
                        "Image Reference": "",
                        "Image Path": "",
                        "Status": status,
                        "Notes": normalize_space("Logic 2026. " + " ".join(notes)),
                    }
                    rows.append(row)
                    if status != "Ready for Upload":
                        rejected.append({"original_no": qnum, "page": page_idx, "status": status, "notes": row["Notes"]})
    return rows, rejected


def write_outputs(rows, rejected, input_dir, base):
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
    counts = Counter(row["Status"] for row in rows)
    topic_counts = Counter(row["Topic Slug"] for row in rows if row["Status"] == "Ready for Upload")
    summary = {
        "input_dir": str(input_dir),
        "generated_at": date.today().isoformat(),
        "total_questions_found": len(rows),
        "total_ready_for_upload": counts.get("Ready for Upload", 0),
        "total_needing_review": sum(count for status, count in counts.items() if status != "Ready for Upload"),
        "total_without_answer_key": counts.get("Needs Answer", 0),
        "status_counts": dict(counts),
        "ready_topic_counts": dict(topic_counts),
        "rejected_samples": rejected[:100],
        "outputs": {
            "csv": str(csv_path),
            "json": str(json_path),
            "md": str(md_path),
            "summary": str(summary_path),
        },
        "recommended_next_action": "Upload Ready for Upload rows only. Visual/symbolic items need separate image extraction.",
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main():
    parser = argparse.ArgumentParser(description="Extract text-based CSE Logic 2026 questions.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-base", default="cse_logic_2026_extracted_questions")
    args = parser.parse_args()
    input_dir = Path(args.input)
    pdfs = sorted(input_dir.glob("*.pdf"))
    if len(pdfs) != 1:
        raise RuntimeError(f"Expected one PDF in {input_dir}, found {len(pdfs)}")
    rows, rejected = extract(pdfs[0])
    summary = write_outputs(rows, rejected, input_dir, args.output_base)
    print(json.dumps({"rows": len(rows), "ready": summary["total_ready_for_upload"], "summary": summary["outputs"]["summary"]}, indent=2))


if __name__ == "__main__":
    main()
