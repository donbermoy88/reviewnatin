#!/usr/bin/env python3
import argparse
import csv
import json
import re
import subprocess
import tempfile
import zipfile
from collections import Counter
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path("/Users/lyndon/All reviewers/Sept2026_LET Reviewer Files")
OUT_DIR = ROOT / "output/pdf"
TMP_DIR = ROOT / "tmp/pdfs/sept2026_let"
BASE = "sept2026_let_extracted_questions"
SUPPORTED_SUFFIXES = {
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".txt",
    ".md",
    ".rtf",
    ".jpg",
    ".jpeg",
    ".png",
    ".tif",
    ".tiff",
    ".bmp",
    ".webp",
}

FIELDS = [
    "No.",
    "Original No.",
    "Page",
    "Source PDF",
    "Source Type",
    "Source Path",
    "Question",
    "Passage Reference",
    "Question Image Reference",
    "Choice A",
    "Choice A Image Reference",
    "Choice B",
    "Choice B Image Reference",
    "Choice C",
    "Choice C Image Reference",
    "Choice D",
    "Choice D Image Reference",
    "Choice E",
    "Choice E Image Reference",
    "Correct Answer",
    "Explanation",
    "LET Exam Type",
    "Subject Area",
    "Topic",
    "Difficulty",
    "Has Image",
    "Duplicate Of",
    "Confidence",
    "Status",
    "Notes",
]

STATUS_VALUES = {
    "Ready for Upload",
    "Needs Review",
    "Needs Answer",
    "Duplicate",
    "Incomplete",
    "Needs Image Extraction",
    "Image Unclear",
}

VISUAL_CUE_RE = re.compile(
    r"\b("
    r"figure|diagram|chart|graph|table|map|illustration|picture|image|drawing|"
    r"shown|below|above|following illustration|following figure|refer to|based on the"
    r")\b",
    re.I,
)

OPTION_RE = re.compile(r"(?<![A-Za-z0-9.])(?:\(([A-Ea-e])\)|([A-Ea-e])[\.\)]\s+)")
QUESTION_MARKER_RE = re.compile(
    r"(?m)^\s*(?:Question\s+|Item\s+|No\.\s*)?(\d{1,4})[\.\)]\s*",
    re.I,
)
INLINE_ANSWER_RE = re.compile(
    r"\b(?:answer|ans|correct answer|key)\s*[:\-]\s*([A-Ea-e])\b",
    re.I,
)

