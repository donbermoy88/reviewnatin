#!/usr/bin/env python3
import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

import pdfplumber
from PIL import Image
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "tmp/pdfs/cse_math_reviewer.pdf"
TEXT_PATH = ROOT / "tmp/pdfs/cse_math_reviewer_text_by_page.txt"
RENDERED_DIR = ROOT / "tmp/pdfs/math_rendered"
OUT_DIR = ROOT / "output/pdf"
IMG_DIR = OUT_DIR / "images"
BASE = "cse_math_reviewer_extracted_questions"

FIELDS = [
    "No.",
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
    "Difficulty",
    "Has Image",
    "Image Reference",
    "Status",
    "Notes",
]


def normalize_space(value):
    return re.sub(r"\s+", " ", value or "").strip()


def compact(value):
    return re.sub(r"[^a-z0-9.-]+", "", (value or "").lower())


def write_text_dump():
    reader = PdfReader(str(PDF_PATH))
    with TEXT_PATH.open("w", encoding="utf-8") as f:
        for idx, page in enumerate(reader.pages, 1):
            f.write(f"===== PDF PAGE {idx} =====\n")
            f.write((page.extract_text() or "") + "\n")


def load_lines():
    if not TEXT_PATH.exists():
        write_text_dump()
    records = []
    page = None
    for raw in TEXT_PATH.read_text(encoding="utf-8").splitlines():
        m = re.match(r"===== PDF PAGE (\d+) =====", raw)
        if m:
            page = int(m.group(1))
            continue
        if page is None:
            continue
        records.append({"page": page, "text": raw.rstrip()})
    return records


def first_nonblank_page(block):
    for item in block:
        if item["text"].strip():
            return item["page"]
    return block[0]["page"] if block else ""


def split_first_fifty(lines):
    starts = []
    expected = 1
    end_limit = len(lines)
    for idx, item in enumerate(lines):
        text = item["text"].strip()
        if text.startswith("_") and re.search(r"\d+\.", text):
            end_limit = min(end_limit, idx)
            break
        if re.match(rf"^{expected}\.\s*", text):
            starts.append(idx)
            expected += 1
            if expected > 50:
                continue
    starts = [s for s in starts if s < end_limit]
    starts = starts[:50]
    blocks = []
    for pos, start in enumerate(starts):
        end = starts[pos + 1] if pos + 1 < len(starts) else end_limit
        blocks.append(lines[start:end])
    return blocks


def option_markers(text):
    markers = []
    pattern = re.compile(r"(?<![A-Za-z0-9])(?:\(([A-Ea-e])\)|([A-Ea-e])\.)\s*")
    for match in pattern.finditer(text):
        letter = (match.group(1) or match.group(2)).upper()
        if letter in "ABCDE":
            markers.append((match.start(), match.end(), letter))
    return markers


def parse_choices_from_text(text):
    markers = option_markers(text)
    if not markers:
        return normalize_space(text), {}

    qtext = normalize_space(text[: markers[0][0]])
    choices = {}
    for idx, (_, end, letter) in enumerate(markers):
        next_start = markers[idx + 1][0] if idx + 1 < len(markers) else len(text)
        choices[letter] = normalize_space(text[end:next_start])
    return qtext, choices


