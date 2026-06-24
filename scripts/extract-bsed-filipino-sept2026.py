#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files/L. BSED - Filipino-")
OUT_DIR = ROOT / "output/pdf"
IMAGE_DIR = OUT_DIR / "images/bsed_filipino_sept2026"
TMP_RENDER_DIR = ROOT / "tmp/pdfs/bsed_filipino_sept2026_rendered"
BASE = "bsed_filipino_sept2026_extracted_questions"

FIELDS = [
    "No.", "Original No.", "Page", "Source PDF", "Source Path", "Question",
    "Passage Reference", "Question Image Reference",
    "Choice A", "Choice A Image Reference", "Choice B", "Choice B Image Reference",
    "Choice C", "Choice C Image Reference", "Choice D", "Choice D Image Reference",
    "Choice E", "Choice E Image Reference", "Correct Answer", "Explanation",
    "LET Exam Type", "Subject Area", "Topic", "Difficulty", "Has Image",
    "Duplicate Of", "Confidence", "Status", "Notes",
]

QUESTION_RE = re.compile(r"(?m)^\s*([1-9]\d{0,2})\s*\.\s*(?=\S)")
CHOICE_RE = re.compile(r"(?<![A-Za-z0-9])([A-Ea-e])\.\s*")

VISUAL_MAP = {
    ("BSED Filipino Part1.pdf", 17): {
        "page": 3,
        "ref": "question_image_page_03_q17",
        "crop": (0.055, 0.505, 0.43, 0.76),
        "note": "Table of language learning styles and teaching strategies.",
    },
    ("BSED Filipino Part2.pdf", 3): {
        "page": 1,
        "ref": "question_image_page_01_q03",
        "crop": (0.06, 0.565, 0.74, 0.72),
        "note": "Table of Asian literary works, country, author, and translator.",
    },
    ("BSED Filipino Part2.pdf", 97): {
        "page": 12,
        "ref": "question_image_page_12_q97",
        "crop": (0.06, 0.805, 0.75, 0.985),
        "note": "Comparison table of balita, editoryal, and lathalain.",
    },
    ("BSED Filipino Part3.pdf", 9): {
        "page": 2,
        "ref": "question_image_page_02_q09",
        "crop": (0.07, 0.54, 0.75, 0.73),
        "note": "Dialogue box used as stimulus for listening-teaching question.",
    },
    ("BSED Filipino Part3.pdf", 83): {
        "page": 16,
        "ref": "question_image_page_16_q83",
        "crop": (0.06, 0.13, 0.96, 0.34),
        "note": "Table of survey items and percentages.",
    },
    ("BSED Filipino Part3.pdf", 94): {
        "page": 18,
        "ref": "question_image_page_18_q94",
        "crop": (0.07, 0.54, 0.96, 0.69),
        "note": "Table of learning styles and instructional materials.",
    },
}

ALLOW_NO_CHOICE_PREV = {
    ("BSED Filipino Part3.pdf", 19),
}


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
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "ñ": "n",
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return re.sub(r"[^a-z0-9]+", "", text)


def words(value):
    stop = {
        "ang", "mga", "ito", "ayos", "alin", "ano", "sino", "kung", "para",
        "dahil", "batay", "wika", "filipino", "panitikan", "pagtuturo",
        "pagkatuto", "isang", "nasa", "mula", "bilang", "tungkol", "may",
        "the", "and", "for", "with",
    }
    return {w for w in re.findall(r"[a-z0-9]+", normalize_space(value).lower()) if len(w) > 2 and w not in stop}


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
        if re.fullmatch(r"SECONDARY EDUCATION\s*-?\s*FILIPINO", stripped, re.I):
            continue
        if re.fullmatch(r"LET Reviewer Filipino 2026", stripped, re.I):
            continue
        if stripped.startswith("This file was submitted to:"):
            continue
        cleaned.append(stripped)
    return "\n".join(cleaned)


