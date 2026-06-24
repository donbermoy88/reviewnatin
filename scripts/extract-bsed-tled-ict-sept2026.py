#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files/L. BSED - TLEd Information and Communication Technology-")
OUT_DIR = ROOT / "output/pdf"
BASE = "bsed_tled_ict_sept2026_extracted_questions"
MANUAL_ANSWER_OVERRIDES = {
    ("BSED TLEd-ICT P1.pdf", 7): "B",
    ("BSED TLEd-ICT P10.pdf", 11): "B",
    ("BSED TLEd-ICT P10.pdf", 35): "A",
    ("BSED TLEd-ICT P2.pdf", 3): "B",
    ("BSED TLEd-ICT P3.pdf", 21): "C",
}

FIELDS = [
    "No.", "Original No.", "Page", "Source PDF", "Source Path", "Question",
    "Passage Reference", "Question Image Reference",
    "Choice A", "Choice A Image Reference", "Choice B", "Choice B Image Reference",
    "Choice C", "Choice C Image Reference", "Choice D", "Choice D Image Reference",
    "Choice E", "Choice E Image Reference", "Correct Answer", "Explanation",
    "LET Exam Type", "Subject Area", "Topic", "Difficulty", "Has Image",
    "Duplicate Of", "Confidence", "Status", "Notes",
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
    for old, new in {"−": "-", "–": "-", "—": "-", "“": '"', "”": '"', "‘": "'", "’": "'"}.items():
        text = text.replace(old, new)
    return re.sub(r"[^a-z0-9]+", "", text)


def words(value):
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "into", "only", "best",
        "used", "uses", "computer", "computers", "technology", "information",
        "communication", "digital", "data", "system", "systems", "software",
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
        if re.fullmatch(r"TLEd-?\s*Information and Communication Technology\s*2026", stripped, re.I):
            continue
        if re.fullmatch(r"LET\s*Reviewer\s*TLEd\s*[–-]\s*Information and Communication", stripped, re.I):
            continue
        if re.fullmatch(r"Technology\s*2026", stripped, re.I):
            continue
        if re.fullmatch(r"LET\s*Reviewer\s*TLEd\s*[–-]\s*Information and Communication Technology\s*2026", stripped, re.I):
            continue
        if re.fullmatch(r"PART\s+[IVXLC]+\s*[–-].*", stripped, re.I):
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


QUESTION_RE = re.compile(r"(?m)^\s*([1-9]|[1-4]\d|50)\s*\.")
CHOICE_RE = re.compile(r"(?<![A-Za-z0-9])([A-D])\.\s*")


def page_lookup(path):
    lookup = {}
    for index, text in enumerate(page_texts(path), 1):
        answer_marker = re.search(r"\bANSWER\s+KEYS?\b", text, re.I)
        if answer_marker:
            text = text[: answer_marker.start()]
        for match in QUESTION_RE.finditer(text):
            qnum = int(match.group(1))
            lookup.setdefault(qnum, str(index))
    return lookup


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
        end = markers[index + 1].start() if index + 1 < len(markers) else len(block)
        choices[match.group(1)] = normalize_space(block[match.end():end])
    return question, choices


def answer_key_start(text):
    match = re.search(r"\bANSWER\s+KEYS?\b", text, re.I)
    if not match:
        raise RuntimeError("No answer key marker found")
    return match.start(), match.end()


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


def answer_letter(answer_text, rationale, choices):
    answer = normalize_space(answer_text)
    if re.fullmatch(r"[A-D]", answer, re.I):
        return answer.upper()

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
    if any(x in text for x in ["teacher", "teaching", "learning", "classroom", "lesson", "assessment", "rubric", "portfolio", "lms", "moodle", "google classroom", "blended", "flipped", "pedagogical", "samr", "tpack", "k-12"]):
        return "ICT in Education"
    if any(x in text for x in ["cyber", "malware", "virus", "worm", "trojan", "ransomware", "phishing", "firewall", "encryption", "password", "privacy", "data privacy", "copyright", "plagiarism", "netiquette", "digital citizen", "digital footprint", "piracy"]):
        return "Cybersecurity and Digital Citizenship"
    if any(x in text for x in ["network", "router", "switch", "lan", "wan", "ip address", "topology", "bandwidth", "modem", "ethernet", "rj45", "tcp", "http", "ftp", "smtp", "osi", "ipv", "subnet", "gateway", "wpa", "wi-fi"]):
        return "Networking"
    if any(x in text for x in ["html", "css", "javascript", "php", "python", "c++", "java", "sql", "database", "dbms", "programming", "compiler", "syntax", "loop", "function", "array", "variable", "algorithm", "boolean", "oop", "class", "primary key", "foreign key"]):
        return "Programming and Databases"
    if any(x in text for x in ["word", "excel", "powerpoint", "publisher", "spreadsheet", "presentation", "formula", "shortcut", "document", "header", "slide", "chart", "pdf"]):
        return "Productivity Tools"
    if any(x in text for x in ["cpu", "motherboard", "bios", "ram", "rom", "hard drive", "power supply", "psu", "monitor", "keyboard", "scanner", "printer", "usb", "post", "cmos", "thermal", "hardware", "troubleshooting", "esd", "wrist strap"]):
        return "Computer Hardware and Troubleshooting"
    if any(x in text for x in ["multimedia", "audio", "video", "animation", "image", "jpg", "gif", "audacity", "premiere", "flash", "animate", "responsive", "web design"]):
        return "Web and Multimedia"
    if any(x in text for x in ["cloud", "iot", "artificial intelligence", "ai", "machine learning", "blockchain", "cryptocurrency", "virtual reality", "augmented reality", "5g", "wearable", "green ict", "e-waste", "sustainable", "emerging"]):
        return "ICT Trends and Emerging Technologies"
    return "Information and Communication Technology"


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
    key_start, key_end = answer_key_start(text)
    questions = text[:key_start]
    answer_key = split_answer_key(text[key_end:])
    pages = page_lookup(path)
    rows = []
    next_no = start_no
    for qnum, block in split_numbered_items(questions):
        question, choices = split_question_choices(block)
        answer = answer_key.get(qnum, {})
        letter = answer_letter(answer.get("answer_text", ""), answer.get("rationale", ""), choices)
        override = MANUAL_ANSWER_OVERRIDES.get((path.name, qnum))
        if not letter and override and answer.get("answer_text"):
            letter = override
        explanation = answer.get("rationale", "")
        if answer.get("answer_text") and not explanation:
            explanation = f"Answer key: {answer.get('answer_text')}"
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
            "Choice E": "",
            "Choice E Image Reference": "",
            "Correct Answer": letter,
            "Explanation": explanation,
            "LET Exam Type": "LET Secondary",
            "Subject Area": "Technology and Livelihood Education",
            "Topic": infer_topic(question),
            "Difficulty": "3",
            "Has Image": "No",
            "Duplicate Of": "",
            "Confidence": "0.98" if letter else "0.74",
            "Status": "",
            "Notes": "Path indicates BSED/Secondary. Correct answer and rationale sourced from source PDF answer key."
            + (" Matching resolved by inspected source-key override." if override else ""),
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
        "subject_category_breakdown": {"Technology and Livelihood Education": len(rows)},
        "topic_breakdown": dict(topic_counts),
        "difficulty_breakdown": dict(Counter(row["Difficulty"] for row in rows)),
        "source_counts": dict(Counter(row["Source PDF"] for row in rows)),
        "outputs": {"csv": str(csv_path), "json": str(json_path), "markdown": str(md_path), "summary": str(summary_path)},
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
    print(json.dumps(write_outputs(rows), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
