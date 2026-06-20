#!/usr/bin/env python3
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import pdfplumber
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "tmp/pdfs/cse_prof_subpro_practice_test.pdf"
TEXT_PATH = ROOT / "tmp/pdfs/cse_combined_text_by_page.txt"
RENDERED_DIR = ROOT / "tmp/pdfs/combined_rendered"
OUT_DIR = ROOT / "output/pdf"
IMG_DIR = OUT_DIR / "images"
BASE = "cse_prof_subpro_practice_test_extracted_questions"


SECTIONS = [
    ("Word Problems and Operations", 75, "Word Problems", "WORD"),
    ("Data Sufficiency", 20, "Analytical Ability", "DATA"),
    ("Clerical Operations (Alphabetizing)", 20, "Alphabetizing", "ALPH"),
    ("Synonyms", 40, "Vocabulary", "SYN"),
    ("Antonyms", 40, "Vocabulary", "ANT"),
    ("Single-Word Analogy", 40, "Analytical Ability", "SWAN"),
    ("Double-Word Analogy", 40, "Analytical Ability", "DWAN"),
    ("Identifying Errors", 60, "English Grammar and Correct Usage", "ERR"),
    ("Paragraph Development", 10, "Paragraph Organization", "PARA"),
    ("Correct Usage", 40, "English Grammar and Correct Usage", "USE"),
    ("Reading Comprehension", 50, "Reading Comprehension", "READ"),
    ("Kasingkahulugan", 25, "Vocabulary", "KASI"),
    ("Kasalungat", 25, "Vocabulary", "KASA"),
    ("Kawikaan", 25, "Vocabulary", "KAWI"),
    ("Wastong Gamit", 30, "Verbal Ability", "WAST"),
    ("Pagkilala sa Mali", 25, "Other / Needs Review", "PMAL"),
    ("Pag-unawa sa Binasa", 30, "Reading Comprehension", "PAGU"),
    ("Pagtatalata", 10, "Paragraph Organization", "PTAL"),
    ("Constitution", 30, "Philippine Constitution", "CONS"),
    ("Inductive Reasoning", 50, "Analytical Ability", "IND"),
    ("Abstract Reasoning", 30, "Analytical Ability", "ABS"),
]

SECTION_NAMES = {s[0] for s in SECTIONS}
SECTION_BY_NAME = {s[0]: s for s in SECTIONS}
DATA_CHOICES = {
    "A": "if statement (1) ALONE is sufficient, but statement (2) alone is not sufficient.",
    "B": "if statement (2) ALONE is sufficient, but statement (1) alone is not sufficient.",
    "C": "if BOTH statements TOGETHER are sufficient, but NEITHER statement ALONE is sufficient.",
    "D": "if each statement ALONE is sufficient",
    "E": "if statement (1) and (2) TOGETHER are not sufficient.",
}

LOW_CONFIDENCE_SECTIONS = {
    "Identifying Errors",
    "Pagkilala sa Mali",
    "Reading Comprehension",
    "Pag-unawa sa Binasa",
    "Paragraph Development",
    "Pagtatalata",
    "Abstract Reasoning",
}

CONTEXT_DEPENDENT_SECTIONS = {
    "Reading Comprehension",
    "Pag-unawa sa Binasa",
    "Paragraph Development",
    "Pagtatalata",
}


def normalize_space(value):
    return re.sub(r"\s+", " ", value or "").strip()


def is_page_marker(line):
    return (
        line.startswith("===== PDF PAGE")
        or line.startswith("P a g e |")
        or line == "==== END ===="
        or not line.strip()
    )


def load_lines():
    pages = []
    current_page = None
    for raw in TEXT_PATH.read_text(encoding="utf-8").splitlines():
        m = re.match(r"===== PDF PAGE (\d+) =====", raw)
        if m:
            current_page = int(m.group(1))
            continue
        if raw == "==== END ====":
            break
        if current_page is None:
            continue
        pages.append({"page": current_page, "text": raw.rstrip()})
    return pages


