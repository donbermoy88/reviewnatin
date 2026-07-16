#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path("/Users/lyndon/All reviewers/-LET REVIEWER 2026/C. MAJOR SUBJECTS/H. VALUES EDUCATION")
OUT_DIR = ROOT / "output/pdf"
BASE = "let_values_education_qa_2026_extracted_questions"

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
KEY_RE = re.compile(r"\bAnswer\s+Keys?:?|\bANSWER\s+KEY:?", re.I)


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


def normalize_answer(value):
    text = normalize_space(value).lower()
    text = text.replace("&", " and ")
    text = text.replace("/", " ")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def answer_tokens(value):
    return [token for token in normalize_answer(value).split() if len(token) > 1]


def score_answer_phrase(phrase, choice):
    phrase_norm = normalize_answer(phrase)
    choice_norm = normalize_answer(choice)
    if not phrase_norm or not choice_norm:
        return 0.0
    if phrase_norm == choice_norm:
        return 1.0
    if phrase_norm in choice_norm:
        return 0.95
    if choice_norm in phrase_norm:
        return 0.9
    phrase_tokens = set(answer_tokens(phrase))
    choice_tokens = set(answer_tokens(choice))
    if not phrase_tokens or not choice_tokens:
        return 0.0
    coverage = len(phrase_tokens & choice_tokens) / len(phrase_tokens)
    precision = len(phrase_tokens & choice_tokens) / len(choice_tokens)
    return (coverage * 0.75) + (precision * 0.25)


def answer_letter_from_text(value, choices):
    phrases = [normalize_space(part) for part in re.split(r"\s+[–—-]\s+", value) if normalize_space(part)]
    phrases.append(normalize_space(value))
    best = []
    for letter, choice in choices.items():
        score = max(score_answer_phrase(phrase, choice) for phrase in phrases)
        best.append((score, letter))
    best.sort(reverse=True)
    if not best or best[0][0] < 0.55:
        return None
    if best[0][0] >= 0.99:
        return best[0][1]
    if len(best) > 1 and best[0][0] - best[1][0] < 0.15:
        return None
    return best[0][1]


def pdf_text(path):
    return run(["pdftotext", "-raw", str(path), "-"])


def page_lookup(path):
    info = run(["pdfinfo", str(path)])
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    pages = int(match.group(1)) if match else 0
    lookup = {}
    for page in range(1, pages + 1):
        text = run(["pdftotext", "-raw", "-f", str(page), "-l", str(page), str(path), "-"])
        key_match = KEY_RE.search(text)
        if key_match:
            text = text[: key_match.start()]
        for qmatch in QUESTION_RE.finditer(text):
            lookup.setdefault(int(qmatch.group(1)), str(page))
    return lookup


def split_question_area(text):
    key_match = KEY_RE.search(text)
    if not key_match:
        return text, ""
    return text[: key_match.start()], text[key_match.end():]


def split_items(text):
    markers = [(int(m.group(1)), m.start(), m.end()) for m in QUESTION_RE.finditer(text)]
    items = []
    for index, (number, start, end_marker) in enumerate(markers):
        end = markers[index + 1][1] if index + 1 < len(markers) else len(text)
        if 1 <= number <= 200:
            items.append((number, text[end_marker:end]))
    return items


def clean_choice(value):
    text = normalize_space(value)
    text = re.sub(r"\bView Answer:.*$", "", text, flags=re.I).strip()
    text = re.sub(r"\bAnswer:\s*(?:Option\s*)?[A-D]\b.*$", "", text, flags=re.I).strip()
    return text


def split_question_choices(block):
    markers = list(CHOICE_RE.finditer(block))
    if not markers:
        return normalize_space(block), {}
    question = normalize_space(block[: markers[0].start()])
    choices = {}
    for index, match in enumerate(markers):
        end = markers[index + 1].start() if index + 1 < len(markers) else len(block)
        choices[match.group(1).upper()] = clean_choice(block[match.end():end])
    return question, choices


def extract_inline_answers(text):
    answers = {}
    for number, letter in re.findall(
        r"(?ms)^\s*([1-9]\d{0,2})\.\s+.*?Answer:\s*Option\s*([A-D])\b",
        text,
        flags=re.I,
    ):
        answers[int(number)] = letter.upper()
    return answers


def extract_trailing_answers(key_text, choices_by_number):
    answers = {}
    for number, payload in re.findall(r"(?m)^\s*([1-9]\d{0,2})\.\s*([^\n\r\f]+)", key_text):
        original_no = int(number)
        value = normalize_space(payload)
        letter_match = re.match(r"([A-D])\b", value, flags=re.I)
        if letter_match:
            answers[original_no] = letter_match.group(1).upper()
            continue

        letter = answer_letter_from_text(value, choices_by_number.get(original_no, {}))
        if letter:
            answers[original_no] = letter
    return answers


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
    question_text, key_text = split_question_area(text)
    inline_answers = extract_inline_answers(text)
    if not key_text and not inline_answers:
        return [], {"source_path": str(path), "status": "no_answer_key", "text_chars": len(text)}, start_no

    pages = page_lookup(path)
    parsed_items = []
    choices_by_number = {}
    for original_no, block in split_items(question_text):
        question, choices = split_question_choices(block)
        parsed_items.append((original_no, question, choices))
        choices_by_number[original_no] = choices

    trailing_answers = extract_trailing_answers(key_text, choices_by_number) if key_text else {}
    answers = {**trailing_answers, **inline_answers}

    rows = []
    next_no = start_no
    for original_no, question, choices in parsed_items:
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
            "Explanation": f"Correct answer sourced from the PDF answer key: {answer}." if answer else "",
            "LET Exam Type": "LET Secondary",
            "Subject Area": "Values Education",
            "Topic": "Values Education",
            "Difficulty": "3",
            "Has Image": "No",
            "Duplicate Of": "",
            "Confidence": "0.96" if answer else "0.70",
            "Status": "",
            "Notes": "LET Secondary Values Education Q&A. Correct answer sourced from PDF answer key.",
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
        "answer_style": "inline" if inline_answers and not key_text else "trailing_or_mixed",
    }, next_no


def mark_duplicates(rows):
    seen = {}
    for row in rows:
        key = re.sub(r"\W+", "", row["Question"].lower())
        if not key:
            continue
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
    lines = ["# LET Values Education Q&A 2026 Extraction", ""]
    for row in rows:
        question = row["Question"] or "(missing question text)"
        lines.append(f"## {row['No.']}. {question}")
        for letter in "ABCD":
            choice = row[f"Choice {letter}"]
            lines.append(f"- {letter}. {choice}" if choice else f"- {letter}.")
        lines.append(f"- Answer: {row['Correct Answer']}" if row["Correct Answer"] else "- Answer:")
        lines.append("")
    md_path.write_text("\n".join(lines), encoding="utf-8")
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    rows = []
    sources = []
    next_no = 1
    for path in sorted(SOURCE_DIR.rglob("*.pdf")):
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