SUBJECT_TOPICS = [
    ("Grammar", [r"\bgrammar\b", r"\bverb\b", r"\bnoun\b", r"\bpronoun\b", r"\badjective\b", r"\bsentence\b", r"\bsubject-verb\b"]),
    ("Reading Comprehension", [r"\bpassage\b", r"\bparagraph\b", r"\bmain idea\b", r"\bauthor\b", r"\binference\b"]),
    ("Vocabulary", [r"\bvocabulary\b", r"\bsynonym\b", r"\bantonym\b", r"\bmeaning\b", r"\bword\b"]),
    ("Algebra", [r"\balgebra\b", r"\bequation\b", r"\bsolve\b", r"\bvariable\b", r"\bpolynomial\b"]),
    ("Geometry", [r"\btriangle\b", r"\bcircle\b", r"\bangle\b", r"\bperimeter\b", r"\barea\b", r"\bvolume\b"]),
    ("Statistics", [r"\bmean\b", r"\bmedian\b", r"\bmode\b", r"\bprobability\b", r"\bstandard deviation\b"]),
    ("Biology", [r"\bcell\b", r"\bplant\b", r"\banimal\b", r"\bphotosynthesis\b", r"\borganism\b", r"\bgenetic\b"]),
    ("Chemistry", [r"\bchemical\b", r"\batom\b", r"\belectron\b", r"\belement\b", r"\bcompound\b", r"\bacid\b"]),
    ("Physics", [r"\bforce\b", r"\benergy\b", r"\bmotion\b", r"\bvelocity\b", r"\bcurrent\b", r"\bvoltage\b"]),
    ("Earth Science", [r"\bearth\b", r"\bvolcano\b", r"\bweather\b", r"\bclimate\b", r"\brock\b", r"\bplate tectonic\b"]),
    ("Philippine History", [r"\brizal\b", r"\bbonifacio\b", r"\baguinaldo\b", r"\brevolution\b", r"\bkatipunan\b"]),
    ("Government", [r"\bconstitution\b", r"\bgovernment\b", r"\bcongress\b", r"\bpresident\b", r"\blaw\b", r"\brepublic act\b"]),
    ("Economics", [r"\beconomy\b", r"\bsupply\b", r"\bdemand\b", r"\binflation\b", r"\bmarket\b"]),
    ("Educational Psychology", [r"\bpsychology\b", r"\bintelligence\b", r"\bmotivation\b", r"\bbehavior\b", r"\bcognitive\b"]),
    ("Learning Theories", [r"\bpiaget\b", r"\berikson\b", r"\bvygotsky\b", r"\bbandura\b", r"\bbruner\b", r"\blearning theor"]),
    ("Assessment Tools", [r"\bassessment\b", r"\btest\b", r"\bvalidity\b", r"\breliability\b", r"\brubric\b", r"\btos\b"]),
    ("Curriculum Models", [r"\bcurriculum\b", r"\bk-12\b", r"\btyler\b", r"\bubd\b", r"\bspiral\b"]),
    ("Teaching Strategies", [r"\bteaching strategy\b", r"\binstruction\b", r"\blesson\b", r"\bmethod\b", r"\bdiscussion\b"]),
    ("Classroom Management", [r"\bclassroom management\b", r"\bdiscipline\b", r"\bmisbehavior\b", r"\broutine\b"]),
    ("Early Childhood Education", [r"\bearly childhood\b", r"\bpreschool\b", r"\bkindergarten\b", r"\bplay-based\b"]),
    ("Special Needs Education", [r"\bspecial needs\b", r"\bspecial education\b", r"\bsped\b", r"\binclusive education\b", r"\bexceptional learner\b"]),
    ("Child Development", [r"\bchild\b", r"\badolescent\b", r"\bdevelopment\b", r"\bgrowth\b", r"\bpuberty\b"]),
    ("Ethics", [r"\bethics\b", r"\bcode of ethics\b", r"\bmoral\b", r"\bvalues\b", r"\bprofessional oath\b"]),
    ("ICT in Education", [r"\bcomputer\b", r"\bict\b", r"\binternet\b", r"\bsoftware\b", r"\bhardware\b", r"\beducational technology\b"]),
]


def run(args, allow_fail=False):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode and not allow_fail:
        raise RuntimeError(f"Command failed: {' '.join(map(str, args))}\n{result.stderr}")
    return result.stdout


def normalize_space(value):
    value = str(value or "").replace("\x0c", "\n")
    value = value.replace("–", "-").replace("—", "-")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return re.sub(r"\s+", " ", value).strip()


def clean_page_text(value):
    value = str(value or "").replace("\x0c", "\n")
    value = re.sub(r"(?im)^\s*page\s+\d+(?:\s+of\s+\d+)?\s*$", "", value)
    value = re.sub(r"(?m)^\s*\d+\s*$", "", value)
    value = re.sub(r"(?im)^\s*(reviewer|let reviewer|licensure examination for teachers)\s*$", "", value)
    return value.strip()


def normalize_key(value):
    return re.sub(r"[^a-z0-9]+", "", normalize_space(value).lower())


def pdf_page_count(path):
    info = run(["pdfinfo", str(path)], allow_fail=True)
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    return int(match.group(1)) if match else 0


def pdftotext_page(path, page):
    return clean_page_text(
        run(["pdftotext", "-raw", "-f", str(page), "-l", str(page), str(path), "-"], allow_fail=True)
    )


def read_pdf_pages(path):
    pages = []
    page_count = pdf_page_count(path)
    for page_no in range(1, page_count + 1):
        pages.append(pdftotext_page(path, page_no))
    return pages


def ooxml_text(path, prefixes):
    chunks = []
    with zipfile.ZipFile(path) as archive:
        names = sorted(
            name
            for name in archive.namelist()
            if any(name.startswith(prefix) for prefix in prefixes) and name.endswith(".xml")
        )
        for name in names:
            try:
                root = ET.fromstring(archive.read(name))
            except ET.ParseError:
                continue
            texts = []
            for element in root.iter():
                if element.tag.endswith("}t") and element.text:
                    texts.append(element.text)
            if texts:
                chunks.append("\n".join(texts))
    return "\n\n".join(chunks)


def read_text_file(path):
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="ignore")


