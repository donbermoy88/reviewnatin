#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files/L. BSED - Social Science & Social Studies-")
OUT_DIR = ROOT / "output/pdf"
BASE = "bsed_social_studies_sept2026_extracted_questions"

FIELDS = [
    "No.", "Original No.", "Page", "Source PDF", "Source Path", "Question",
    "Passage Reference", "Question Image Reference",
    "Choice A", "Choice A Image Reference", "Choice B", "Choice B Image Reference",
    "Choice C", "Choice C Image Reference", "Choice D", "Choice D Image Reference",
    "Choice E", "Choice E Image Reference", "Correct Answer", "Explanation",
    "LET Exam Type", "Subject Area", "Topic", "Difficulty", "Has Image",
    "Duplicate Of", "Confidence", "Status", "Notes",
]

QUESTION_MARKER_RE = re.compile(r"(?<!\d)([1-9]\d{0,2})\s*\.\s*(?=[A-Z“\"'‘(]|[a-z])")
LINE_NUMBER_NO_DOT_RE = re.compile(r"(?m)^\s*([1-9]\d{0,2})\s+(?=[A-Z“\"'‘(])")
CHOICE_RE = re.compile(r"(?<![A-Za-z0-9])([A-Ea-e])\.\s*")


def run(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f"Command failed: {' '.join(map(str, args))}\n{result.stderr}")
    return result.stdout


def normalize_space(value):
    return re.sub(r"\s+", " ", str(value or "").replace("\x0c", " ")).strip()


def normalize_key(value):
    text = normalize_space(value).lower()
    for old, new in {"−": "-", "–": "-", "—": "-", "“": '"', "”": '"', "‘": "'", "’": "'", "ñ": "n"}.items():
        text = text.replace(old, new)
    return re.sub(r"[^a-z0-9]+", "", text)


def words(value):
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "into", "only", "best",
        "social", "studies", "science", "major", "country", "countries", "people",
        "philippines", "filipino", "filipinos", "which", "what", "when", "where",
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
        if re.fullmatch(r"SOCIAL STUDIES-SCIENCE MAJOR", stripped, re.I):
            continue
        cleaned.append(stripped)
    return "\n".join(cleaned)


def pdf_text(path):
    text = clean_pdf_text(run(["pdftotext", "-raw", str(path), "-"]))
    if path.name == "BSED Social Studies-Science P5.pdf":
        text = re.sub(r"\n26\.\s+In a land area of 115,707 square miles,", "\n56. In a land area of 115,707 square miles,", text)
        text = re.sub(r"\n1211\.\s+There are fundamental ideas", "\n121. There are fundamental ideas", text)
    return text


def page_texts(path):
    info = run(["pdfinfo", str(path)])
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    pages = int(match.group(1)) if match else 0
    texts = [clean_pdf_text(run(["pdftotext", "-raw", "-f", str(i), "-l", str(i), str(path), "-"])) for i in range(1, pages + 1)]
    if path.name == "BSED Social Studies-Science P5.pdf":
        texts = [re.sub(r"\n26\.\s+In a land area of 115,707 square miles,", "\n56. In a land area of 115,707 square miles,", text) for text in texts]
        texts = [re.sub(r"\n1211\.\s+There are fundamental ideas", "\n121. There are fundamental ideas", text) for text in texts]
    return texts


def answer_key_start(text):
    match = re.search(r"\bAnswer\s+Keys?:|\bAnswer\s+Key\s+with\s+Short\s+Explanations\b", text, re.I)
    if not match:
        raise RuntimeError("No answer key marker found")
    return match.start(), match.end()


def question_markers(text):
    markers = [(int(match.group(1)), match.start(), match.end()) for match in QUESTION_MARKER_RE.finditer(text)]
    markers.extend((int(match.group(1)), match.start(), match.end()) for match in LINE_NUMBER_NO_DOT_RE.finditer(text))
    return sorted(markers, key=lambda item: item[1])