def extract_first_block(block, qnum):
    lines = [x["text"].strip() for x in block if x["text"].strip()]
    answer_idx = None
    answer_letter = ""
    answer_tail = ""
    answer_patterns = [
        re.compile(r"^Answer\s*:?\s*\(\s*([a-e])\s*\)\s*(.*)$", re.I),
    ]
    for idx, line in enumerate(lines):
        for pattern in answer_patterns:
            m = pattern.match(line)
            if m:
                answer_idx = idx
                answer_letter = m.group(1).upper()
                answer_tail = m.group(2).strip()
                break
        if answer_idx is not None:
            break

    if answer_idx is None:
        for idx, line in enumerate(lines):
            prior = " ".join(lines[:idx])
            m = re.match(r"^\(\s*([a-e])\s*\)\s*(.*)$", line, re.I)
            if m and re.search(r"\bE\.\s*", prior):
                answer_idx = idx
                answer_letter = m.group(1).upper()
                answer_tail = m.group(2).strip()
                break

    answer_value = ""
    if answer_idx is None:
        for idx, line in enumerate(lines):
            m = re.match(r"^Answer\s*:?\s*\(\s*([^)]+?)\s*\)\s*(.*)$", line, re.I)
            if m:
                answer_idx = idx
                answer_value = normalize_space(m.group(1))
                answer_tail = m.group(2).strip()
                break

    q_and_choices = " ".join(lines[:answer_idx] if answer_idx is not None else lines)
    q_and_choices = re.sub(r"^\d+\.\s*", "", q_and_choices)
    question, choices = parse_choices_from_text(q_and_choices)

    if not answer_letter and answer_value:
        for letter, choice in choices.items():
            if compact(choice) == compact(answer_value):
                answer_letter = letter
                break

    explanation_lines = []
    area = ""
    if answer_tail:
        explanation_lines.append(answer_tail)
    if answer_idx is not None:
        for line in lines[answer_idx + 1 :]:
            if line.startswith("Area:"):
                area = normalize_space(line.replace("Area:", "", 1))
                continue
            if line.startswith("Solution"):
                explanation_lines.append(line)
            elif explanation_lines:
                explanation_lines.append(line)
    explanation = normalize_space(" ".join(explanation_lines))

    return question, choices, answer_letter, answer_value, explanation, area


def find_underlined_question_groups(lines):
    starts = []
    for idx, item in enumerate(lines):
        m = re.match(r"^_+\s*(\d+)\.\s*(.*)", item["text"].strip())
        if m:
            starts.append((idx, int(m.group(1))))
    groups = []
    current = []
    for start in starts:
        if start[1] == 1 and current:
            groups.append(current)
            current = []
        current.append(start)
    if current:
        groups.append(current)
    return [g for g in groups if len(g) == 5]


def parse_underlined_question(lines, start_idx):
    q_lines = []
    choices = {}
    current = None
    idx = start_idx
    while idx < len(lines):
        text = lines[idx]["text"].strip()
        if idx != start_idx and re.match(r"^_+\s*\d+\.", text):
            break
        if idx != start_idx and text == "Solutions":
            break
        if idx != start_idx and re.match(r"^(?:[a-z]\.\s*)?1\.\s+", text) and choices.get("D"):
            break
        text = re.sub(r"^_+\s*\d+\.\s*", "", text)
        m = re.match(r"^([a-d])\.\s*(.*)$", text, re.I)
        if m:
            current = m.group(1).upper()
            choices[current] = m.group(2).strip()
        elif current:
            if not text or re.fullmatch(r"_+", text.replace(" ", "")):
                pass
            elif re.match(r"^([a-d])\.\s*", text, re.I):
                current = None
                continue
            else:
                choices[current] = normalize_space(choices[current] + " " + text)
        else:
            if text:
                q_lines.append(text)
        if choices.get("D"):
            nxt = lines[idx + 1]["text"].strip() if idx + 1 < len(lines) else ""
            if not nxt or nxt == "Solutions" or re.match(r"^_+\s*\d+\.", nxt) or re.match(r"^(?:[a-z]\.\s*)?1\.\s+", nxt):
                idx += 1
                break
        idx += 1
    return normalize_space(" ".join(q_lines)), choices, idx


def solution_starts(lines, start_idx, end_idx):
    starts = []
    expected = 1
    for idx in range(start_idx, end_idx):
        text = lines[idx]["text"].strip()
        if text == "Solutions":
            continue
        if re.match(rf"^(?:[a-z]\.\s*)?{expected}\. ?", text):
            starts.append(idx)
            expected += 1
            if expected > 5:
                break
    return starts