def pdf_text(path):
    text = clean_pdf_text(run(["pdftotext", "-raw", str(path), "-"]))
    if path.name == "BSED Filipino Part7.pdf":
        text = re.sub(
            r"(B\.\s*b\s+D\.\s*ng)\s+nagsasabing ang wika ay nailikha bunga\s+ng masidhing damdamin ng tao\?",
            r"\1\n64. Anong teorya ng wika ang nagsasabing ang wika ay nailikha bunga ng masidhing damdamin ng tao?",
            text,
        )
        text = re.sub(
            r"\nngsasabing ang wika ay nailikha bunga\s+ng masidhing damdamin ng tao\?",
            "\n64. Anong teorya ng wika ang nagsasabing ang wika ay nailikha bunga ng masidhing damdamin ng tao?",
            text,
        )
    return text


def page_texts(path):
    info = run(["pdfinfo", str(path)])
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    pages = int(match.group(1)) if match else 0
    texts = [clean_pdf_text(run(["pdftotext", "-raw", "-f", str(i), "-l", str(i), str(path), "-"])) for i in range(1, pages + 1)]
    if path.name == "BSED Filipino Part7.pdf":
        texts = [
            re.sub(
                r"(B\.\s*b\s+D\.\s*ng)\s+nagsasabing ang wika ay nailikha bunga\s+ng masidhing damdamin ng tao\?",
                r"\1\n64. Anong teorya ng wika ang nagsasabing ang wika ay nailikha bunga ng masidhing damdamin ng tao?",
                text,
            )
            for text in texts
        ]
        texts = [
            re.sub(
                r"\nngsasabing ang wika ay nailikha bunga\s+ng masidhing damdamin ng tao\?",
                "\n64. Anong teorya ng wika ang nagsasabing ang wika ay nailikha bunga ng masidhing damdamin ng tao?",
                text,
            )
            for text in texts
        ]
    return texts


def answer_key_start(text):
    match = re.search(r"\bAnwer\s+Key\s*:|\bAnswer\s+Keys?\s*:?", text, re.I)
    if not match:
        raise RuntimeError("No answer key marker found")
    return match.start(), match.end()


def split_numbered_items(text, source_pdf=""):
    markers = [(int(m.group(1)), m.start(), m.end()) for m in QUESTION_RE.finditer(text)]
    if not markers:
        return []

    selected = []
    first = next((marker for marker in markers if marker[0] == 1), None)
    if not first:
        return []
    selected.append(first)
    expected = 2
    max_qnum = max(qnum for qnum, _start, _end in markers)

    while expected <= max_qnum:
        found = None
        prev_qnum, prev_start, prev_end = selected[-1]
        for qnum, start, end in markers:
            if start <= prev_start:
                continue
            if qnum == expected:
                previous_block = text[prev_end:start]
                choice_labels = {m.group(1).upper() for m in CHOICE_RE.finditer(previous_block)}
                previous_is_visual = (source_pdf, prev_qnum) in VISUAL_MAP
                previous_allowed_without_choices = (source_pdf, prev_qnum) in ALLOW_NO_CHOICE_PREV
                if len(choice_labels & {"A", "B", "C", "D"}) < 2 and not previous_is_visual and not previous_allowed_without_choices:
                    continue
                found = (qnum, start, end)
                break
        if found:
            selected.append(found)
        expected += 1

    items = []
    for index, (qnum, _start, marker_end) in enumerate(selected):
        end = selected[index + 1][1] if index + 1 < len(selected) else len(text)
        items.append((qnum, text[marker_end:end]))
    return items


def split_numbered_answer_items(text):
    markers = [(int(m.group(1)), m.start(), m.end()) for m in QUESTION_RE.finditer(text)]
    items = []
    seen = set()
    for index, (qnum, _start, marker_end) in enumerate(markers):
        if qnum in seen:
            continue
        end = markers[index + 1][1] if index + 1 < len(markers) else len(text)
        items.append((qnum, text[marker_end:end]))
        seen.add(qnum)
    return items