def textutil_text(path):
    return run(["textutil", "-convert", "txt", "-stdout", str(path)], allow_fail=True)


def ocr_image_text(path):
    with tempfile.TemporaryDirectory(prefix="let_ocr_") as tmp:
        output_base = Path(tmp) / "ocr"
        run(["tesseract", str(path), str(output_base), "--psm", "6"], allow_fail=True)
        out = output_base.with_suffix(".txt")
        return out.read_text(encoding="utf-8", errors="ignore") if out.exists() else ""


def clean_extracted_text(value):
    value = str(value or "").replace("\x00", "")
    value = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", value)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def read_source_pages(path):
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        pages = read_pdf_pages(path)
        return pages, "pdf", len(pages)
    if suffix == ".docx":
        text = clean_extracted_text(ooxml_text(path, ["word/document"]))
        return ([text] if text else []), "docx", 1 if text else 0
    if suffix == ".pptx":
        slides = []
        with zipfile.ZipFile(path) as archive:
            names = sorted(
                name
                for name in archive.namelist()
                if name.startswith("ppt/slides/slide") and name.endswith(".xml")
            )
        for prefix in names:
            text = clean_extracted_text(ooxml_text(path, [prefix]))
            slides.append(text)
        return [slide for slide in slides if slide], "pptx", len(slides)
    if suffix in {".doc", ".ppt", ".rtf"}:
        text = clean_extracted_text(textutil_text(path))
        return ([text] if text else []), suffix.lstrip("."), 1 if text else 0
    if suffix in {".txt", ".md"}:
        text = clean_extracted_text(read_text_file(path))
        return ([text] if text else []), suffix.lstrip("."), 1 if text else 0
    if suffix in {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}:
        text = clean_extracted_text(ocr_image_text(path))
        return ([text] if text else []), "image", 1 if text else 0
    return [], suffix.lstrip(".") or "unknown", 0


def page_image_counts(path, page_count):
    if path.suffix.lower() != ".pdf":
        return Counter()
    counts = Counter()
    output = run(["pdfimages", "-list", str(path)], allow_fail=True)
    for line in output.splitlines():
        parts = line.split()
        if not parts or not parts[0].isdigit():
            continue
        page = int(parts[0])
        if page <= 0 or page > page_count:
            continue
        width = int(parts[3]) if len(parts) > 4 and parts[3].isdigit() else 0
        height = int(parts[4]) if len(parts) > 5 and parts[4].isdigit() else 0
        # Tiny repeated assets are usually bullets, logos, or watermarks.
        if width >= 80 and height >= 60:
            counts[page] += 1
    return counts


def page_offsets(pages):
    offsets = []
    cursor = 0
    chunks = []
    for text in pages:
        offsets.append(cursor)
        chunks.append(text)
        cursor += len(text) + 2
    return "\n\n".join(chunks), offsets


def page_for_offset(offsets, offset):
    page = 1
    for idx, start in enumerate(offsets, 1):
        if start <= offset:
            page = idx
        else:
            break
    return page


def page_range_for_offsets(offsets, start, end):
    first = page_for_offset(offsets, start)
    last = page_for_offset(offsets, max(start, end - 1))
    return str(first) if first == last else f"{first}-{last}"


def split_numbered_blocks(text, max_jump=8):
    markers = []
    expected = None
    for match in QUESTION_MARKER_RE.finditer(text):
        qnum = int(match.group(1))
        if qnum == 0:
            continue
        if expected is not None:
            if qnum < expected - 1:
                continue
            if qnum > expected + max_jump:
                continue
        markers.append((match.start(), match.end(), qnum))
        expected = qnum + 1
    blocks = []
    for idx, (start, marker_end, qnum) in enumerate(markers):
        end = markers[idx + 1][0] if idx + 1 < len(markers) else len(text)
        blocks.append((qnum, start, marker_end, end, text[start:end]))
    return blocks


