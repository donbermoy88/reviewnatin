#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files/L. BSED - Physical Science-")
OUT_DIR = ROOT / "output/pdf"
BASE = "bsed_physical_science_sept2026_extracted_questions"

FIELDS = [
    "No.", "Original No.", "Page", "Source PDF", "Source Path", "Question",
    "Passage Reference", "Question Image Reference",
    "Choice A", "Choice A Image Reference", "Choice B", "Choice B Image Reference",
    "Choice C", "Choice C Image Reference", "Choice D", "Choice D Image Reference",
    "Choice E", "Choice E Image Reference", "Correct Answer", "Explanation",
    "LET Exam Type", "Subject Area", "Topic", "Difficulty", "Has Image",
    "Duplicate Of", "Confidence", "Status", "Notes",
]

QUESTION_RE = re.compile(r"(?m)^\s*([1-9]|[1-4]\d|50)\s*\.\s*")
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
        if re.fullmatch(r"Secondary Education-?\s*Physical Science", stripped, re.I):
            continue
        if re.fullmatch(r"Physical Science Part \d+", stripped, re.I):
            continue
        if re.fullmatch(r"(?:IV|IX|V?I{1,3}|X{1,3})\.\s+.*", stripped):
            continue
        if stripped == ".":
            continue
        cleaned.append(stripped)
    return "\n".join(cleaned)


def pdf_text(path):
    text = clean_pdf_text(run(["pdftotext", "-raw", str(path), "-"]))
    if path.name == "BSED Physical Science P3.pdf":
        text = text.replace("Decreasing the surface area of contact 6. Change in enthalpy", "Decreasing the surface area of contact\n6. Change in enthalpy")
    if path.name == "BSED Physical Science P5.pdf":
        text = text.replace("Nothing, because you cannot succeed no matter what you do. 6. Which of the following involves adsorption?", "Nothing, because you cannot succeed no matter what you do.\n6. Which of the following involves adsorption?")
    if path.name == "BSED Physical Science P6.pdf":
        text = text.replace("D. Surface waves 6. A person is riding a moped", "D. Surface waves\n6. A person is riding a moped")
    return text


def page_texts(path):
    info = run(["pdfinfo", str(path)])
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    pages = int(match.group(1)) if match else 0
    texts = [clean_pdf_text(run(["pdftotext", "-raw", "-f", str(i), "-l", str(i), str(path), "-"])) for i in range(1, pages + 1)]
    if path.name == "BSED Physical Science P3.pdf":
        texts = [text.replace("Decreasing the surface area of contact 6. Change in enthalpy", "Decreasing the surface area of contact\n6. Change in enthalpy") for text in texts]
    if path.name == "BSED Physical Science P5.pdf":
        texts = [text.replace("Nothing, because you cannot succeed no matter what you do. 6. Which of the following involves adsorption?", "Nothing, because you cannot succeed no matter what you do.\n6. Which of the following involves adsorption?") for text in texts]
    if path.name == "BSED Physical Science P6.pdf":
        texts = [text.replace("D. Surface waves 6. A person is riding a moped", "D. Surface waves\n6. A person is riding a moped") for text in texts]
    return texts


def answer_key_start(text):
    match = re.search(r"\bAnswer\s+Keys?:?\b|\bAnswer\s+Key\b", text, re.I)
    if not match:
        raise RuntimeError("No answer key marker found")
    return match.start(), match.end()