def parse_answer_key(key_text):
    answers = {}
    for qnum, block in split_numbered_answer_items(key_text):
        raw = normalize_space(block)
        if not raw:
            continue
        if re.fullmatch(r"[A-Ea-e]", raw):
            answers[qnum] = {"answer_text": raw.upper(), "rationale": ""}
            continue
        match = re.match(r"^([A-Ea-e])\b[.\s-]*(.*)$", raw)
        if match:
            answers[qnum] = {"answer_text": match.group(1).upper(), "rationale": normalize_space(match.group(2))}
            continue
        parts = re.split(r"\s+[–—-]\s+", raw, maxsplit=1)
        answers[qnum] = {
            "answer_text": normalize_space(parts[0]),
            "rationale": normalize_space(parts[1]) if len(parts) > 1 else "",
        }
    return answers


def split_question_choices(block):
    line_markers = list(re.finditer(r"(?m)^\s*([A-Ea-e])\.\s*", block))
    duplicate_labels = []
    if len({m.group(1).upper() for m in line_markers}) >= 4:
        question = normalize_space(block[: line_markers[0].start()])
        choices = {}
        for index, match in enumerate(line_markers):
            label = match.group(1).upper()
            if label in choices:
                duplicate_labels.append(label)
            end = line_markers[index + 1].start() if index + 1 < len(line_markers) else len(block)
            choices.setdefault(label, normalize_space(block[match.end():end]))
        return question, choices, duplicate_labels

    block = normalize_space(block)
    markers = list(CHOICE_RE.finditer(block))
    if not markers:
        return block, {}, []

    question = normalize_space(block[: markers[0].start()])
    choices = {}
    for index, match in enumerate(markers):
        label = match.group(1).upper()
        if label in choices:
            duplicate_labels.append(label)
        end = markers[index + 1].start() if index + 1 < len(markers) else len(block)
        choices.setdefault(label, normalize_space(block[match.end():end]))
    return question, choices, duplicate_labels


def answer_letter(answer_text, rationale, choices):
    answer = re.sub(r"^[.\s]+", "", normalize_space(answer_text))
    if re.fullmatch(r"[A-E]", answer, re.I):
        return answer.upper()

    answer_key = normalize_key(answer)
    combined_words = words(f"{answer} {rationale}")
    best = ("", 0)
    for letter, choice in choices.items():
        choice_key = normalize_key(choice)
        if answer_key and (choice_key == answer_key or choice_key.startswith(answer_key) or answer_key.startswith(choice_key)):
            return letter
        overlap = len(words(choice) & combined_words)
        if overlap > best[1]:
            best = (letter, overlap)
    if best[1] >= 1:
        return best[0]
    return ""


def infer_topic(question):
    text = normalize_space(question).lower()
    if any(x in text for x in ["pananaliksik", "baryabol", "sarbey", "intervyu", "literature review", "findings", "theoretical framework", "quantitative", "qualitative", "triangulation"]):
        return "Pananaliksik"
    if any(x in text for x in ["pagtuturo", "pagkatuto", "guro", "mag-aaral", "rubric", "assessment", "pagsusulit", "scaffolding", "constructivism", "task-based", "banghay-aralin", "kagamitan"]):
        return "Pagtuturo ng Filipino"
    if any(x in text for x in ["wika", "komunikatibo", "ponema", "morpema", "sintaksis", "morpolohiya", "ponolohiya", "balarila", "pang-abay", "pang-uri", "pandiwa", "panlapi", "gitling", "code-switching", "register", "sosyolingguwistika"]):
        return "Wika at Gramatika"
    if any(x in text for x in ["akda", "panitikan", "nobela", "tula", "epiko", "ibong adarna", "florante", "rizal", "noli", "filibusterismo", "balagtasan", "sanaysay", "alamat", "maikling kwento", "dula", "awit", "korido", "tayutay"]):
        return "Panitikan"
    if any(x in text for x in ["pagsulat", "pagbasa", "skimming", "scanning", "coherence", "sanaysay", "pamatnubay", "balita", "editoryal", "lathalain", "campus", "pahayagan"]):
        return "Pagbasa at Pagsulat"
    if any(x in text for x in ["kultura", "pagpapahalaga", "pakikipagkapwa", "utang na loob", "delicadeza", "bayanihan", "respeto", "po at opo", "malasakit"]):
        return "Kultura at Pagpapahalaga"
    return "Filipino"