def section_bounds(lines):
    starts = []
    for idx, item in enumerate(lines):
        if item["text"].strip() in SECTION_NAMES:
            starts.append((item["text"].strip(), idx))
    starts = [s for s in starts if s[1] > 35]
    starts.sort(key=lambda x: x[1])
    bounds = {}
    for i, (name, start) in enumerate(starts):
        end = starts[i + 1][1] if i + 1 < len(starts) else len(lines)
        bounds[name] = (start, end)
    return bounds


def split_questions(section_name, section_lines, expected_count):
    body = []
    for item in section_lines:
        txt = item["text"].strip()
        if is_page_marker(txt) or txt == section_name or txt in {"MATHEMATICS", "FILIPINO"}:
            continue
        body.append({"page": item["page"], "text": txt})

    q_indices = []
    expected = 1
    for idx, item in enumerate(body):
        if re.match(rf"^{expected}\.\s*(.*)$", item["text"]):
            q_indices.append(idx)
            expected += 1
            if expected > expected_count:
                break

    # Reading Comprehension has a worked example numbered 1 before the real set.
    if section_name == "Reading Comprehension" and (len(q_indices) < expected_count or "Example:" in " ".join(x["text"] for x in body[:12])):
        q_indices = []
        expected = 1
        start_at = 0
        for idx, item in enumerate(body):
            if item["text"].startswith("- Voltaire"):
                start_at = idx
                break
        for idx, item in enumerate(body[start_at:], start_at):
            if re.match(rf"^{expected}\.\s*(.*)$", item["text"]):
                q_indices.append(idx)
                expected += 1
                if expected > expected_count:
                    break

    blocks = []
    for pos, start in enumerate(q_indices):
        end = q_indices[pos + 1] if pos + 1 < len(q_indices) else len(body)
        blocks.append(body[start:end])
    return blocks


def extract_choices_and_question(section_name, block):
    if not block:
        return "", {}, "", ""

    lines = [x["text"] for x in block]
    first = re.sub(r"^\d+\.\s*", "", lines[0]).strip()
    question_lines = [first] if first else []
    choices = {}
    current = None
    choices_started = False
    skip_remaining_context = False
    answer_line = ""
    answer_explanation = ""

    expected_last = "E" if section_name in {"Data Sufficiency", "Identifying Errors", "Paragraph Development", "Pagkilala sa Mali", "Pagtatalata"} else "D"
    marker_only = re.compile(r"^([a-e]\.?\s*)+$", re.I)

    for line in lines[1:]:
        stripped = line.strip()
        if stripped.startswith("Answer:"):
            answer_line = stripped
            current = None
            continue
        if answer_line and section_name == "Data Sufficiency":
            answer_explanation = normalize_space(answer_explanation + " " + stripped)
            continue
        if skip_remaining_context and section_name in CONTEXT_DEPENDENT_SECTIONS:
            continue

        m = re.match(r"^([a-e])\.\s*(.*)$", stripped)
        if m:
            letter = m.group(1).upper()
            text = m.group(2).strip()
            current = letter
            choices_started = True
            choices[letter] = text
            continue
        n = re.match(r"^([1-5])\.\s*(.*)$", stripped)
        if section_name == "Clerical Operations (Alphabetizing)" and n:
            letter = {"1": "A", "2": "B", "3": "C", "4": "D", "5": "E"}[n.group(1)]
            text = f"{n.group(1)}. {n.group(2).strip()}"
            current = letter
            choices_started = True
            choices[letter] = text
            continue

        if current and current in choices:
            if marker_only.match(stripped):
                continue
            if section_name in {"Paragraph Development", "Pagtatalata"}:
                current = None
                continue
            # For context-heavy sections, do not let the next passage bleed into the last option.
            if current == expected_last and section_name in {"Reading Comprehension", "Pag-unawa sa Binasa", "Paragraph Development", "Pagtatalata"}:
                if re.match(r"^[A-Z]\.|^[IVX]+\.", stripped) or stripped.startswith(("-", "by ", "ni ")):
                    current = None
                    skip_remaining_context = True
                    continue
            choices[current] = normalize_space(choices[current] + " " + stripped)
        else:
            if choices_started and section_name in CONTEXT_DEPENDENT_SECTIONS:
                continue
            question_lines.append(stripped)

    if section_name == "Data Sufficiency":
        choices = DATA_CHOICES.copy()
        if answer_line:
            answer_explanation = normalize_space((answer_line + " " + answer_explanation).replace("Answer:", "").strip())

    if section_name in {"Identifying Errors", "Pagkilala sa Mali"}:
        choices = {}
        for letter in ["A", "B", "C", "D", "E"]:
            choices.setdefault(letter, letter)

    if section_name == "Abstract Reasoning":
        for letter in ["A", "B", "C", "D"]:
            choices.setdefault(letter, letter)
        # The diagrams contain the substantive prompt; keep the text prompt concise and image-bound.
        question_lines = [question_lines[0]] if question_lines else [""]

    return normalize_space(" ".join(question_lines)), choices, answer_line, answer_explanation