def split_numbered_questions(text):
    candidates = question_markers(text)
    if not candidates:
        return []

    selected = []
    expected = 1
    search_from = 0
    max_qnum = max(qnum for qnum, _start, _end in candidates)
    while True:
        found = None
        for qnum, start, end in candidates:
            if start < search_from:
                continue
            if qnum == expected:
                found = (qnum, start, end)
                break
        if not found:
            expected += 1
            if expected > max_qnum:
                break
            continue
        selected.append(found)
        search_from = found[2]
        expected += 1

    items = []
    for index, (qnum, _start, marker_end) in enumerate(selected):
        end = selected[index + 1][1] if index + 1 < len(selected) else len(text)
        items.append((qnum, text[marker_end:end]))
    return items


def parse_answer_key(key_text):
    answers = {}
    for raw_line in key_text.splitlines():
        line = normalize_space(raw_line)
        match = re.match(r"^([1-9]\d{0,2})\s*\.\s*(.+)$", line)
        if not match:
            continue
        qnum = int(match.group(1))
        answer = normalize_space(match.group(2))
        parts = re.split(r"\s+[–—-]\s+", answer, maxsplit=1)
        answers[qnum] = {
            "answer_text": normalize_space(parts[0]),
            "rationale": normalize_space(parts[1]) if len(parts) > 1 else "",
        }
    return answers


def split_question_choices(block):
    line_markers = list(re.finditer(r"(?m)^\s*([A-Ea-e])\.\s*", block))
    if not line_markers:
        line_markers = list(re.finditer(r"(?m)^\s*8\.\s*", block))

    duplicate_labels = []
    if line_markers:
        question = normalize_space(block[: line_markers[0].start()])
        choices = {}
        raw_labels = []
        for index, match in enumerate(line_markers):
            label = "D" if match.group(0).strip().startswith("8.") else match.group(1).upper()
            raw_labels.append(label)
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
    raw_labels = []
    for index, match in enumerate(markers):
        label = match.group(1).upper()
        raw_labels.append(label)
        if label in choices:
            duplicate_labels.append(label)
        end = markers[index + 1].start() if index + 1 < len(markers) else len(block)
        choices.setdefault(label, normalize_space(block[match.end():end]))
    return question, choices, duplicate_labels


def answer_letter(answer_text, rationale, choices):
    answer = re.sub(r"^[.\s]+", "", normalize_space(answer_text))
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
    if any(x in text for x in ["research", "hypothesis", "variable", "sampling", "survey", "data-gathering", "primary sources", "secondary sources", "quantitative", "rubric", "assessment", "action research", "historical sources", "portfolio"]):
        return "Research and Assessment"
    if any(x in text for x in ["teacher", "k-12", "spiral progression", "inquiry", "debate", "role-playing", "group investigation", "map-making", "social studies is", "civic competence", "classroom"]):
        return "Social Studies Pedagogy"
    if any(x in text for x in ["constitution", "article iii", "bill of rights", "suffrage", "president", "executive", "legislative", "judiciary", "supreme court", "law", "government", "local government", "separation of powers", "constitutional", "rights"]):
        return "Government and Constitution"
    if any(x in text for x in ["rizal", "katipunan", "bonifacio", "malolos", "commonwealth", "magellan", "legaspi", "villalobos", "gomburza", "propaganda movement", "edsa", "independence", "spanish", "american", "japanese occupation", "quezon", "macapagal", "filipino first", "spratly", "parity rights"]):
        return "Philippine History and Nationalism"
    if any(x in text for x in ["world war", "cold war", "renaissance", "industrial revolution", "babylonian", "asoka", "mahatma gandhi", "sun yat sen", "pakistan", "magna carta", "berlin wall", "league of nations", "united nations", "udhR".lower()]):
        return "World History"
    if any(x in text for x in ["continent", "ocean", "river", "mountain", "climate", "monsoon", "archipelago", "latitude", "longitude", "map", "peninsula", "visayas", "mindanao", "luzon", "asia", "europe", "africa", "australia", "cape horn", "ring of fire", "topographic"]):
        return "Geography"
    if any(x in text for x in ["economy", "economic", "capitalism", "communism", "supply", "demand", "opportunity cost", "inflation", "gross domestic product", "gdp", "monopoly", "balance of trade", "fiscal policy", "scarcity", "consumer", "market", "imports", "exports"]):
        return "Economics"
    if any(x in text for x in ["kyoto", "climate change", "greenhouse", "earth summit", "sustainable development", "erosion", "earthquake", "environment", "carbon", "global warming", "recycling", "conservation"]):
        return "Environmental Studies"
    if any(x in text for x in ["asean", "apec", "seato", "imf", "globalization", "outsourcing", "peacekeeping", "international", "arabian", "scandinavian", "bangkok declaration"]):
        return "ASEAN and International Relations"
    if any(x in text for x in ["culture", "cultural", "ethnocentrism", "acculturation", "assimilation", "accommodation", "amalgamation", "mano po", "folkways", "taboo", "mores", "values", "belief", "religious", "caste", "matrilineal", "family", "society", "sociology", "anthropology", "archaeology", "durkheim", "spencer", "marx", "comte", "social mobility", "bourgeoisie", "proletariat"]):
        return "Sociology and Anthropology"
    return "Social Studies / Araling Panlipunan"