def split_question_and_choices(block):
    block = clean_page_text(block)
    block = re.sub(r"^\s*(?:Question\s+|Item\s+|No\.\s*)?\d{1,4}[\.\)]\s*", "", block, flags=re.I)
    block = re.sub(r"\b(?:Answer|Ans|Correct Answer)\s*[:\-]\s*[A-Ea-e]\b.*$", "", block, flags=re.I | re.S)
    text = normalize_space(block)
    markers = []
    for match in OPTION_RE.finditer(text):
        letter = (match.group(1) or match.group(2) or "").upper()
        if letter in "ABCDE":
            markers.append((match.start(), match.end(), letter))
    if not markers:
        return text, {}
    question = normalize_space(text[: markers[0][0]])
    choices = {}
    for idx, (_, end, letter) in enumerate(markers):
        next_start = markers[idx + 1][0] if idx + 1 < len(markers) else len(text)
        value = normalize_space(text[end:next_start])
        value = re.sub(r"\b(?:Answer|Ans|Correct Answer)\s*[:\-].*$", "", value, flags=re.I).strip()
        choices[letter] = value
    return question, choices


def parse_answer_key(text):
    answers = {}
    key_idx = -1
    for marker in ["answer key", "answers:", "correct answers", "sagot"]:
        idx = text.lower().rfind(marker)
        key_idx = max(key_idx, idx)
    key_text = text[key_idx:] if key_idx >= 0 else ""
    if not key_text:
        return answers, "", -1

    for qnum, letter in re.findall(r"(?<!\d)(\d{1,4})\s*[\.\)\-:–—]?\s*([A-Ea-e])(?:\b|[\s,;\|])", key_text):
        answers[int(qnum)] = letter.upper()
    return answers, "Correct answer sourced from detected answer key section.", key_idx


def inline_answer(block):
    match = INLINE_ANSWER_RE.search(block)
    return match.group(1).upper() if match else ""


def infer_exam_type(path):
    text = str(path).lower()
    if "beed&bsed" in text or "beed-bsed" in text or "beed & bsed" in text:
        return "Both", "Path explicitly groups BEED and BSED."
    if re.search(r"\b(gen ed|gened|general education)\b", text):
        return "Both", "Path identifies LET General Education, which applies to both Elementary and Secondary LET tracks."
    if re.search(r"\b(prof ed|profed|professional education)\b", text):
        return "Both", "Path identifies LET Professional Education, which applies to both Elementary and Secondary LET tracks."
    if re.search(r"\bmajor subjects?\b|\barea of specialization\b", text):
        return "LET Secondary", "Path identifies a LET Secondary major/specialization source."
    if re.search(r"(?:^|[/\\])a\.\s*english(?:[/\\]|$)|english booster drill|english q\s*&\s*a drills|english major", text):
        return "LET Secondary", "Path identifies a LET Secondary English major source."
    if re.search(r"(?:^|[/\\])b\.\s*filipino(?:[/\\]|$)|filipino major|filipino part|filipino mock test", text):
        return "LET Secondary", "Path identifies a LET Secondary Filipino major source."
    if "beed" in text or "elementary" in text:
        return "LET Elementary", "Path indicates BEED/Elementary."
    if "bsed" in text or "secondary" in text:
        return "LET Secondary", "Path indicates BSED/Secondary."
    return "Cannot Determine", "No clear Elementary/Secondary indicator in source path."


def source_relative_path(path, source_root):
    try:
        return path.relative_to(source_root.parent)
    except ValueError:
        try:
            return path.relative_to(source_root)
        except ValueError:
            return path