def word_color_is_red(word):
    color = word.get("non_stroking_color")
    if not isinstance(color, (list, tuple)) or len(color) != 3:
        return False
    return color[0] > 0.8 and color[1] < 0.2 and color[2] < 0.2


def collect_pdf_words():
    pages_words = []
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages:
            words = page.extract_words(extra_attrs=["fontname", "non_stroking_color"], use_text_flow=False)
            for word in words:
                word["page_number"] = page.page_number
            pages_words.extend(words)
    pages_words.sort(key=lambda w: (w["doctop"], w["x0"]))
    return pages_words


def find_heading_spans(words):
    by_page = defaultdict(list)
    for word in words:
        by_page[word["page_number"]].append(word)

    positions = {}
    for name, _, _, _ in SECTIONS:
        parts = name.split()
        if name == "Clerical Operations (Alphabetizing)":
            parts = ["Clerical", "Operations", "(Alphabetizing)"]
        for page_number, page_words in by_page.items():
            if page_number < 4:
                continue
            texts = [w["text"] for w in page_words]
            for i in range(len(texts) - len(parts) + 1):
                if texts[i : i + len(parts)] == parts:
                    positions[name] = page_words[i]["doctop"]
                    break
            if name in positions:
                break
    ordered = [(name, positions[name]) for name, *_ in SECTIONS if name in positions]
    spans = {}
    for i, (name, start) in enumerate(ordered):
        end = ordered[i + 1][1] if i + 1 < len(ordered) else float("inf")
        spans[name] = (start, end)
    return spans


def question_starts_for_section(words, section_name, expected_count, spans):
    start_doc, end_doc = spans[section_name]
    candidates = [
        w
        for w in words
        if start_doc <= w["doctop"] < end_doc
        and 55 <= w["x0"] <= 110
        and re.fullmatch(r"\d+\.", w["text"])
    ]
    candidates.sort(key=lambda w: (w["doctop"], w["x0"]))

    starts = []
    expected = 1
    for word in candidates:
        if word["text"] == f"{expected}.":
            starts.append(word)
            expected += 1
            if expected > expected_count:
                break

    if section_name == "Reading Comprehension":
        # Skip the worked example and restart after the Voltaire passage begins.
        one_candidates = [w for w in candidates if w["text"] == "1."]
        if len(one_candidates) > 1:
            starts = [one_candidates[1]]
            expected = 2
            for word in candidates:
                if word["doctop"] <= starts[0]["doctop"]:
                    continue
                if word["text"] == f"{expected}.":
                    starts.append(word)
                    expected += 1
                    if expected > expected_count:
                        break
    return starts


