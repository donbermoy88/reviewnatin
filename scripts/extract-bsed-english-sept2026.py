#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files/L. BSED - English-")
OUT_DIR = ROOT / "output/pdf"
BASE = "bsed_english_sept2026_extracted_questions"

FIELDS = [
    "No.", "Original No.", "Page", "Source PDF", "Source Path", "Question",
    "Passage Reference", "Question Image Reference",
    "Choice A", "Choice A Image Reference", "Choice B", "Choice B Image Reference",
    "Choice C", "Choice C Image Reference", "Choice D", "Choice D Image Reference",
    "Choice E", "Choice E Image Reference", "Correct Answer", "Explanation",
    "LET Exam Type", "Subject Area", "Topic", "Difficulty", "Has Image",
    "Duplicate Of", "Confidence", "Status", "Notes",
]

QUESTION_RE = re.compile(r"(?m)^\s*([1-9]\d{0,2})\s*\.\s*")
CHOICE_RE = re.compile(r"(?<![A-Za-z0-9])\(?([A-Ea-e])(?:['’])?\s*\)?[\).]\s*")
ANSWER_KEY_RE = re.compile(r"\bAnswer\s+Key(?:s)?(?:\s+with\s+Short\s+Explanations)?\s*:?\b|\bKey\s+Answers\s*:?", re.I)

SKIPPED_SOURCES = {
    "9000+ English Booster Test.pdf": "Large general booster bank with compact answer-key formatting; held back for a dedicated batch instead of mixing low-confidence extraction into this BSED English major import.",
    "A LET-ENG-Regular verbs list.pdf": "Reference verb list, not multiple-choice LET questions.",
    "SET1 Drill&Booster English.pdf": "No answer key marker found in the PDF; rows would require answer review.",
    "SET2 Drill&Booster English.pdf": "No answer key marker found in the PDF; rows would require answer review.",
}

EXPECTED_COUNTS = {
    "BSED English Part1.pdf": 50,
    "BSED English Part2.pdf": 47,
    "BSED English Part3.pdf": 50,
    "BSED English Part4.pdf": 45,
    "BSED English Part5.pdf": 20,
    "BSED English Part6.pdf": 23,
    "BSED English Part7.pdf": 23,
    "BSED English Part8.pdf": 20,
    "SET3 Drill&Booster English.pdf": 42,
    "SET4 Drill&Booster English.pdf": 20,
    "SET5 Drill&Booster English.pdf": 30,
    "SET6 Drill&Booster English.pdf": 20,
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
    for old, new in {
        "−": "-", "–": "-", "—": "-", "“": '"', "”": '"', "‘": "'", "’": "'",
        "×": "x", "·": "", "℃": "c", "°": "", "²": "2", "³": "3",
    }.items():
        text = text.replace(old, new)
    return re.sub(r"[^a-z0-9]+", "", text)


def words(value):
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "into", "only", "best",
        "science", "physical", "which", "what", "when", "where", "called", "following",
        "unit", "law", "method", "energy", "force", "earth",
    }
    return {w for w in re.findall(r"[a-z0-9]+", normalize_space(value).lower()) if len(w) > 1 and w not in stop}


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
        if re.fullmatch(r"Secondary Education-?\s*English", stripped, re.I):
            continue
        if re.fullmatch(r"SECONDARY EDUCATION\s*-\s*ENGLISH", stripped, re.I):
            continue
        if re.fullmatch(r"English Part \d+", stripped, re.I):
            continue
        if re.fullmatch(r"LET Reviewer English(?:\s*2026)?", stripped, re.I):
            continue
        if re.fullmatch(r"ENGLISH\s*-\s*GENERAL EDUCATION", stripped, re.I):
            continue
        if re.fullmatch(r"(?:IV|IX|V?I{1,3}|X{1,3})\.\s+.*", stripped):
            continue
        if stripped == ".":
            continue
        cleaned.append(stripped)
    return "\n".join(cleaned)


def pdf_text(path):
    text = clean_pdf_text(run(["pdftotext", "-raw", str(path), "-"]))
    text = re.sub(r"(?m)^\s*\(4\)", "(d)", text)
    text = re.sub(r"(?m)^(\d{1,3})\s*-\s*\d{1,3}\.\s*", r"\1. ", text)
    text = text.replace("(U)", "(D)")
    return text


