#!/usr/bin/env python3
import argparse
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

import pdfplumber
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path("/Users/lyndon/All reviewers/Civil Service Exam/Civil Service Exam Reviewer 2026/ABSTRACT REASONING 2026")
OUT_DIR = ROOT / "output/pdf"
TMP_DIR = ROOT / "tmp/pdfs/cse_abstract_reasoning_2026"
IMG_DIR = OUT_DIR / "cse_abstract_reasoning_2026_images"
BASE = "cse_abstract_reasoning_2026_extracted_questions"

FIELDS = [
    "No.",
    "Source PDF",
    "Source Path",
    "Original No.",
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
    "Topic Slug",
    "Difficulty",
    "Has Image",
    "Image Reference",
    "Image Path",
    "Status",
    "Notes",
]


def run(args, allow_fail=False):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode and not allow_fail:
        raise RuntimeError(f"Command failed: {' '.join(map(str, args))}\n{result.stderr}")
    return result.stdout


def normalize_space(value):
    return re.sub(r"\s+", " ", str(value or "").replace("\x0c", " ")).strip()


def slugify(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def pdf_text(path):
    return run(["pdftotext", "-layout", str(path), "-"], allow_fail=True)


def pdf_page_count(path):
    info = run(["pdfinfo", str(path)], allow_fail=True)
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    return int(match.group(1)) if match else 0


def render_pdf(path, rendered_dir, dpi=220):
    rendered_dir.mkdir(parents=True, exist_ok=True)
    prefix = rendered_dir / slugify(path.stem)
    if not list(rendered_dir.glob(f"{prefix.name}-*.png")):
        run(["pdftoppm", "-png", "-r", str(dpi), str(path), str(prefix)])
    return prefix


def rendered_page_path(prefix, page_no):
    candidates = [
        prefix.parent / f"{prefix.name}-{page_no}.png",
        prefix.parent / f"{prefix.name}-{page_no:02d}.png",
        prefix.parent / f"{prefix.name}-{page_no:03d}.png",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    found = sorted(prefix.parent.glob(f"{prefix.name}-*.png"))
    return found[page_no - 1] if len(found) >= page_no else None


def words_in_range(words, top, bottom):
    return [w for w in words if top <= w["top"] < bottom]


def block_text(words, top, bottom):
    return normalize_space(" ".join(w["text"] for w in words_in_range(words, top, bottom)))


def question_line_from_words(words, marker, bottom):
    line_words = [
        w
        for w in words
        if abs(w["top"] - marker["top"]) < 8 and w["x0"] > marker["x1"] and w["top"] < bottom
    ]
    text = normalize_space(" ".join(w["text"] for w in sorted(line_words, key=lambda w: w["x0"])))
    if "?" in text:
        return text[: text.index("?") + 1]

    block = [w for w in words_in_range(words, marker["top"], min(bottom, marker["top"] + 35)) if w["x0"] > marker["x1"]]
    text = normalize_space(" ".join(w["text"] for w in sorted(block, key=lambda w: (w["top"], w["x0"]))))
    return text[: text.index("?") + 1] if "?" in text else text


def crop_region(pdf, page_no, source_image, left_pt, top_pt, right_pt, bottom_pt, out_path):
    page = pdf.pages[page_no - 1]
    with Image.open(source_image) as image:
        scale_x = image.width / page.width
        scale_y = image.height / page.height
        box = (
            max(0, int(left_pt * scale_x)),
            max(0, int(top_pt * scale_y)),
            min(image.width, int(right_pt * scale_x)),
            min(image.height, int(bottom_pt * scale_y)),
        )
        crop = image.crop(box)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        crop.save(out_path)


def parse_psychometric_answers(text):
    answers = {}
    if "Answers" not in text:
        return answers
    key_text = text[text.rfind("Answers") :]
    for qnum, letter in re.findall(r"(?<!\d)(\d{1,2})\)\s*([A-E])\b", key_text):
        answers[int(qnum)] = letter
    return answers


def psychometric_topic(stem):
    text = stem.lower()
    if "odd one out" in text or "belongs in neither group" in text:
        return "odd-one-out"
    if "statement" in text:
        return "analogies"
    if "grid" in text:
        return "pattern-completion"
    if "series" in text:
        return "series-completion"
    return "pattern-completion"


def difficulty_for_topic(topic):
    if topic == "analogies":
        return "3"
    return "2"


def choice_labels_from_block(words, top, bottom, answer_letter):
    labels = []
    for w in words_in_range(words, top, bottom):
        txt = w["text"].strip().upper()
        if re.fullmatch(r"[A-E]", txt) and w["x0"] > 300:
            if txt not in labels:
                labels.append(txt)
    labels = [letter for letter in "ABCDE" if letter in labels]
    if answer_letter and answer_letter not in labels:
        labels.append(answer_letter)
    if not labels:
        labels = list("ABCDE" if answer_letter == "E" else "ABCD")
    return labels


def extract_psychometric_pdf(path, source_root):
    test_match = re.search(r"(\d+)$", path.stem)
    test_no = int(test_match.group(1)) if test_match else 0
    text = pdf_text(path)
    answers = parse_psychometric_answers(text)
    rendered_prefix = render_pdf(path, TMP_DIR / "renders")
    rows = []

    with pdfplumber.open(path) as pdf:
        for page_no, page in enumerate(pdf.pages, 1):
            words = page.extract_words(x_tolerance=2, y_tolerance=3, keep_blank_chars=False)
            markers = [
                w for w in words
                if re.fullmatch(r"\d{1,2}\)", w["text"]) and w["x0"] < 100 and int(w["text"][:-1]) <= 25
            ]
            if not markers:
                continue
            markers = sorted(markers, key=lambda w: (w["top"], w["x0"]))
            copyright_tops = [w["top"] for w in words if w["text"].lower().startswith("copyright")]
            end_tops = [w["top"] for w in words if w["text"].lower() == "end"]
            footer_top = min(copyright_tops + end_tops) if (copyright_tops or end_tops) else page.height - 40

            for idx, marker in enumerate(markers):
                qnum = int(marker["text"][:-1])
                if qnum not in answers:
                    continue
                next_top = markers[idx + 1]["top"] if idx + 1 < len(markers) else footer_top
                top = max(0, marker["top"] - 4)
                bottom = min(page.height, next_top - 8, footer_top - 10)
                if bottom <= top + 45:
                    bottom = min(page.height, top + 145)
                stem = question_line_from_words(words, marker, bottom)
                if not stem:
                    stem = "Which figure completes the abstract reasoning item?"
                topic = psychometric_topic(stem)
                labels = choice_labels_from_block(words, top, bottom, answers[qnum])
                image_name = f"cse_abstract_2026_psychometric_test{test_no}_q{qnum:02d}.png"
                image_path = IMG_DIR / image_name
                source_image = rendered_page_path(rendered_prefix, page_no)
                if source_image:
                    crop_region(pdf, page_no, source_image, 55, top, page.width - 55, bottom, image_path)
                display_stem = f"Abstract Reasoning Test {test_no}, Question {qnum}. {stem}"
                row = {
                    "Source PDF": path.name,
                    "Source Path": str(path),
                    "Original No.": str(qnum),
                    "Page": str(page_no),
                    "Question": display_stem,
                    "Correct Answer": answers[qnum],
                    "Explanation": f"Answer key from source: {answers[qnum]}.",
                    "Exam Type": "Both",
                    "Subject Category": "Abstract Reasoning",
                    "Topic Slug": topic,
                    "Difficulty": difficulty_for_topic(topic),
                    "Has Image": "Yes",
                    "Image Reference": image_name,
                    "Image Path": str(image_path),
                    "Status": "Ready for Upload" if image_path.exists() else "Needs Image Extraction",
                    "Notes": "Psychometric Success abstract reasoning item. Question-specific crop includes the diagram and answer figures.",
                }
                for letter in "ABCDE":
                    row[f"Choice {letter}" if letter != "E" else "Choice E if there is"] = f"Figure {letter}" if letter in labels else ""
                rows.append(row)
    return rows, {"path": str(path), "status": "processed", "rows": len(rows), "answers_detected": len(answers)}


def parse_intellmed_answers(text):
    if "ANSWERS:" not in text:
        return {}
    key_text = text[text.index("ANSWERS:") :]
    matches = list(re.finditer(r"(?m)^\s*(\d{1,2})\.\s+([A-E])\s*$", key_text))
    answers = {}
    for idx, match in enumerate(matches):
        qnum = int(match.group(1))
        letter = match.group(2)
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(key_text)
        explanation = normalize_space(key_text[start:end])
        answers[qnum] = {"letter": letter, "explanation": explanation}
    return answers


def intellmed_choices_for_block(text, answer_letter):
    pairs = re.findall(r"\b([a-e])\.\s+([A-D1-5])\b", text, flags=re.I)
    choices = {letter.upper(): value.upper() for letter, value in pairs}
    if answer_letter not in choices:
        choices[answer_letter] = answer_letter
    return choices


def extract_intellmed_pdf(path, source_root):
    text = pdf_text(path)
    answers = parse_intellmed_answers(text)
    rendered_prefix = render_pdf(path, TMP_DIR / "renders")
    rows = []

    with pdfplumber.open(path) as pdf:
        for page_no, page in enumerate(pdf.pages, 1):
            if page_no > 5:
                continue
            words = page.extract_words(x_tolerance=2, y_tolerance=3, keep_blank_chars=False)
            markers = [
                w for w in words
                if re.fullmatch(r"\d{1,2}\.", w["text"]) and w["x0"] < 110 and int(w["text"][:-1]) <= 15
            ]
            if not markers:
                continue
            markers = sorted(markers, key=lambda w: (w["top"], w["x0"]))
            footer_tops = [w["top"] for w in words if "Floor" in w["text"] or "Cristina" in w["text"]]
            footer_top = min(footer_tops) if footer_tops else page.height - 60
            for idx, marker in enumerate(markers):
                qnum = int(marker["text"][:-1])
                if qnum not in answers:
                    continue
                next_top = markers[idx + 1]["top"] if idx + 1 < len(markers) else footer_top
                top = max(0, marker["top"] - 15)
                bottom = min(page.height, next_top - 10, footer_top - 10)
                if bottom <= top + 60:
                    bottom = min(page.height, top + 180)
                block = block_text(words, top, bottom)
                choices = intellmed_choices_for_block(block, answers[qnum]["letter"])
                topic = "series-completion" if qnum <= 5 or qnum >= 8 else "pattern-completion"
                image_name = f"cse_abstract_2026_intellmed_q{qnum:02d}.png"
                image_path = IMG_DIR / image_name
                source_image = rendered_page_path(rendered_prefix, page_no)
                if source_image:
                    crop_region(pdf, page_no, source_image, 65, top, page.width - 50, bottom, image_path)
                row = {
                    "Source PDF": path.name,
                    "Source Path": str(path),
                    "Original No.": str(qnum),
                    "Page": str(page_no),
                    "Question": f"Abstract Reasoning Practice Question {qnum}. Select the correct option shown in the image.",
                    "Correct Answer": answers[qnum]["letter"],
                    "Explanation": answers[qnum]["explanation"],
                    "Exam Type": "Both",
                    "Subject Category": "Abstract Reasoning",
                    "Topic Slug": topic,
                    "Difficulty": "2",
                    "Has Image": "Yes",
                    "Image Reference": image_name,
                    "Image Path": str(image_path),
                    "Status": "Ready for Upload" if image_path.exists() else "Needs Image Extraction",
                    "Notes": "Intellmed abstract reasoning item. The source uses visual prompts with text choices and answer explanations.",
                }
                for letter in "ABCD":
                    row[f"Choice {letter}"] = choices.get(letter, "")
                row["Choice E if there is"] = choices.get("E", "")
                rows.append(row)
    return rows, {"path": str(path), "status": "processed", "rows": len(rows), "answers_detected": len(answers)}


def explanation_pdf_audit(path):
    text = pdf_text(path)
    numbers = sorted({int(n) for n in re.findall(r"(?m)^\s*(\d{1,2})\s*$", text) if int(n) <= 25})
    return [], {
        "path": str(path),
        "status": "needs_review",
        "rows": 0,
        "answers_detected": 0,
        "notes": (
            "Contains explained abstract reasoning visuals, but answer choices are not consistently letter-labeled. "
            f"Detected possible item numbers: {numbers[:25]}"
        ),
    }


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


def build_summary(rows, sources, outputs, input_dir):
    status_counts = Counter(row["Status"] for row in rows)
    source_counts = Counter(row["Source PDF"] for row in rows)
    topic_counts = Counter(row["Topic Slug"] for row in rows)
    return {
        "input_dir": str(input_dir),
        "generated_at": "2026-06-25",
        "pdfs_seen": len(sources),
        "total_questions_found": len(rows),
        "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
        "total_needing_review": sum(status_counts.get(s, 0) for s in ["Needs Review", "Needs Image Extraction", "Incomplete"]),
        "total_without_answer_key": status_counts.get("Needs Answer", 0),
        "total_questions_with_images": sum(1 for row in rows if row["Has Image"] == "Yes"),
        "status_counts": dict(status_counts),
        "source_counts": dict(source_counts),
        "topic_counts": dict(topic_counts),
        "sources": sources,
        "outputs": outputs,
        "recommended_next_action": "Upload Ready for Upload rows only. Review the explanation-only PDF manually before import because choices are not consistently labeled.",
    }


def main():
    parser = argparse.ArgumentParser(description="Extract CSE 2026 Abstract Reasoning visual questions.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--output-base", default=BASE)
    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir}")

    rows = []
    sources = []
    for path in sorted(input_dir.glob("*.pdf")):
        try:
            if re.match(r"Abstract Reasoning [1-4]\.pdf$", path.name):
                extracted, source = extract_psychometric_pdf(path, input_dir)
            elif path.name == "Abstract Reasoning 5.pdf":
                extracted, source = extract_intellmed_pdf(path, input_dir)
            elif "With Explanation" in path.name:
                extracted, source = explanation_pdf_audit(path)
            else:
                extracted, source = [], {"path": str(path), "status": "skipped", "rows": 0}
            rows.extend(extracted)
            sources.append(source)
            print(json.dumps({"processed": str(path), "rows": len(extracted), "status": source["status"]}), flush=True)
        except Exception as exc:
            sources.append({"path": str(path), "status": "error", "rows": 0, "error": str(exc)})
            print(json.dumps({"error": str(path), "message": str(exc)}), flush=True)

    for idx, row in enumerate(rows, 1):
        row["No."] = str(idx)

    outputs = write_outputs(rows, {"pending": True}, args.output_base)
    summary = build_summary(rows, sources, outputs, input_dir)
    outputs = write_outputs(rows, summary, args.output_base)
    summary["outputs"] = outputs
    (OUT_DIR / f"{args.output_base}_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