def styled_answers_and_boxes(words):
    spans = find_heading_spans(words)
    answers = {}
    boxes = {}
    for name, expected_count, _, _ in SECTIONS:
        starts = question_starts_for_section(words, name, expected_count, spans)
        start_doc, end_doc = spans[name]
        for idx, start in enumerate(starts, 1):
            q_end = starts[idx]["doctop"] if idx < len(starts) else end_doc
            block = [w for w in words if start["doctop"] <= w["doctop"] < q_end]
            red_labels = []
            for w in block:
                txt = w["text"].strip().lower()
                if word_color_is_red(w) and re.fullmatch(r"[a-e]\.?", txt):
                    red_labels.append(txt[0].upper())
                if word_color_is_red(w) and re.fullmatch(r"[1-5]\.?", txt):
                    red_labels.append({"1": "A", "2": "B", "3": "C", "4": "D", "5": "E"}[txt[0]])
            if not red_labels and name == "Data Sufficiency":
                red_text = " ".join(w["text"] for w in block if word_color_is_red(w))
                m = re.search(r"\b([a-e])\.", red_text, re.I)
                if m:
                    red_labels.append(m.group(1).upper())
            if red_labels:
                answers[(name, idx)] = Counter(red_labels).most_common(1)[0][0]
            boxes[(name, idx)] = {
                "page": start["page_number"],
                "start_doctop": start["doctop"],
                "end_doctop": q_end,
            }
    return answers, boxes