def page_texts(path):
    info = run(["pdfinfo", str(path)])
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    pages = int(match.group(1)) if match else 0
    texts = [clean_pdf_text(run(["pdftotext", "-raw", "-f", str(i), "-l", str(i), str(path), "-"])) for i in range(1, pages + 1)]
    texts = [re.sub(r"(?m)^\s*\(4\)", "(d)", text).replace("(U)", "(D)") for text in texts]
    texts = [re.sub(r"(?m)^(\d{1,3})\s*-\s*\d{1,3}\.\s*", r"\1. ", text) for text in texts]
    return texts


def answer_key_start(text):
    match = ANSWER_KEY_RE.search(text)
    if not match:
        raise RuntimeError("No answer key marker found")
    return match.start(), match.end()


def split_numbered_items(text):
    markers = []
    for match in QUESTION_RE.finditer(text):
        qnum = int(match.group(1))
        if 1 <= qnum <= 250:
            markers.append((qnum, match.start(), match.end()))
    selected = []
    last_qnum = 0
    for marker in markers:
        qnum = marker[0]
        if qnum > last_qnum:
            selected.append(marker)
            last_qnum = qnum
    items = []
    for index, (qnum, _start, marker_end) in enumerate(selected):
        end = selected[index + 1][1] if index + 1 < len(selected) else len(text)
        items.append((qnum, text[marker_end:end]))
    return items


def parse_answer_key(key_text):
    answers = {}
    for raw_line in key_text.splitlines():
        line = normalize_space(raw_line)
        compact = re.match(r"^([1-9]\d{0,2})\s*([A-Ea-e])$", line)
        if compact:
            answers[int(compact.group(1))] = {
                "answer_text": compact.group(2).upper(),
                "rationale": "",
            }
            continue

        spaced = re.match(r"^([1-9]\d{0,2})\s+([A-Ea-e])$", line)
        if spaced:
            answers[int(spaced.group(1))] = {
                "answer_text": spaced.group(2).upper(),
                "rationale": "",
            }
            continue

        match = re.match(r"^([1-9]\d{0,2})\s*\.\s*(.+)$", line)
        if not match:
            continue
        qnum = int(match.group(1))
        raw = normalize_space(match.group(2))
        parts = re.split(r"\s+[–—-]\s+", raw, maxsplit=1)
        answers[qnum] = {
            "answer_text": normalize_space(parts[0]),
            "rationale": normalize_space(parts[1]) if len(parts) > 1 else "",
        }
    return answers


def split_question_choices(block):
    line_markers = list(re.finditer(r"(?m)^\s*\(?([A-Ea-e])(?:['’])?\s*\)?[\).]\s*", block))
    if line_markers:
        question = normalize_space(block[: line_markers[0].start()])
        choices = {}
        duplicate_labels = []
        for index, match in enumerate(line_markers):
            label = match.group(1).upper()
            if label in choices:
                duplicate_labels.append(label)
            end = line_markers[index + 1].start() if index + 1 < len(line_markers) else len(block)
            choices.setdefault(label, normalize_space(block[match.end():end]))
        expand_inline_choices(choices)
        return question, choices, duplicate_labels

    block = normalize_space(block)
    markers = list(CHOICE_RE.finditer(block))
    if not markers:
        return block, {}, []
    question = normalize_space(block[: markers[0].start()])
    choices = {}
    duplicate_labels = []
    for index, match in enumerate(markers):
        label = match.group(1).upper()
        if label in choices:
            duplicate_labels.append(label)
        end = markers[index + 1].start() if index + 1 < len(markers) else len(block)
        choices.setdefault(label, normalize_space(block[match.end():end]))
    expand_inline_choices(choices)
    return question, choices, duplicate_labels


def trim_embedded_explanation(block):
    match = re.search(r"(?is)\n\s*(The best answer is|The correct answer is)\s+([A-E])\.\s*(.+)$", block)
    if not match:
        return block, "", ""
    return block[: match.start()], match.group(2).upper(), normalize_space(match.group(0))