def page_lookup(path):
    lookup = {}
    for index, text in enumerate(page_texts(path), 1):
        marker = re.search(r"\bAnwer\s+Key\s*:|\bAnswer\s+Keys?\s*:?", text, re.I)
        if marker:
            text = text[: marker.start()]
        for match in QUESTION_RE.finditer(text):
            lookup.setdefault(int(match.group(1)), str(index))
    return lookup


def render_crop(path, visual):
    if Image is None:
        return ""
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    TMP_RENDER_DIR.mkdir(parents=True, exist_ok=True)
    ref = visual["ref"]
    output = IMAGE_DIR / f"{ref}.png"
    if output.exists():
        return str(output)
    prefix = TMP_RENDER_DIR / ref
    run(["pdftoppm", "-png", "-singlefile", "-f", str(visual["page"]), "-l", str(visual["page"]), str(path), str(prefix)])
    rendered = prefix.with_suffix(".png")
    with Image.open(rendered) as image:
        width, height = image.size
        left, top, right, bottom = visual["crop"]
        crop = image.crop((int(left * width), int(top * height), int(right * width), int(bottom * height)))
        crop.save(output)
    return str(output)


def status_for(row):
    if row["Duplicate Of"]:
        return "Duplicate"
    if "Duplicate choice labels" in row["Notes"]:
        return "Needs Review"
    if row["Has Image"] == "Yes":
        return "Needs Image Extraction"
    if not row["Question"] or sum(1 for letter in "ABCDE" if row[f"Choice {letter}"]) < 4:
        return "Incomplete"
    if not row["Correct Answer"]:
        return "Needs Answer"
    return "Ready for Upload"