def extract_answer_from_solution(solution_text, choices):
    ans_lines = [line for line in solution_text.split("\n") if "*Ans" in line or "* Ans" in line]
    joined = normalize_space(solution_text.replace("\n", " "))
    answer_context = normalize_space(ans_lines[-1] if ans_lines else "")
    answer_prefix = re.sub(r"\* ?Ans\.?", "", answer_context, flags=re.I).strip()

    sorted_choices = sorted(choices.items(), key=lambda item: len(compact(item[1])), reverse=True)

    for letter, choice in sorted_choices:
        c = compact(choice)
        if c and c in compact(answer_prefix):
            return letter

    candidates = []
    for token in re.findall(r"\$?\s*[0-9][0-9,]*(?:\.[0-9]+)?\s*(?:M|m|%|days|weeks|miles|trips)?|[0-9]+/[0-9]+|[0-9]+y|[a-z]y", answer_prefix, flags=re.I):
        candidates.append(compact(token))
    for letter, choice in sorted_choices:
        c = compact(choice)
        if any(tok and tok in c for tok in candidates):
            return letter

    numeric_candidates = [re.sub(r"[^0-9.]+", "", tok) for tok in candidates]
    for letter, choice in sorted_choices:
        cnum = re.sub(r"[^0-9.]+", "", choice or "")
        if cnum and any(tok == cnum for tok in numeric_candidates):
            return letter

    for letter, choice in sorted_choices:
        if compact(choice) and compact(choice) in compact(joined):
            return letter
    return ""


def parse_underlined_sets(lines):
    groups = find_underlined_question_groups(lines)
    rows = []
    for group_index, group in enumerate(groups, 1):
        group_questions = []
        end_after_questions = group[-1][0]
        for idx, (start_idx, qnum) in enumerate(group):
            question, choices, end_idx = parse_underlined_question(lines, start_idx)
            group_questions.append((qnum, lines[start_idx]["page"], question, choices))
            end_after_questions = max(end_after_questions, end_idx)

        next_group_start = groups[group_index][0][0] if group_index < len(groups) else len(lines)
        sol_starts = solution_starts(lines, end_after_questions, next_group_start)
        for pos, (qnum, page, question, choices) in enumerate(group_questions):
            sol_text = ""
            answer_letter = ""
            if pos < len(sol_starts):
                sol_end = sol_starts[pos + 1] if pos + 1 < len(sol_starts) else next_group_start
                sol_lines = [lines[i]["text"].strip() for i in range(sol_starts[pos], sol_end)]
                sol_text = normalize_space(" ".join(x for x in sol_lines if x and x != "Solutions"))
                answer_letter = extract_answer_from_solution("\n".join(sol_lines), choices)
            rows.append(
                {
                    "local_group": group_index,
                    "local_q": qnum,
                    "page": page,
                    "question": question,
                    "choices": choices,
                    "answer_letter": answer_letter,
                    "explanation": sol_text,
                }
            )
    return rows


def crop_embedded_images():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    # These image objects are embedded in worked solution blocks, not standalone questions.
    page_to_q = {1: 2, 2: 5, 3: 9, 5: 17, 6: 24}
    refs = {}
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages:
            qnum = page_to_q.get(page.page_number)
            if not qnum or not page.images:
                continue
            src = RENDERED_DIR / f"page-{page.page_number:02d}.png"
            if not src.exists():
                continue
            with Image.open(src) as im:
                scale_x = im.width / page.width
                scale_y = im.height / page.height
                for image_index, img in enumerate(page.images, 1):
                    left = max(0, int((img["x0"] - 8) * scale_x))
                    top = max(0, int((img["top"] - 8) * scale_y))
                    right = min(im.width, int((img["x1"] + 8) * scale_x))
                    bottom = min(im.height, int((img["bottom"] + 8) * scale_y))
                    out = IMG_DIR / f"cse_math_reviewer_q{qnum:03d}_image{image_index}.png"
                    im.crop((left, top, right, bottom)).save(out)
                    refs[qnum] = str(out)
    return refs


def answer_text(letter, value, choices):
    if letter and choices.get(letter):
        return f"{letter}. {choices[letter]}"
    if value:
        return value
    return ""