def infer_subject_area(path, question_text):
    path_text = str(path).lower()
    filename = Path(path).name.lower()
    parent_text = " ".join(Path(path).parts[-3:]).lower()
    text = f"{parent_text} {filename} {question_text}".lower()
    compact_filename = re.sub(r"[^a-z0-9]+", "", filename)
    compact_text = re.sub(r"[^a-z0-9]+", "", text)
    if re.search(r"gened|gen ed|general education", filename) or "gened" in compact_filename or "generaleducation" in compact_filename:
        return "General Education"
    if (
        re.search(r"profed|prof ed|professional education", filename)
        or "profed" in compact_filename
        or "professionaleducation" in compact_filename
    ):
        if re.search(r"caad|child and adolescent", filename) or "childandadolescent" in compact_filename:
            return "Child and Adolescent Development"
        if re.search(r"\bfl\b|facilitating learning", filename) or "facilitatinglearning" in compact_filename:
            return "Facilitating Learning"
        return "Professional Education"
    if re.search(r"early childhood|\bece\b|preschool|kindergarten", path_text) or "earlychildhood" in compact_text:
        return "Early Childhood Education"
    if re.search(r"special needs|special education|\bsped\b", path_text) or "specialneeds" in compact_text or "specialeducation" in compact_text:
        return "Special Needs Education"
    ordered = [
        ("Child and Adolescent Development", [r"caad", r"child and adolescent"]),
        ("Facilitating Learning", [r"facilitating learning", r"\bfl\b"]),
        ("Educational Technology", [r"educational technology", r"edtech"]),
        ("Assessment of Learning", [r"assessment"]),
        ("Curriculum Development", [r"curriculum"]),
        ("English", [r"\benglish\b"]),
        ("Filipino", [r"\bfilipino\b"]),
        ("Mathematics", [r"\bmathematics\b", r"\bmath\b"]),
        ("Biological Science", [r"biological science", r"\bbiology\b"]),
        ("Physical Science", [r"physical science"]),
        ("Science", [r"general science", r"\bscience\b"]),
        ("Social Studies", [r"social science", r"social studies"]),
        ("Values Education", [r"values education", r"values ed"]),
        ("Music", [r"\bmusic\b"]),
        ("Arts", [r"\barts\b", r"culture and arts"]),
        ("Physical Education", [r"physical education", r"physical ed"]),
        ("Health", [r"\bhealth\b"]),
        ("Technology and Livelihood Education", [r"tled", r"\btle\b", r"technology-vocational", r"home economics", r"industrial arts"]),
        ("Agriculture and Fishery Arts", [r"agriculture", r"fishery"]),
        ("Information and Communication Technology", [r"\bict\b", r"information and communication"]),
        ("Early Childhood Education", [r"early childhood", r"\bece\b", r"preschool", r"kindergarten"]),
        ("Special Needs Education", [r"special needs", r"special education", r"\bsped\b", r"exceptional learner"]),
        ("General Education", [r"gened", r"gen ed", r"general education"]),
        ("Professional Education", [r"profed", r"prof ed", r"professional education", r"teaching profession"]),
    ]
    for subject, patterns in ordered:
        if any(re.search(pattern, text) for pattern in patterns):
            return subject
    if (
        "beed&bsed gened & profed" in path_text
        or "beedbsedletdrillsbooster" in compact_text
        or "beedbsedreviewerbooks" in compact_text
        or "freebiesbeedbsed" in compact_text
    ):
        if re.search(r"\b(teacher|learner|classroom|curriculum|assessment|instruction|learning|school)\b", question_text, re.I):
            return "Professional Education"
        return "General Education"
    return "Cannot Determine"


def infer_topic(subject, question_text):
    if subject == "Early Childhood Education":
        return "Early Childhood Education"
    if subject == "Special Needs Education":
        return "Special Needs Education"
    text = f"{subject} {question_text}".lower()
    for topic, patterns in SUBJECT_TOPICS:
        if any(re.search(pattern, text) for pattern in patterns):
            return topic
    if subject in {"Cannot Determine", "Other / Needs Review"}:
        return "Cannot Determine"
    return "Needs Review"


def detect_passage(question, original_no, page):
    if re.search(r"\b(read|selection|passage|poem|paragraph|article)\b", question, re.I):
        return f"passage_page_{int(str(page).split('-')[0]):02d}_q{original_no}"
    return ""


def confidence_for(row, answer_source):
    score = 0.95
    if row["Status"] in {"Incomplete", "Needs Review", "Needs Image Extraction", "Image Unclear"}:
        score -= 0.25
    if row["LET Exam Type"] == "Cannot Determine" or row["Subject Area"] == "Cannot Determine":
        score -= 0.2
    if not row["Correct Answer"]:
        score -= 0.18
    if not answer_source:
        score -= 0.05
    if len(row["Question"]) < 20:
        score -= 0.2
    return f"{max(0.05, min(score, 0.99)):.2f}"


def status_for(row, image_counts_for_page):
    if row["Duplicate Of"]:
        return "Duplicate"
    choices = [row[f"Choice {letter}"] for letter in "ABCD"]
    if not row["Question"] or any(not value for value in choices):
        return "Incomplete"
    if row["Question Image Reference"] or any(row[f"Choice {letter} Image Reference"] for letter in "ABCDE"):
        return "Needs Image Extraction"
    if (
        row["LET Exam Type"] == "Cannot Determine"
        or row["Subject Area"] == "Cannot Determine"
        or "Cannot Determine" in row["Subject Area"]
    ):
        return "Needs Review"
    if row["LET Exam Type"] == "Both" and row["Subject Area"] in {"Arts", "Music", "Physical Education", "Health"}:
        return "Needs Review"
    if re.search(r"[�□]{1,}|_{3,}", row["Question"]):
        return "Needs Review"
    if not row["Correct Answer"]:
        return "Needs Answer"
    if row["Correct Answer"].upper() not in {letter for letter in "ABCDE" if row.get(f"Choice {letter}")}:
        return "Needs Review"
    if image_counts_for_page > 0 and VISUAL_CUE_RE.search(row["Question"]):
        return "Needs Image Extraction"
    return "Ready for Upload"