def split_numbered_items(text):
    markers = []
    for match in QUESTION_RE.finditer(text):
        qnum = int(match.group(1))
        if 1 <= qnum <= 50:
            markers.append((qnum, match.start(), match.end()))
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
    for raw_line in key_text.splitlines():
        line = normalize_space(raw_line)
        match = re.match(r"^([1-9]|[1-4]\d|50)\s*\.\s*(.+)$", line)
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
    line_markers = list(re.finditer(r"(?m)^\s*([A-Ea-e])\.\s*", block))
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
    if any(x in text for x in ["inquiry", "science process", "scientific method", "hypothesis", "observation", "variable", "experiment", "formative assessment", "5e model", "laboratory skills", "constructivist", "discovery method"]):
        return "Science Pedagogy and Research"
    if any(x in text for x in ["greenhouse", "ozone", "acid rain", "pollution", "sustainable", "pest", "biosphere", "population", "rainforest", "nitrogen", "transpiration", "environment", "fossil fuel", "global warming", "renewable", "nonrenewable"]):
        return "Environmental Science"
    if any(x in text for x in ["earth", "mantle", "crust", "core", "plate", "earthquake", "volcan", "seismic", "asteroid", "planet", "moon", "sun", "orbit", "kepler", "eclipse", "albedo", "hubble", "universe", "weathering", "soil erosion", "atmosphere", "season"]):
        return "Earth and Space Science"
    if any(x in text for x in ["atom", "atomic", "electron", "proton", "neutron", "isotope", "nucleus", "radio", "decay", "fusion", "fission", "quantum", "photon", "rutherford", "half-life", "nuclear"]):
        return "Atomic and Nuclear Physics"
    if any(x in text for x in ["bond", "compound", "solution", "acid", "base", "ph", "mole", "molar", "covalent", "ionic", "metallic", "solute", "solvent", "dissol", "chemical", "catalyst", "sublimation", "filtration", "litmus"]):
        return "Chemistry"
    if any(x in text for x in ["current", "voltage", "resistance", "ohm", "circuit", "magnet", "magnetic", "electric", "ampere", "ammeter", "wire", "coil", "induced", "kirchoff", "coulomb"]):
        return "Electricity and Magnetism"
    if any(x in text for x in ["wave", "sound", "light", "lens", "mirror", "refraction", "wavelength", "frequency", "prism", "photoelectric", "doppler", "interference", "polarization", "radiation"]):
        return "Waves and Optics"
    if any(x in text for x in ["heat", "temperature", "entropy", "thermodynamic", "conduction", "convection", "calorie", "thermal", "specific heat", "endothermic", "refrigerant", "boiling", "melting", "freezing"]):
        return "Thermodynamics"
    if any(x in text for x in ["force", "motion", "velocity", "acceleration", "momentum", "inertia", "work", "power", "kinetic", "potential", "gravity", "pendulum", "scalar", "vector", "lever", "friction", "newton"]):
        return "Mechanics"
    return "Physical Science"


def page_lookup(path):
    lookup = {}
    for index, text in enumerate(page_texts(path), 1):
        marker = re.search(r"\bAnswer\s+Keys?:?\b|\bAnswer\s+Key\b", text, re.I)
        if marker:
            text = text[: marker.start()]
        for match in QUESTION_RE.finditer(text):
            lookup.setdefault(int(match.group(1)), str(index))
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
    for qnum, block in split_numbered_items(question_text):
        question, choices, duplicate_labels = split_question_choices(block)
        answer = answers.get(qnum, {})
        letter = answer_letter(answer.get("answer_text", ""), answer.get("rationale", ""), choices)
        explanation = answer.get("rationale", "")
        if answer.get("answer_text") and not explanation:
            explanation = f"Answer key: {answer.get('answer_text')}"
        notes = "Path and PDF header indicate BSED/Secondary Physical Science major. Correct answer sourced from source PDF answer key."
        if path.name == "BSED Physical Science P3.pdf" and qnum == 6:
            notes += " Source marker appears on the same line after item 5 choice D; normalized to preserve sequence and answer-key alignment."
        if path.name == "BSED Physical Science P5.pdf" and qnum == 6:
            notes += " Source marker appears on the same line after item 5 choice D; normalized to preserve sequence and answer-key alignment."
        if path.name == "BSED Physical Science P6.pdf" and qnum == 6:
            notes += " Source marker appears on the same line after item 5 choice D; normalized to preserve sequence and answer-key alignment."
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
            "Subject Area": "Physical Science",
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
        "subject_category_breakdown": {"Physical Science": len(rows)},
        "topic_breakdown": dict(topic_counts),
        "difficulty_breakdown": dict(Counter(row["Difficulty"] for row in rows)),
        "source_counts": dict(Counter(row["Source PDF"] for row in rows)),
        "suggested_supabase_mapping": {
            "exam_type": "LET Secondary",
            "exam_level": "LET Secondary",
            "subject_area": "Physical Science",
            "topic": "Physical Science",
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
        "recommended_next_action": "Upload Ready for Upload rows to LET Secondary major/physical-science, then verify live source counts and sub-tag breakdown.",
        "outputs": {"csv": str(csv_path), "json": str(json_path), "markdown": str(md_path), "summary": str(summary_path)},
    }
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


def main():
    rows = []
    next_no = 1
    expected_counts = {
        "BSED Physical Science A.pdf": 50,
        "BSED Physical Science B.pdf": 50,
        "BSED Physical Science P1.pdf": 40,
        "BSED Physical Science P2.pdf": 40,
        "BSED Physical Science P3.pdf": 40,
        "BSED Physical Science P4.pdf": 40,
        "BSED Physical Science P5.pdf": 40,
        "BSED Physical Science P6.pdf": 40,
        "BSED Physical Science P7.pdf": 40,
        "BSED Physical Science P8.pdf": 20,
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