def build_rows():
    lines = load_lines()
    image_refs = crop_embedded_images()
    rows = []

    for qnum, block in enumerate(split_first_fifty(lines), 1):
        question, choices, answer_letter, answer_value, explanation, area = extract_first_block(block, qnum)
        status = "Ready for Upload"
        notes = [f"Section: Math Reviewer main set; original question no. {qnum}."]
        if area:
            notes.append(f"PDF area: {area}.")
        if qnum in image_refs:
            notes.append("Embedded PDF image/formula is preserved in image reference.")
            status = "Needs Review"
        if not answer_text(answer_letter, answer_value, choices):
            status = "Needs Answer"
            notes.append("No clear answer marker found in PDF block.")
        if not explanation:
            notes.append("No solution text clearly extracted for this item.")
        rows.append(
            {
                "No.": len(rows) + 1,
                "Page": first_nonblank_page(block),
                "Question": question,
                "Choice A": choices.get("A", ""),
                "Choice B": choices.get("B", ""),
                "Choice C": choices.get("C", ""),
                "Choice D": choices.get("D", ""),
                "Choice E if there is": choices.get("E", ""),
                "Correct Answer": answer_text(answer_letter, answer_value, choices),
                "Explanation": explanation,
                "Exam Type": "Cannot Determine",
                "Subject Category": "Numerical Ability",
                "Difficulty": "Cannot Determine",
                "Has Image": "Yes" if qnum in image_refs else "No",
                "Image Reference": image_refs.get(qnum, ""),
                "Status": status,
                "Notes": " ".join(notes),
            }
        )

    for item in parse_underlined_sets(lines):
        choices = item["choices"]
        notes = [
            f"Section: Math Reviewer supplemental set {item['local_group']}; original question no. {item['local_q']}."
        ]
        status = "Ready for Upload" if item["answer_letter"] else "Needs Answer"
        if not item["answer_letter"]:
            notes.append("Answer inferred only from solution text was not clear enough to map to a choice.")
        rows.append(
            {
                "No.": len(rows) + 1,
                "Page": item["page"],
                "Question": item["question"],
                "Choice A": choices.get("A", ""),
                "Choice B": choices.get("B", ""),
                "Choice C": choices.get("C", ""),
                "Choice D": choices.get("D", ""),
                "Choice E if there is": choices.get("E", ""),
                "Correct Answer": answer_text(item["answer_letter"], "", choices),
                "Explanation": item["explanation"],
                "Exam Type": "Cannot Determine",
                "Subject Category": "Numerical Ability",
                "Difficulty": "Cannot Determine",
                "Has Image": "No",
                "Image Reference": "",
                "Status": status,
                "Notes": " ".join(notes),
            }
        )

    seen = {}
    for row in rows:
        fp = hashlib.sha1(
            compact(row["Question"] + " " + " ".join(row.get(f"Choice {letter}", "") for letter in "ABCD")).encode(
                "utf-8"
            )
        ).hexdigest()
        if fp in seen:
            row["Status"] = "Duplicate"
            row["Notes"] += f" Near/exact duplicate of row {seen[fp]}."
        else:
            seen[fp] = row["No."]
    return rows


def write_outputs(rows):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUT_DIR / f"{BASE}.csv"
    json_path = OUT_DIR / f"{BASE}.json"
    md_path = OUT_DIR / f"{BASE}.md"
    summary_path = OUT_DIR / f"{BASE}_summary.json"

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    def esc(value):
        return str(value or "").replace("|", "\\|").replace("\n", " ")

    with md_path.open("w", encoding="utf-8") as f:
        f.write("| " + " | ".join(FIELDS) + " |\n")
        f.write("|" + "|".join(["---"] * len(FIELDS)) + "|\n")
        for row in rows:
            f.write("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |\n")

    counts = Counter(row["Status"] for row in rows)
    summary = {
        "source_pdf": str(PDF_PATH),
        "total_questions_found": len(rows),
        "total_ready_for_upload": counts.get("Ready for Upload", 0),
        "total_needing_review": counts.get("Needs Review", 0),
        "total_without_answer_key": counts.get("Needs Answer", 0),
        "total_duplicates_detected": counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in rows if row["Has Image"] == "Yes"),
        "suggested_supabase_table_mapping": {
            "No.": "source_sequence",
            "Page": "source_page",
            "Question": "question_text",
            "Choice A": "choice_a",
            "Choice B": "choice_b",
            "Choice C": "choice_c",
            "Choice D": "choice_d",
            "Choice E if there is": "choice_e",
            "Correct Answer": "correct_answer",
            "Explanation": "explanation",
            "Exam Type": "exam_type",
            "Subject Category": "subject_category",
            "Difficulty": "difficulty",
            "Has Image": "has_image",
            "Image Reference": "image_reference",
            "Status": "status",
            "Notes": "notes",
        },
        "recommended_next_action": "Review rows marked Needs Review because their PDF blocks include embedded formula images before uploading to ReviewNatin.",
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main():
    rows = build_rows()
    print(json.dumps(write_outputs(rows), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