def make_image_reference(page, qnum, kind="question", choice=""):
    page_token = f"{int(str(page).split('-')[0]):02d}"
    if kind == "choice":
        return f"choice_{choice}_image_page_{page_token}_q{qnum}"
    return f"question_image_page_{page_token}_q{qnum}"


def extract_source(path, source_root):
    pages, source_type, source_units = read_source_pages(path)
    if not pages:
        return [], {"path": str(path), "source_type": source_type, "status": "no_text", "rows": 0, "pages": source_units}
    text, offsets = page_offsets(pages)
    answer_key, answer_note, answer_key_idx = parse_answer_key(text)
    page_images = page_image_counts(path, len(pages))
    relative_path = source_relative_path(path, source_root)
    exam_type, exam_note = infer_exam_type(relative_path)
    rows = []
    question_text = text[:answer_key_idx] if answer_key_idx >= 0 and len(answer_key) >= 3 else text

    for qnum, start, _, end, block in split_numbered_blocks(question_text):
        question, choices = split_question_and_choices(block)
        if not question and not choices:
            continue
        page = page_range_for_offsets(offsets, start, end)
        answer = answer_key.get(qnum, "") or inline_answer(block)
        answer_source = answer_note if answer_key.get(qnum, "") else ("Correct answer embedded inline." if answer else "")
        subject = infer_subject_area(relative_path, question)
        topic = infer_topic(subject, question)
        passage_ref = detect_passage(question, qnum, page)
        image_count = page_images.get(int(str(page).split("-")[0]), 0)
        question_image_ref = ""
        has_image = "No"
        notes = [exam_note]
        if answer_source:
            notes.append(answer_source)
        elif "answer" in text.lower():
            notes.append("Answer key exists in source text but this item was not matched confidently.")
        else:
            notes.append("No answer key or embedded answer was matched for this item.")
        if image_count > 0 and VISUAL_CUE_RE.search(question):
            question_image_ref = make_image_reference(page, qnum)
            has_image = "Yes"
            notes.append(
                "Source page contains image objects and the item has visual-reference language; crop must be reviewed/extracted manually."
            )
        elif image_count > 0:
            notes.append("Source page contains image objects, but no explicit visual dependency was detected for this item.")

        row = {
            "No.": "",
            "Original No.": str(qnum),
            "Page": page,
            "Source PDF": path.name,
            "Source Type": source_type,
            "Source Path": str(path),
            "Question": normalize_space(question),
            "Passage Reference": passage_ref,
            "Question Image Reference": question_image_ref,
            "Choice A": normalize_space(choices.get("A", "")),
            "Choice A Image Reference": "",
            "Choice B": normalize_space(choices.get("B", "")),
            "Choice B Image Reference": "",
            "Choice C": normalize_space(choices.get("C", "")),
            "Choice C Image Reference": "",
            "Choice D": normalize_space(choices.get("D", "")),
            "Choice D Image Reference": "",
            "Choice E": normalize_space(choices.get("E", "")),
            "Choice E Image Reference": "",
            "Correct Answer": answer,
            "Explanation": "",
            "LET Exam Type": exam_type,
            "Subject Area": subject,
            "Topic": topic,
            "Difficulty": "Cannot Determine",
            "Has Image": has_image,
            "Duplicate Of": "",
            "Confidence": "",
            "Status": "",
            "Notes": normalize_space(" ".join(notes)),
        }
        row["Status"] = status_for(row, image_count)
        row["Confidence"] = confidence_for(row, answer_source)
        rows.append(row)

    return rows, {
        "path": str(path),
        "source_type": source_type,
        "status": "processed" if rows else "no_questions_found",
        "rows": len(rows),
        "pages": len(pages) if source_type == "pdf" else source_units,
        "images_by_page": dict(page_images),
    }