def expand_inline_choices(choices):
    for label in list("ABCDE"):
        value = choices.get(label, "")
        markers = list(re.finditer(r"\s+\(?([A-Ea-e])(?:['’])?\s*\)?[\).]\s*", value))
        if not markers:
            continue

        base = normalize_space(value[: markers[0].start()])
        if base:
            choices[label] = base
        for index, match in enumerate(markers):
            inner_label = match.group(1).upper()
            end = markers[index + 1].start() if index + 1 < len(markers) else len(value)
            if inner_label not in choices or not choices[inner_label]:
                choices[inner_label] = normalize_space(value[match.end():end])


def answer_letter(answer_text, rationale, choices):
    answer = re.sub(r"^[.\s]+", "", normalize_space(answer_text))
    if not answer:
        return ""
    if re.fullmatch(r"[A-E]", answer, re.I):
        return answer.upper()

    embedded = re.match(r"^([A-E])[\.\s-]+", answer, re.I)
    if embedded:
        return embedded.group(1).upper()

    answer_key = normalize_key(answer)
    combined_words = words(f"{answer} {rationale}")
    best = ("", 0)
    for letter, choice in choices.items():
        choice_key = normalize_key(choice)
        if choice_key == answer_key or choice_key.startswith(answer_key) or answer_key.startswith(choice_key):
            return letter
        overlap = len(words(choice) & combined_words)
        if overlap > best[1]:
            best = (letter, overlap)
    if best[1] >= 1 and answer_key:
        return best[0]
    return ""


def infer_topic(question):
    text = normalize_space(question).lower()
    if any(x in text for x in ["poem", "poet", "poetry", "novel", "sonnet", "play", "drama", "gothic", "romantic", "shakespeare", "chaucer", "milton", "literary", "literature", "paradise lost", "figure of speech", "metaphor", "symbolism"]):
        return "Literature"
    if any(x in text for x in ["main idea", "author's purpose", "tone", "inferred", "implied", "passage", "paragraph", "reading", "comprehension", "context"]):
        return "Reading Comprehension"
    if any(x in text for x in ["grammar", "pronoun", "verb", "tense", "sentence", "clause", "phrase", "punctuation", "preposition", "modifier", "subject-verb", "agreement", "correct usage"]):
        return "Grammar"
    if any(x in text for x in ["vocabulary", "synonym", "antonym", "meaning", "word", "idiom", "capitalized", "spelling", "etymology"]):
        return "Vocabulary"
    if any(x in text for x in ["phoneme", "morpheme", "phonology", "syntax", "semantics", "linguistic", "language acquisition", "discourse"]):
        return "Linguistics"
    if any(x in text for x in ["teaching", "assessment", "rubric", "lesson", "learner", "classroom", "language teaching", "quick write", "portfolio"]):
        return "English Language Teaching"
    if any(x in text for x in ["essay", "composition", "writing", "organizing", "cohesion", "coherence"]):
        return "Discourse and Writing"
    return "English"


def page_lookup(path):
    lookup = {}
    for index, text in enumerate(page_texts(path), 1):
        marker = ANSWER_KEY_RE.search(text)
        if marker:
            text = text[: marker.start()]
        for qnum, _block in split_numbered_items(text):
            lookup.setdefault(qnum, str(index))
    return lookup


def status_for(row):
    if row["Duplicate Of"]:
        return "Duplicate"
    if "Duplicate choice labels" in row["Notes"]:
        return "Needs Review"
    if not row["Question"] or sum(1 for letter in "ABCDE" if row[f"Choice {letter}"]) < 4:
        return "Incomplete"
    if not row["Correct Answer"]:
        return "Needs Answer"
    return "Ready for Upload"


def extract_inline_answer(block):
    match = re.search(r"\n\s*([A-E])\s*$", block, re.I)
    if not match:
        return block, ""
    return block[: match.start()], match.group(1).upper()