def page_lookup(path):
    lookup = {}
    for index, text in enumerate(page_texts(path), 1):
        marker = re.search(r"\bAnswer\s+Keys?:|\bAnswer\s+Key\s+with\s+Short\s+Explanations\b", text, re.I)
        if marker:
            text = text[: marker.start()]
        for qnum, _start, _end in question_markers(text):
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


def extract_pdf(path, start_no):
    text = pdf_text(path)
    key_start, key_end = answer_key_start(text)
    question_text = text[:key_start]
    answers = parse_answer_key(text[key_end:])
    pages = page_lookup(path)
    rows = []
    next_no = start_no
    for qnum, block in split_numbered_questions(question_text):
        question, choices, duplicate_labels = split_question_choices(block)
        answer = answers.get(qnum, {})
        letter = answer_letter(answer.get("answer_text", ""), answer.get("rationale", ""), choices)
        explanation = answer.get("rationale", "")
        if answer.get("answer_text") and not explanation:
            explanation = f"Answer key: {answer.get('answer_text')}"
        notes = "Path and PDF header indicate BSED/Secondary Social Studies major. Correct answer sourced from source PDF answer key."
        if path.name == "BSED Social Studies-Science P5.pdf" and qnum == 56:
            notes += " Source marker appears as 26 after item 55; normalized to 56 to match sequence and answer key."
        if path.name == "BSED Social Studies-Science P5.pdf" and qnum == 121:
            notes += " Source marker appears as 1211; normalized to 121 to match sequence and answer key."
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
            "Subject Area": "Social Studies",
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
        "subject_category_breakdown": {"Social Studies": len(rows)},
        "topic_breakdown": dict(topic_counts),
        "difficulty_breakdown": dict(Counter(row["Difficulty"] for row in rows)),
        "source_counts": dict(Counter(row["Source PDF"] for row in rows)),
        "suggested_supabase_mapping": {
            "exam_type": "LET Secondary",
            "exam_level": "LET Secondary",
            "subject_area": "Social Studies",
            "topic": "Social Studies / Araling Panlipunan",
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
        "recommended_next_action": "Upload Ready for Upload rows to LET Secondary major/social-studies-araling-panlipunan, then verify live source counts and sub-tag breakdown.",
        "outputs": {"csv": str(csv_path), "json": str(json_path), "markdown": str(md_path), "summary": str(summary_path)},
    }
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


def main():
    rows = []
    next_no = 1
    expected_counts = {
        "BSED Social Studies-Science P1.pdf": 150,
        "BSED Social Studies-Science P2.pdf": 150,
        "BSED Social Studies-Science P3.pdf": 150,
        "BSED Social Studies-Science P4.pdf": 120,
        "BSED Social Studies-Science P5.pdf": 150,
        "BSED Social Studies-Science P6.pdf": 50,
        "BSED Social Studies-Science P7.pdf": 49,
        "BSED Social Studies-Science P8.pdf": 50,
        "BSED Social Studies-Science P9.pdf": 50,
        "BSED Social Studies-Science P10.pdf": 30,
    }
    for path in sorted(SOURCE_DIR.glob("*.pdf")):
        extracted = extract_pdf(path, next_no)
        expected = expected_counts[path.name]
        if len(extracted) != expected:
            raise RuntimeError(f"Expected {expected} questions in {path.name}, found {len(extracted)}")
        rows.extend(extracted)
        next_no += len(extracted)
    mark_duplicates(rows)
    print(json.dumps(write_outputs(rows), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