def extract_pdf(path, start_no):
    text = pdf_text(path)
    key_start, key_end = answer_key_start(text)
    question_text = text[:key_start]
    answers = parse_answer_key(text[key_end:])
    pages = page_lookup(path)
    rows = []
    next_no = start_no

    for qnum, block in split_numbered_items(question_text, path.name):
        question, choices, duplicate_labels = split_question_choices(block)
        answer = answers.get(qnum, {})
        letter = answer_letter(answer.get("answer_text", ""), answer.get("rationale", ""), choices)
        explanation = answer.get("rationale", "")
        if answer.get("answer_text") and not explanation and not re.fullmatch(r"[A-E]", answer.get("answer_text", ""), re.I):
            explanation = f"Answer key: {answer.get('answer_text')}"

        visual = VISUAL_MAP.get((path.name, qnum))
        image_ref = ""
        notes = "Path and PDF header indicate BSED/Secondary Filipino. Correct answer sourced from source PDF answer key."
        if visual:
            image_path = render_crop(path, visual)
            image_ref = f"{visual['ref']} ({image_path})" if image_path else visual["ref"]
            notes += f" Source item has a connected visual: {visual['note']}"
        if duplicate_labels:
            notes += f" Duplicate choice labels in source/OCR: {', '.join(duplicate_labels)}."

        row = {
            "No.": str(next_no),
            "Original No.": str(qnum),
            "Page": pages.get(qnum, str(visual["page"]) if visual else ""),
            "Source PDF": path.name,
            "Source Path": str(path),
            "Question": question,
            "Passage Reference": "",
            "Question Image Reference": image_ref,
            "Choice A": choices.get("A", ""),
            "Choice A Image Reference": "",
            "Choice B": choices.get("B", ""),
            "Choice B Image Reference": "",
            "Choice C": choices.get("C", ""),
            "Choice C Image Reference": "",
            "Choice D": choices.get("D", ""),
            "Choice D Image Reference": "",
            "Choice E": choices.get("E", ""),
            "Choice E Image Reference": "",
            "Correct Answer": letter,
            "Explanation": explanation,
            "LET Exam Type": "LET Secondary",
            "Subject Area": "Filipino",
            "Topic": infer_topic(question),
            "Difficulty": "3",
            "Has Image": "Yes" if visual else "No",
            "Duplicate Of": "",
            "Confidence": "0.92" if letter else "0.70",
            "Status": "",
            "Notes": notes,
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
            row["Duplicate Of"] = seen[key]["No."]
            row["Status"] = "Duplicate"
            row["Notes"] += f" Duplicate or near-duplicate of row {row['Duplicate Of']}."
            row["Confidence"] = "0.90"
        else:
            seen[key] = row


def write_outputs(rows, summary):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUT_DIR / f"{BASE}.csv"
    json_path = OUT_DIR / f"{BASE}.json"
    md_path = OUT_DIR / f"{BASE}.md"
    summary_path = OUT_DIR / f"{BASE}_summary.json"

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    with md_path.open("w", encoding="utf-8") as handle:
        handle.write("| " + " | ".join(FIELDS) + " |\n")
        handle.write("| " + " | ".join(["---"] * len(FIELDS)) + " |\n")
        for row in rows:
            values = [str(row.get(field, "")).replace("|", "\\|") for field in FIELDS]
            handle.write("| " + " | ".join(values) + " |\n")
        handle.write("\n## Summary After Extraction\n\n")
        handle.write(json.dumps(summary, ensure_ascii=False, indent=2))
        handle.write("\n")

    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return csv_path, json_path, md_path, summary_path


def main():
    pdfs = sorted(SOURCE_DIR.glob("*.pdf"), key=lambda p: [int(s) if s.isdigit() else s for s in re.split(r"(\d+)", p.name)])
    rows = []
    next_no = 1
    for pdf in pdfs:
        extracted = extract_pdf(pdf, next_no)
        rows.extend(extracted)
        next_no += len(extracted)

    mark_duplicates(rows)

    status_counts = Counter(row["Status"] for row in rows)
    topic_counts = Counter(row["Topic"] for row in rows)
    source_counts = Counter(row["Source PDF"] for row in rows)
    difficulty_counts = Counter(row["Difficulty"] for row in rows)
    summary = {
        "source_dir": str(SOURCE_DIR),
        "source_pdfs": len(pdfs),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(count for status, count in status_counts.items() if status in {"Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"}),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in rows if row["Has Image"] == "Yes"),
        "total_questions_with_image_based_answer_choices": 0,
        "total_elementary_questions": 0,
        "total_secondary_questions": len(rows),
        "total_both_or_cannot_determine_questions": 0,
        "status_counts": dict(status_counts),
        "subject_category_breakdown": {"Filipino": len(rows)},
        "topic_breakdown": dict(topic_counts),
        "difficulty_breakdown": dict(difficulty_counts),
        "source_counts": dict(source_counts),
        "suggested_supabase_mapping": {
            "exam_type": "LET Secondary",
            "exam_level": "LET Secondary",
            "subject_area": "Filipino",
            "topic": "Filipino",
            "sub_tag": "Topic",
            "question_text": "Question",
            "question_image_url": "Question Image Reference",
            "choice_a_text": "Choice A",
            "choice_b_text": "Choice B",
            "choice_c_text": "Choice C",
            "choice_d_text": "Choice D",
            "choice_e_text": "Choice E",
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
        "recommended_next_action": "Upload Ready for Upload rows to LET Secondary major/filipino. Review Needs Image Extraction rows and attach image URLs before publishing them.",
    }
    csv_path, json_path, md_path, summary_path = write_outputs(rows, summary)
    summary["outputs"] = {
        "csv": str(csv_path),
        "json": str(json_path),
        "markdown": str(md_path),
        "summary": str(summary_path),
        "images": str(IMAGE_DIR),
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
