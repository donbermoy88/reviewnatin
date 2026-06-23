#!/usr/bin/env python3
import csv
import html
import json
import re
import subprocess
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/pdf"
TMP_DIR = ROOT / "tmp/pdfs/let_answer_resolution"

FILES = [
    OUT_DIR / "let_elementary_secondary_extracted_questions.json",
    OUT_DIR / "let_reviewer_2026_batch2_extracted_questions.json",
]

FIELDS = [
    "No.",
    "Page",
    "Source PDF",
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

SOURCE_PATHS = {
    "6. LET PROF ED Q&A.pdf": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/6. LET PROF ED Q&A.pdf",
    "16. 200-ITEMS-BEED-WITH-ANSWER-KEY.pdf": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/B. PROFESSIONAL EDUCATION/PROF ED DRILLS & NOTES/16. 200-ITEMS-BEED-WITH-ANSWER-KEY.pdf",
    "1. FINAL COACHING WITH ANSWER KEY.pdf": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/1. FINAL COACHING WITH ANSWER KEY.pdf",
    "Updated Prof-Ed-139-items.pdf": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/2025-2026 UPDATE (GEN ED AND PROF ED)/Updated Prof-Ed-139-items.pdf",
    "Updated Prof-Ed-150-items.pdf": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/2025-2026 UPDATE (GEN ED AND PROF ED)/Updated Prof-Ed-150-items.pdf",
    "Part 8 General Education (200 Items).pdf": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/E. UPLOADS/1. GEN. ED & PROF. ED (New-Old Curriculum) (BEED-BSED)/GENERAL EDUCATION/Part 8 General Education (200 Items).pdf",
    "3. GEN-ED_PROF_ED.pdf": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/3. GEN-ED_PROF_ED.pdf",
    "1. FINAL COACHING.pdf": "/Users/lyndon/All reviewers/-LET REVIEWER 2026/G. FINAL COACHING (BEED-BSED)/1. FINAL COACHING.pdf",
}

SOURCE_BACKED_REPAIRS = {
    ("6. LET PROF ED Q&A.pdf", 163): {
        "answer": "C",
        "choices": {"C": "B. F. Skinner's Operant Conditioning Theory"},
        "note": "Correct answer recovered from the bolded C choice in the PDF; repaired choice text split by extraction.",
    },
    ("Updated Prof-Ed-150-items.pdf", 21): {
        "answer": "A",
        "note": "Correct answer matched from trailing answer-key text: No, without the consent of the school head.",
    },
    ("Updated Prof-Ed-150-items.pdf", 28): {
        "answer": "C",
        "note": "Correct answer matched from trailing answer-key text: Existentialism.",
    },
    ("1. FINAL COACHING WITH ANSWER KEY.pdf", 113): {
        "answer": "D",
        "choices": {"C": "Sharpening", "D": "Analysis"},
        "note": "Correct answer recovered from the bolded D choice in the PDF; repaired merged C/D choice text.",
    },
    ("Updated Prof-Ed-139-items.pdf", 20): {"answer": "A", "note": "Correct answer recovered from the yellow-highlighted A choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 23): {
        "answer": "A",
        "choices": {"A": "causal relationship"},
        "note": "Correct answer recovered from the yellow-highlighted A choice in the PDF render; repaired blank A choice text.",
    },
    ("Updated Prof-Ed-139-items.pdf", 33): {"answer": "A", "note": "Correct answer recovered from the yellow-highlighted A choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 38): {"answer": "A", "note": "Correct answer recovered from the yellow-highlighted A choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 46): {"answer": "D", "note": "Correct answer recovered from the yellow-highlighted D choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 54): {"answer": "A", "note": "Correct answer recovered from the yellow-highlighted A choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 60): {"answer": "A", "note": "Correct answer recovered from the yellow-highlighted A choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 61): {"answer": "C", "note": "Correct answer recovered from the yellow-highlighted C choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 65): {"answer": "A", "note": "Correct answer recovered from the yellow-highlighted A choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 85): {"answer": "A", "note": "Correct answer recovered from the yellow-highlighted A choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 89): {"answer": "B", "note": "Correct answer recovered from the yellow-highlighted B choice in the PDF render."},
    ("Updated Prof-Ed-139-items.pdf", 93): {
        "answer": "B",
        "choices": {"A": "demonstration", "B": "direct purposeful experience"},
        "note": "Correct answer recovered from the yellow-highlighted B choice in the PDF render; repaired merged A/B choice text.",
    },
}


def sh(args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def norm_space(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def norm_key(value):
    return re.sub(r"[^a-z0-9]+", "", norm_space(value).lower())


def norm_words(value):
    return re.sub(r"[^a-z0-9]+", " ", norm_space(value).lower()).strip()


def choice_text(row, letter):
    field = "Choice E if there is" if letter == "E" else f"Choice {letter}"
    return norm_space(row.get(field, ""))


def set_choice(row, letter, value):
    field = "Choice E if there is" if letter == "E" else f"Choice {letter}"
    row[field] = norm_space(value)


def note(row, text):
    row["Notes"] = norm_space(f"{row.get('Notes', '')} {text}")


def set_ready(row, answer, source_note, explanation=None):
    if answer not in "ABCDE" or not choice_text(row, answer):
        return False
    row["Correct Answer"] = answer
    if explanation is not None and not row.get("Explanation"):
        row["Explanation"] = norm_space(explanation)
    row["Status"] = "Ready for Upload"
    note(row, source_note)
    return True


def parse_xml_text(path, extra_args=None):
    args = ["pdftohtml"]
    if extra_args:
        args.extend(extra_args)
    args.extend(["-xml", "-i", str(path), "-stdout"])
    xml = sh(args)
    fonts = {m.group(1): m.group(0) for m in re.finditer(r'<fontspec id="(\d+)"[^>]*/>', xml)}
    pages = []
    for pm in re.finditer(r'<page number="(\d+)"[^>]*height="(\d+)" width="(\d+)".*?</page>', xml, re.S):
        page_no, height, width = map(int, pm.groups())
        elems = []
        for tm in re.finditer(r"<text\s+([^>]*)>(.*?)</text>", pm.group(0), re.S):
            attrs = dict(re.findall(r'(\w+)="([^"]*)"', tm.group(1)))
            raw = tm.group(2)
            text = html.unescape(re.sub(r"<[^>]+>", "", raw)).strip()
            if not text:
                continue
            font = fonts.get(attrs.get("font", ""), "")
            elems.append(
                {
                    "page": page_no,
                    "top": int(attrs.get("top", 0)),
                    "left": int(attrs.get("left", 0)),
                    "width": int(attrs.get("width", 0)),
                    "height": int(attrs.get("height", 0)),
                    "text": text,
                    "bold": "<b>" in raw or "Bold" in font or 'color="#ff0000"' in font.lower(),
                }
            )
        pages.append({"page": page_no, "height": height, "width": width, "elems": elems})
    return pages


def bold_choice_answers(path, max_q=300):
    pages = parse_xml_text(path)
    elems = []
    for page in pages:
        for elem in page["elems"]:
            elem = dict(elem)
            elem["gy"] = elem["page"] * 10000 + elem["top"]
            elems.append(elem)
    elems.sort(key=lambda e: (e["gy"], e["left"]))

    qmarks = []
    last_q = 0
    for idx, elem in enumerate(elems):
        m = re.match(r"^\s*(\d{1,3})\.\s*", elem["text"])
        if m and elem["left"] < 250:
            qnum = int(m.group(1))
            if 1 <= qnum <= max_q and qnum >= last_q:
                qmarks.append((qnum, idx))
                last_q = qnum

    answers = {}
    for idx, (qnum, start) in enumerate(qmarks):
        block = elems[start : qmarks[idx + 1][1] if idx + 1 < len(qmarks) else len(elems)]
        markers = []
        for bidx, elem in enumerate(block):
            if elem["left"] > 800:
                continue
            for mm in re.finditer(r"(^|\s)([A-Da-d])\.\s*", elem["text"]):
                if mm.start() > 3 and elem["text"][: mm.start()].strip():
                    continue
                markers.append(
                    {
                        "letter": mm.group(2).upper(),
                        "idx": bidx,
                        "gy": elem["gy"],
                        "left": elem["left"] + mm.start() * 5,
                    }
                )
        if not markers:
            continue
        scores = {}
        marker_only = []
        for elem in block:
            if not elem["bold"]:
                continue
            candidates = [
                marker
                for marker in markers
                if marker["gy"] < elem["gy"] or (abs(marker["gy"] - elem["gy"]) <= 5 and marker["left"] <= elem["left"] + 5)
            ]
            if not candidates:
                continue
            marker = max(candidates, key=lambda item: (item["gy"], item["left"]))
            content = re.sub(r"^\s*[A-Da-d]\.\s*", "", elem["text"]).strip()
            if content:
                scores[marker["letter"]] = scores.get(marker["letter"], 0) + len(content)
            else:
                marker_only.append(marker["letter"])
        if scores:
            best_letter, best_score = max(scores.items(), key=lambda item: item[1])
            if list(scores.values()).count(best_score) == 1:
                answers[qnum] = best_letter
        else:
            distinct = list(dict.fromkeys(marker_only))
            if len(distinct) == 1:
                answers[qnum] = distinct[0]
    return answers


def text_answer_key(path, marker=None):
    text = sh(["pdftotext", "-raw", str(path), "-"])
    if marker:
        idx = text.lower().find(marker.lower())
        if idx >= 0:
            text = text[idx:]
    answers = {}
    for qnum, value in re.findall(r"(?<!\d)(\d{1,4})\.?\s*(?:\|\s*)?(NO ANSWER|no answer|[A-Ea-e?–-])(?:\b|[\.\s|])", text):
        value = value.strip()
        if value.upper() in {"?", "–", "-"} or value.lower() == "no answer":
            continue
        answers[int(qnum)] = value.upper()
    return answers


def highlighted_choice_records(path, slug):
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    prefix = TMP_DIR / slug
    for old in TMP_DIR.glob(f"{slug}-*.png"):
        old.unlink()
    subprocess.run(["pdftoppm", "-png", "-r", "120", str(path), str(prefix)], check=True, stdout=subprocess.DEVNULL)
    pages = parse_xml_text(path)
    records = []

    def yellow_ratio(image, box):
        pixels = list(image.crop(box).getdata())
        if not pixels:
            return 0
        return sum(1 for r, g, b in pixels if r > 170 and g > 150 and b < 130 and r - g < 120) / len(pixels)

    for page in pages:
        image_path = TMP_DIR / f"{slug}-{page['page']:02d}.png"
        if not image_path.exists():
            image_path = TMP_DIR / f"{slug}-{page['page']}.png"
        if not image_path.exists():
            continue
        image = Image.open(image_path).convert("RGB")
        sx = image.width / page["width"]
        sy = image.height / page["height"]
        elems = []
        for elem in page["elems"]:
            elem = dict(elem)
            elem["col"] = 0 if elem["left"] < page["width"] / 2 else 1
            elems.append(elem)
        for col in [0, 1]:
            col_elems = sorted([elem for elem in elems if elem["col"] == col], key=lambda item: (item["top"], item["left"]))
            qmarks = []
            for idx, elem in enumerate(col_elems):
                m = re.match(r"^(\d{1,3})\.\s*", elem["text"])
                if m and 1 <= int(m.group(1)) <= 300:
                    qmarks.append((int(m.group(1)), idx))
            for qidx, (qnum, start) in enumerate(qmarks):
                block = col_elems[start : qmarks[qidx + 1][1] if qidx + 1 < len(qmarks) else len(col_elems)]
                first_option = next(
                    (
                        idx
                        for idx, elem in enumerate(block)
                        if re.match(r"^[A-D]\.\s*", elem["text"]) or re.match(r"^\.\s*D\.\s*", elem["text"])
                    ),
                    None,
                )
                question_text = " ".join(elem["text"] for elem in (block[:first_option] if first_option is not None else block))
                highlighted = []
                for elem in block:
                    m = re.match(r"^\.\s*([A-D])\.\s*|^([A-D])\.\s*", elem["text"])
                    if not m:
                        continue
                    letter = (m.group(1) or m.group(2)).upper()
                    x0 = max(0, int((elem["left"] - 5) * sx))
                    y0 = max(0, int((elem["top"] - 3) * sy))
                    x1 = min(image.width, int((elem["left"] + elem["width"] + 8) * sx))
                    y1 = min(image.height, int((elem["top"] + elem["height"] + 3) * sy))
                    if yellow_ratio(image, (x0, y0, x1, y1)) > 0.2:
                        highlighted.append(letter)
                highlighted = list(dict.fromkeys(highlighted))
                if len(highlighted) == 1:
                    records.append({"qnum": qnum, "answer": highlighted[0], "question": question_text, "page": page["page"]})
    return records


def bullet_choice_records(path):
    pages = parse_xml_text(path, ["-nodrm"])
    records = []
    for page in pages:
        elems = []
        for elem in page["elems"]:
            elem = dict(elem)
            elem["col"] = 0 if elem["left"] < page["width"] / 2 else 1
            elems.append(elem)
        for col in [0, 1]:
            col_elems = sorted([elem for elem in elems if elem["col"] == col], key=lambda item: (item["top"], item["left"]))
            qmarks = []
            for idx, elem in enumerate(col_elems):
                m = re.match(r"^(\d{1,3})\.\s*", elem["text"])
                if m and 1 <= int(m.group(1)) <= 300:
                    qmarks.append((int(m.group(1)), idx))
            for qidx, (qnum, start) in enumerate(qmarks):
                block = col_elems[start : qmarks[qidx + 1][1] if qidx + 1 < len(qmarks) else len(col_elems)]
                markers = []
                for idx, elem in enumerate(block):
                    m = re.match(r"^([A-Da-d])\.\s*", elem["text"])
                    if m:
                        markers.append((idx, m.group(1).upper()))
                letters = []
                for idx, elem in enumerate(block):
                    if not re.search(r"[•●]{2,}|\*{2,}", elem["text"]):
                        continue
                    previous = [marker for marker in markers if marker[0] <= idx]
                    if previous:
                        letters.append(previous[-1][1])
                letters = list(dict.fromkeys(letters))
                if len(letters) == 1:
                    qtext = " ".join(elem["text"] for elem in block[: markers[0][0]]) if markers else ""
                    records.append({"qnum": qnum, "answer": letters[0], "question": qtext, "page": page["page"]})
    return records


def best_record_for_row(row, records):
    candidates = [record for record in records if record["qnum"] == row.get("source_question_no")]
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]
    row_key = norm_key(row.get("Question", ""))[:160]
    return max(candidates, key=lambda record: SequenceMatcher(None, row_key, norm_key(record.get("question", ""))[:160]).ratio())


def match_explanation_answer(row):
    explanation = row.get("Explanation", "")
    if not explanation:
        return ""
    head = norm_words(explanation[:140])
    if not head:
        return ""
    scores = []
    head_words = head.split()
    for letter in "ABCD":
        choice = choice_text(row, letter)
        choice_norm = norm_words(choice)
        if not choice_norm:
            continue
        choice_words = choice_norm.split()
        ratio = SequenceMatcher(None, " ".join(choice_words[:6]), " ".join(head_words[:6])).ratio()
        if head_words and len(head_words[0]) >= 4 and any(word.startswith(head_words[0][:5]) or head_words[0].startswith(word[:5]) for word in choice_words):
            ratio = max(ratio, 0.83)
        if re.search(r"\d", choice) and re.search(r"\d", explanation[:60]):
            cnums = re.findall(r"\d+(?:\.\d+)?", choice.replace(",", ""))
            enums = re.findall(r"\d+(?:\.\d+)?", explanation[:60].replace(",", ""))
            if cnums and enums and cnums[0].rstrip("0").rstrip(".") == enums[0].rstrip("0").rstrip("."):
                ratio = max(ratio, 0.92)
        if ratio >= 0.5:
            scores.append((ratio, letter))
    scores.sort(reverse=True)
    if scores and (len(scores) == 1 or scores[0][0] - scores[1][0] > 0.08):
        return scores[0][1]
    return ""


def duplicate_answer_map(rows_by_file):
    answered = {}
    for rows in rows_by_file.values():
        for row in rows:
            key = norm_key(row.get("Question", ""))
            answer = row.get("Correct Answer", "")
            if key and answer in "ABCDE" and choice_text(row, answer):
                answered.setdefault(key, answer)
    return answered


def write_outputs(rows_by_file, report):
    for path, rows in rows_by_file.items():
        base = path.with_suffix("")
        csv_path = base.with_suffix(".csv")
        md_path = base.with_suffix(".md")
        summary_path = path.with_name(f"{base.name}_summary.json")

        path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
        with csv_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)

        def esc(value):
            return str(value or "").replace("|", "\\|").replace("\n", "<br>")

        lines = ["| " + " | ".join(FIELDS) + " |", "| " + " | ".join(["---"] * len(FIELDS)) + " |"]
        for row in rows:
            lines.append("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |")
        md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

        status_counts = Counter(row.get("Status", "") for row in rows)
        summary = json.loads(summary_path.read_text(encoding="utf-8")) if summary_path.exists() else {}
        summary.update(
            {
                "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
                "total_needing_review": status_counts.get("Needs Review", 0) + status_counts.get("Incomplete", 0),
                "total_without_answer_key": status_counts.get("Needs Answer", 0),
                "total_duplicates_detected": status_counts.get("Duplicate", 0),
                "status_counts": dict(status_counts),
                "answer_resolution_report": "output/pdf/let_needs_answer_resolution_report.json",
            }
        )
        summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    (OUT_DIR / "let_needs_answer_resolution_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    rows_by_file = {path: json.loads(path.read_text(encoding="utf-8")) for path in FILES}
    before = Counter(row.get("Status", "") for rows in rows_by_file.values() for row in rows)
    fill_counts = Counter()
    source_fills = Counter()

    bold_answers = {
        "6. LET PROF ED Q&A.pdf": bold_choice_answers(Path(SOURCE_PATHS["6. LET PROF ED Q&A.pdf"]), 197),
        "16. 200-ITEMS-BEED-WITH-ANSWER-KEY.pdf": bold_choice_answers(Path(SOURCE_PATHS["16. 200-ITEMS-BEED-WITH-ANSWER-KEY.pdf"]), 200),
        "1. FINAL COACHING WITH ANSWER KEY.pdf": bold_choice_answers(Path(SOURCE_PATHS["1. FINAL COACHING WITH ANSWER KEY.pdf"]), 200),
    }
    updated_139_records = highlighted_choice_records(Path(SOURCE_PATHS["Updated Prof-Ed-139-items.pdf"]), "updated_prof_ed_139")
    bullet_records = bullet_choice_records(Path(SOURCE_PATHS["1. FINAL COACHING.pdf"]))
    prof_150_key = text_answer_key(Path(SOURCE_PATHS["Updated Prof-Ed-150-items.pdf"]), "ANSWER KEY")
    part8_key = text_answer_key(Path(SOURCE_PATHS["Part 8 General Education (200 Items).pdf"]), "Part 8 General Education LET Reviewer")
    gen_ed_prof_ed_key = text_answer_key(Path(SOURCE_PATHS["3. GEN-ED_PROF_ED.pdf"]), "ANSWER KEY")

    dup_map = duplicate_answer_map(rows_by_file)

    for rows in rows_by_file.values():
        for row in rows:
            if row.get("Status") != "Needs Answer":
                continue
            source = row.get("Source PDF", "")
            qnum = row.get("source_question_no")
            answer = ""
            method = ""

            if source in bold_answers:
                answer = bold_answers[source].get(qnum, "")
                method = "Correct answer recovered from bold/highlighted answer choice in the PDF."
            elif source == "Updated Prof-Ed-139-items.pdf":
                record = best_record_for_row(row, updated_139_records)
                if record and SequenceMatcher(None, norm_key(row.get("Question", ""))[:160], norm_key(record.get("question", ""))[:160]).ratio() >= 0.75:
                    answer = record["answer"]
                    method = "Correct answer recovered from yellow-highlighted answer choice in the PDF render."
            elif source == "Updated Prof-Ed-150-items.pdf":
                answer = prof_150_key.get(qnum, "")
                method = "Correct answer recovered from the trailing answer key."
            elif source == "Part 8 General Education (200 Items).pdf":
                answer = part8_key.get(qnum, "")
                method = "Correct answer recovered from the trailing answer key."
            elif source == "3. GEN-ED_PROF_ED.pdf":
                answer = gen_ed_prof_ed_key.get(qnum, "")
                method = "Correct answer recovered from the trailing answer key."
            elif source == "1. FINAL COACHING.pdf":
                record = best_record_for_row(row, bullet_records)
                if record:
                    answer = record["answer"]
                    method = "Correct answer recovered from bullet-marked answer choice in the PDF."
            elif source == "1. FILIPINO LET 60 ITEMS WITH RATIONALIZATION.pdf":
                joined_choices = " ".join(choice_text(row, letter) for letter in "ABCD")
                m = re.search(r"\.\s*([A-D])\s*[–-]\s*(.+)", joined_choices)
                if m:
                    answer = m.group(1)
                    row["Explanation"] = norm_space(m.group(2))
                    method = "Correct answer and rationale recovered from embedded Filipino rationalization text."
            elif source == "05. GEN ED WITH EXPLANATION (SECONDARY).pdf":
                answer = match_explanation_answer(row)
                method = "Correct answer matched against the explanation text in the PDF."

            if not answer:
                key = norm_key(row.get("Question", ""))
                if key in dup_map:
                    answer = dup_map[key]
                    method = "Correct answer copied from an exact duplicate question already answered in the extracted LET files."

            repair = SOURCE_BACKED_REPAIRS.get((source, qnum))
            if repair and (not answer or not choice_text(row, answer)):
                for letter, value in repair.get("choices", {}).items():
                    set_choice(row, letter, value)
                answer = repair["answer"]
                method = repair["note"]

            if answer and set_ready(row, answer, method):
                fill_counts[method] += 1
                source_fills[source] += 1

    after = Counter(row.get("Status", "") for rows in rows_by_file.values() for row in rows)
    unresolved_by_source = Counter(
        row.get("Source PDF", "")
        for rows in rows_by_file.values()
        for row in rows
        if row.get("Status") == "Needs Answer"
    )
    report = {
        "before_status_counts": dict(before),
        "after_status_counts": dict(after),
        "resolved_total": before.get("Needs Answer", 0) - after.get("Needs Answer", 0),
        "resolved_by_method": dict(fill_counts),
        "resolved_by_source": dict(source_fills),
        "remaining_needs_answer_by_source": dict(unresolved_by_source),
    }
    write_outputs(rows_by_file, report)
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