def mark_duplicates(rows):
    exact = {}
    candidates_by_bucket = {}
    for row in rows:
        key = normalize_key(row["Question"])
        if not key:
            continue
        duplicate_of = exact.get(key)
        if duplicate_of:
            row["Duplicate Of"] = duplicate_of
            row["Status"] = "Duplicate"
            row["Notes"] = normalize_space(row["Notes"] + f" Duplicate or near-duplicate of row {duplicate_of}.")
            continue
        bucket = (key[:36], len(key) // 40)
        for previous_key, previous_no in candidates_by_bucket.get(bucket, [])[-50:]:
            if len(key) >= 40 and (key.startswith(previous_key[: max(40, int(len(previous_key) * 0.9))]) or previous_key.startswith(key[: max(40, int(len(key) * 0.9))])):
                row["Duplicate Of"] = previous_no
                row["Status"] = "Duplicate"
                row["Notes"] = normalize_space(row["Notes"] + f" Duplicate or near-duplicate of row {previous_no}.")
                break
        if not row["Duplicate Of"]:
            exact[key] = row["No."]
            candidates_by_bucket.setdefault(bucket, []).append((key, row["No."]))


def write_outputs(rows, summary, output_base):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUT_DIR / f"{output_base}.csv"
    json_path = OUT_DIR / f"{output_base}.json"
    md_path = OUT_DIR / f"{output_base}.md"
    summary_path = OUT_DIR / f"{output_base}_summary.json"

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    json_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    def esc(value):
        return str(value or "").replace("|", "\\|").replace("\n", "<br>")

    lines = ["| " + " | ".join(FIELDS) + " |", "| " + " | ".join(["---"] * len(FIELDS)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"csv": str(csv_path), "json": str(json_path), "md": str(md_path), "summary": str(summary_path)}


def build_summary(rows, sources, output_paths, input_dir, batch_size):
    status_counts = Counter(row["Status"] for row in rows)
    exam_counts = Counter(row["LET Exam Type"] for row in rows)
    subject_counts = Counter(row["Subject Area"] for row in rows)
    difficulty_counts = Counter(row["Difficulty"] for row in rows)
    source_counts = Counter(row["Source PDF"] for row in rows)
    source_type_counts = Counter(source.get("source_type", "unknown") for source in sources)
    batches = []
    processed_sources = [source for source in sources if source["status"] in {"processed", "no_questions_found"}]
    if batch_size:
        for idx in range(0, len(processed_sources), batch_size):
            batch_sources = processed_sources[idx : idx + batch_size]
            source_paths = {source["path"] for source in batch_sources}
            batch_rows = [row for row in rows if row["Source Path"] in source_paths]
            pages = sum(source.get("pages", 0) for source in batch_sources)
            batches.append(
                {
                    "batch": len(batches) + 1,
                    "files_processed": len(batch_sources),
                    "pages_or_units_processed": pages,
                    "question_numbers_processed": {
                        source["path"]: [row["Original No."] for row in batch_rows if row["Source Path"] == source["path"]]
                        for source in batch_sources
                    },
                    "questions_extracted": len(batch_rows),
                    "questions_needing_review": sum(
                        1 for row in batch_rows if row["Status"] in {"Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"}
                    ),
                    "questions_with_images": sum(1 for row in batch_rows if row["Has Image"] == "Yes"),
                    "remaining_files_after_batch": max(0, len(processed_sources) - (idx + len(batch_sources))),
                }
            )

    return {
        "input_dir": str(input_dir),
        "generated_at": "2026-06-23",
        "total_files_seen": len(sources),
        "total_files_processed": sum(1 for source in sources if source["status"] == "processed"),
        "source_type_counts": dict(source_type_counts),
        "total_pdfs_seen": source_type_counts.get("pdf", 0),
        "total_pdfs_processed": sum(1 for source in sources if source["status"] == "processed" and source.get("source_type") == "pdf"),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(status_counts.get(status, 0) for status in ["Needs Review", "Incomplete", "Needs Image Extraction", "Image Unclear"]),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_duplicates_detected": status_counts.get("Duplicate", 0),
        "total_questions_with_images": sum(1 for row in rows if row["Has Image"] == "Yes"),
        "total_questions_with_image_based_answer_choices": sum(
            1 for row in rows if any(row.get(f"Choice {letter} Image Reference") for letter in "ABCDE")
        ),
        "total_elementary_questions": exam_counts.get("LET Elementary", 0),
        "total_secondary_questions": exam_counts.get("LET Secondary", 0),
        "total_both_or_cannot_determine_questions": exam_counts.get("Both", 0) + exam_counts.get("Cannot Determine", 0),
        "status_counts": dict(status_counts),
        "exam_type_counts": dict(exam_counts),
        "subject_category_breakdown": dict(subject_counts),
        "difficulty_breakdown": dict(difficulty_counts),
        "source_counts_top_50": dict(source_counts.most_common(50)),
        "batches": batches,
        "sources": sources,
        "outputs": output_paths,
        "suggested_supabase_table_mapping": {
            "exam_type": "LET Exam Type",
            "exam_level": "LET Exam Type",
            "subject_area": "Subject Area",
            "topic": "Topic",
            "question_text": "Question",
            "passage_text": "Passage Reference (resolve/review manually when populated)",
            "question_image_url": "Question Image Reference",
            "choice_a_text": "Choice A",
            "choice_a_image_url": "Choice A Image Reference",
            "choice_b_text": "Choice B",
            "choice_b_image_url": "Choice B Image Reference",
            "choice_c_text": "Choice C",
            "choice_c_image_url": "Choice C Image Reference",
            "choice_d_text": "Choice D",
            "choice_d_image_url": "Choice D Image Reference",
            "choice_e_text": "Choice E",
            "choice_e_image_url": "Choice E Image Reference",
            "correct_answer": "Correct Answer",
            "explanation": "Explanation",
            "difficulty": "Difficulty",
            "source_file": "Source PDF",
            "source_type": "Source Type",
            "source_page": "Page",
            "original_question_number": "Original No.",
            "duplicate_of": "Duplicate Of",
            "confidence_score": "Confidence",
            "status": "Status",
            "notes": "Notes",
        },
        "recommended_next_action_before_uploading": (
            "Upload only Ready for Upload rows. Review Needs Answer, Needs Review, Incomplete, and Needs Image Extraction rows "
            "against the source files first; extract visual crops for populated image references before any Supabase import."
        ),
    }


def main():
    parser = argparse.ArgumentParser(description="Extract LET questions from a reviewer source folder.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Folder containing LET reviewer source files.")
    parser.add_argument("--output-base", default=BASE, help="Output filename base under output/pdf.")
    parser.add_argument("--start-index", type=int, default=1, help="1-based source-file index to start from after sorting.")
    parser.add_argument("--max-pdfs", type=int, default=0, help="Deprecated alias for --max-files.")
    parser.add_argument("--max-files", type=int, default=0, help="Maximum source files to process. 0 means all.")
    parser.add_argument("--batch-size", type=int, default=25, help="Batch size used for summary reporting.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir}")

    TMP_DIR.mkdir(parents=True, exist_ok=True)
    source_files = sorted([path for path in input_dir.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES])
    selected = source_files[max(args.start_index - 1, 0) :]
    max_files = args.max_files or args.max_pdfs
    if max_files:
        selected = selected[:max_files]

    rows = []
    source_summaries = []
    for path in selected:
        try:
            extracted, source = extract_source(path, input_dir)
            rows.extend(extracted)
            source_summaries.append(source)
            print(json.dumps({"processed": str(path), "type": source.get("source_type"), "rows": len(extracted), "pages": source.get("pages", 0)}), flush=True)
        except Exception as exc:
            source_summaries.append({"path": str(path), "source_type": path.suffix.lower().lstrip(".") or "unknown", "status": "error", "rows": 0, "pages": 0, "error": str(exc)})
            print(json.dumps({"error": str(path), "message": str(exc)}), flush=True)

    for idx, row in enumerate(rows, 1):
        row["No."] = str(idx)
    mark_duplicates(rows)
    for row in rows:
        row["Confidence"] = confidence_for(row, row["Correct Answer"])
        if row["Status"] not in STATUS_VALUES:
            row["Status"] = "Needs Review"

    summary_shell = {"pending": True}
    output_paths = write_outputs(rows, summary_shell, args.output_base)
    summary = build_summary(rows, source_summaries, output_paths, input_dir, args.batch_size)
    output_paths = write_outputs(rows, summary, args.output_base)
    summary["outputs"] = output_paths
    (OUT_DIR / f"{args.output_base}_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