def extract_pdf(path, start_no):
    text = pdf_text(path)
    key_match = ANSWER_KEY_RE.search(text)
    has_answer_key = bool(key_match)
    question_text = text[: key_match.start()] if key_match else text
    answers = parse_answer_key(text[key_match.end():]) if key_match else {}
    pages = page_lookup(path)
    rows = []
    next_no = start_no
    for qnum, block in split_numbered_items(question_text):
        block, inline_letter, inline_explanation = trim_embedded_explanation(block)
        question, choices, duplicate_labels = split_question_choices(block)
        answer = answers.get(qnum, {})
        letter = inline_letter or answer_letter(answer.get("answer_text", ""), answer.get("rationale", ""), choices)
        explanation = answer.get("rationale", "") or inline_explanation
        if answer.get("answer_text") and not explanation:
            explanation = f"Answer key: {answer.get('answer_text')}"
        notes = "Path and PDF header indicate BSED/Secondary English major."
        if has_answer_key:
            notes += " Correct answer sourced from source PDF answer key."
        elif inline_letter:
            notes += " Correct answer sourced from inline explanation in source PDF."
        else:
            notes += " No answer key or inline answer was found in the source PDF."
        if duplicate_labels:
            notes += f" Duplicate choice labels in source/OCR: {', '.join(duplicate_labels)}."
        row = {
            "No.": str(next_no),
            "Original No.": str(qnum),
            "Page": pages.get(qnum, ""),
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
            "Choice E": choices.get("E", ""),
            "Choice E Image Reference": "",
            "Correct Answer": letter,
            "Explanation": explanation,
            "LET Exam Type": "LET Secondary",
            "Subject Area": "English",
            "Topic": infer_topic(question),
            "Difficulty": "3",
            "Has Image": "No",
            "Duplicate Of": "",
            "Confidence": "0.98" if letter and not duplicate_labels else "0.78",
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
    esc = lambda value: str(value or "").replace("|", "\\|").replace("\n", "<br>")
    md_lines = ["| " + " | ".join(FIELDS) + " |", "| " + " | ".join(["---"] * len(FIELDS)) + " |"]
    for row in rows:
        md_lines.append("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |")
    md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")
    status_counts = Counter(row["Status"] for row in rows)
    topic_counts = Counter(row["Topic"] for row in rows)
    summary = {
        "source_dir": str(SOURCE_DIR),
        "source_pdfs": len(list(SOURCE_DIR.glob("*.pdf"))),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(status_counts.get(s, 0) for s in ["Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"]),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": 0,
        "total_questions_with_image_based_answer_choices": 0,
        "total_elementary_questions": 0,
        "total_secondary_questions": len(rows),
        "total_both_or_cannot_determine_questions": 0,
        "status_counts": dict(status_counts),
        "subject_category_breakdown": {"English": len(rows)},
        "topic_breakdown": dict(topic_counts),
        "difficulty_breakdown": dict(Counter(row["Difficulty"] for row in rows)),
        "source_counts": dict(Counter(row["Source PDF"] for row in rows)),
        "processed_pdfs": len(EXPECTED_COUNTS),
        "skipped_sources": SKIPPED_SOURCES,
        "suggested_supabase_mapping": {
            "exam_type": "LET Secondary",
            "exam_level": "LET Secondary",
            "subject_area": "English",
            "topic": "English",
            "sub_tag": "Topic",
            "question_text": "Question",
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
        "recommended_next_action": "Upload Ready for Upload rows to LET Secondary major/english, then verify live source counts and sub-tag breakdown.",
        "outputs": {"csv": str(csv_path), "json": str(json_path), "markdown": str(md_path), "summary": str(summary_path)},
    }
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


def main():
    rows = []
    next_no = 1
    for path in sorted(SOURCE_DIR.glob("*.pdf")):
        if path.name in SKIPPED_SOURCES:
            continue
        if path.name not in EXPECTED_COUNTS:
            raise RuntimeError(f"Unexpected PDF in English import folder: {path.name}")
        extracted = extract_pdf(path, next_no)
        expected = EXPECTED_COUNTS[path.name]
        if len(extracted) != expected:
            raise RuntimeError(f"Expected {expected} questions in {path.name}, found {len(extracted)}")
        rows.extend(extracted)
        next_no += len(extracted)
    mark_duplicates(rows)
    print(json.dumps(write_outputs(rows), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