def rendered_page_path(page):
    candidates = [
        RENDERED_DIR / f"page-{page}.png",
        RENDERED_DIR / f"page-{page:03d}.png",
        RENDERED_DIR / f"page-{page:04d}.png",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    found = sorted(RENDERED_DIR.glob(f"*{page}*.png"))
    return found[0] if found else None


def crop_abstract_images(boxes):
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    refs = {}
    with pdfplumber.open(PDF_PATH) as pdf:
        for qnum in range(1, 31):
            box = boxes.get(("Abstract Reasoning", qnum))
            if not box:
                continue
            page_no = box["page"]
            page = pdf.pages[page_no - 1]
            page_top = page.initial_doctop
            top_pt = max(0, box["start_doctop"] - page_top - 8)
            bottom_pt = min(page.height, box["end_doctop"] - page_top - 8)
            if bottom_pt <= top_pt + 20:
                bottom_pt = min(page.height, top_pt + 180)
            src = rendered_page_path(page_no)
            if not src:
                continue
            with Image.open(src) as im:
                scale_x = im.width / page.width
                scale_y = im.height / page.height
                left = int(50 * scale_x)
                right = int((page.width - 45) * scale_x)
                top = max(0, int(top_pt * scale_y))
                bottom = min(im.height, int(bottom_pt * scale_y))
                crop = im.crop((left, top, right, bottom))
                out = IMG_DIR / f"cse_prof_subpro_practice_test_abstract_q{qnum:03d}.png"
                crop.save(out)
                refs[qnum] = str(out)
    return refs


def build_rows():
    lines = load_lines()
    bounds = section_bounds(lines)
    words = collect_pdf_words()
    styled_answers, boxes = styled_answers_and_boxes(words)
    image_refs = crop_abstract_images(boxes)

    rows = []
    global_no = 1
    seen = {}
    duplicates = 0
    warnings = []

    for section_name, expected_count, category, code in SECTIONS:
        if section_name not in bounds:
            warnings.append(f"Missing section: {section_name}")
            continue
        start, end = bounds[section_name]
        blocks = split_questions(section_name, lines[start:end], expected_count)
        if len(blocks) != expected_count:
            warnings.append(f"{section_name}: expected {expected_count}, parsed {len(blocks)}")

        for qnum, block in enumerate(blocks, 1):
            page = block[0]["page"] if block else ""
            question, choices, answer_line, explanation = extract_choices_and_question(section_name, block)
            if section_name == "Abstract Reasoning" and not question:
                question = f"Diagram-based item {qnum}. See image reference."
            if section_name == "Abstract Reasoning":
                choices = {"A": "A", "B": "B", "C": "C", "D": "D"}
            answer_letter = styled_answers.get((section_name, qnum))
            if section_name == "Data Sufficiency" and answer_line:
                m = re.search(r"Answer:\s*([a-e])\.", answer_line, re.I)
                if m:
                    answer_letter = m.group(1).upper()

            correct = ""
            if answer_letter:
                choice_text = choices.get(answer_letter, "").strip()
                correct = f"{answer_letter}. {choice_text}" if choice_text else answer_letter

            has_image = "Yes" if section_name == "Abstract Reasoning" else "No"
            image_ref = image_refs.get(qnum, "") if section_name == "Abstract Reasoning" else ""
            status = "Ready for Upload"
            notes = [f"Section: {section_name}; original question no. {qnum}."]
            if section_name in LOW_CONFIDENCE_SECTIONS:
                status = "Needs Review"
                notes.append("Context or visual/label alignment should be manually checked before upload.")
            if not correct:
                status = "Needs Answer"
                notes.append("No red/bold answer key detected in parsed question block.")
            if not question:
                status = "Incomplete"
                notes.append("Question text was empty after extraction.")
            if section_name == "Abstract Reasoning" and not image_ref:
                status = "Needs Review"
                notes.append("Image crop was not generated.")

            fingerprint_source = question + " " + " ".join(choices.get(k, "") for k in "ABCDE")
            if section_name == "Abstract Reasoning":
                fingerprint_source += f" {section_name} {qnum} {image_ref}"
            fingerprint = hashlib.sha1(normalize_space(fingerprint_source).lower().encode("utf-8")).hexdigest()
            if section_name not in CONTEXT_DEPENDENT_SECTIONS and fingerprint in seen:
                duplicates += 1
                status = "Duplicate"
                notes.append(f"Near/exact duplicate of row {seen[fingerprint]}.")
            else:
                seen[fingerprint] = global_no

            rows.append(
                {
                    "No.": global_no,
                    "Page": page,
                    "Question": question,
                    "Choice A": choices.get("A", ""),
                    "Choice B": choices.get("B", ""),
                    "Choice C": choices.get("C", ""),
                    "Choice D": choices.get("D", ""),
                    "Choice E if there is": choices.get("E", ""),
                    "Correct Answer": correct,
                    "Explanation": explanation if section_name == "Data Sufficiency" else "",
                    "Exam Type": "Both",
                    "Subject Category": category,
                    "Difficulty": "Cannot Determine",
                    "Has Image": has_image,
                    "Image Reference": image_ref,
                    "Status": status,
                    "Notes": " ".join(notes),
                }
            )
            global_no += 1
    return rows, warnings, duplicates


def write_outputs(rows, warnings):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fields = [
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
    csv_path = OUT_DIR / f"{BASE}.csv"
    json_path = OUT_DIR / f"{BASE}.json"
    md_path = OUT_DIR / f"{BASE}.md"
    summary_path = OUT_DIR / f"{BASE}_summary.json"

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    def esc(value):
        return str(value or "").replace("|", "\\|").replace("\n", " ")

    with md_path.open("w", encoding="utf-8") as f:
        f.write("| " + " | ".join(fields) + " |\n")
        f.write("|" + "|".join(["---"] * len(fields)) + "|\n")
        for row in rows:
            f.write("| " + " | ".join(esc(row.get(field, "")) for field in fields) + " |\n")

    counts = Counter(row["Status"] for row in rows)
    summary = {
        "source_pdf": str(PDF_PATH),
        "total_questions_found": len(rows),
        "total_ready_for_upload": counts.get("Ready for Upload", 0),
        "total_needing_review": counts.get("Needs Review", 0),
        "total_without_answer_key": counts.get("Needs Answer", 0),
        "total_duplicates_detected": counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in rows if row["Has Image"] == "Yes"),
        "warnings": warnings,
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
        "recommended_next_action": "Review rows marked Needs Review, especially context-heavy reading/paragraph sections and all abstract reasoning image crops, before uploading to ReviewNatin.",
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return csv_path, json_path, md_path, summary_path, summary


def main():
    rows, warnings, _ = build_rows()
    outputs = write_outputs(rows, warnings)
    print(json.dumps(outputs[-1], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
