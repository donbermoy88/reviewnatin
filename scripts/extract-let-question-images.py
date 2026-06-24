#!/usr/bin/env python3
import csv
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/pdf"
IMAGE_DIR = OUT_DIR / "images/let_questions"
TMP_DIR = ROOT / "tmp/pdfs/let_question_images"

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

OUTPUT_BASES = [
    "let_elementary_secondary_extracted_questions",
    "let_reviewer_2026_batch2_extracted_questions",
]

PDF_WITH_REAL_FIGURES = "/Users/lyndon/All reviewers/-LET REVIEWER 2026/H. FREEBIES!/C. Q&A EXERCISES/2. GEN ED AND PROF ED.pdf"
SHARED_FIGURE_STEM = "For items 8 to 13, what does each figure/distribution on the right indicate?"

# Coordinates are in PDF points using pdfplumber's top-origin page coordinate system.
# These are the real question figures found during visual verification. Other embedded
# images in the current LET batches are decorative bullets, logos, watermarks, or banners.
FIGURE_ATTACHMENTS = [
    {
        "source_pdf": "2. GEN ED AND PROF ED.pdf",
        "source_path": PDF_WITH_REAL_FIGURES,
        "page": 96,
        "question_no": 4,
        "image_no": 1,
        "bbox": (72.0, 265.2, 552.0, 415.2),
        "kind": "question",
        "filename": "let_gen_ed_prof_ed_p096_q004_fig01.png",
    },
    {
        "source_pdf": "2. GEN ED AND PROF ED.pdf",
        "source_path": PDF_WITH_REAL_FIGURES,
        "page": 101,
        "question_no": 8,
        "image_no": 1,
        "bbox": (72.0, 513.6, 552.0, 663.6),
        "kind": "question",
        "filename": "let_gen_ed_prof_ed_p101_q008_fig01.png",
    },
    {
        "source_pdf": "2. GEN ED AND PROF ED.pdf",
        "source_path": PDF_WITH_REAL_FIGURES,
        "page": 102,
        "row_page": 101,
        "question_no": 9,
        "image_no": 1,
        "bbox": (72.0, 99.6, 552.0, 249.6),
        "kind": "question",
        "filename": "let_gen_ed_prof_ed_p102_q009_fig01.png",
    },
    {
        "source_pdf": "2. GEN ED AND PROF ED.pdf",
        "source_path": PDF_WITH_REAL_FIGURES,
        "page": 102,
        "question_no": 10,
        "image_no": 2,
        "bbox": (72.0, 332.4, 552.0, 482.4),
        "kind": "question",
        "filename": "let_gen_ed_prof_ed_p102_q010_fig01.png",
    },
    {
        "source_pdf": "2. GEN ED AND PROF ED.pdf",
        "source_path": PDF_WITH_REAL_FIGURES,
        "page": 102,
        "question_no": 11,
        "image_no": 3,
        "bbox": (72.0, 565.2, 552.0, 715.2),
        "kind": "question",
        "filename": "let_gen_ed_prof_ed_p102_q011_fig01.png",
    },
    {
        "source_pdf": "2. GEN ED AND PROF ED.pdf",
        "source_path": PDF_WITH_REAL_FIGURES,
        "page": 103,
        "question_no": 12,
        "image_no": 1,
        "bbox": (72.0, 154.8, 552.0, 304.8),
        "kind": "question",
        "filename": "let_gen_ed_prof_ed_p103_q012_fig01.png",
    },
    {
        "source_pdf": "2. GEN ED AND PROF ED.pdf",
        "source_path": PDF_WITH_REAL_FIGURES,
        "page": 103,
        "question_no": 13,
        "image_no": 2,
        "bbox": (72.0, 387.6, 552.0, 537.6),
        "kind": "question",
        "filename": "let_gen_ed_prof_ed_p103_q013_fig01.png",
    },
]

QUESTION_REPAIRS = {
    ("2. GEN ED AND PROF ED.pdf", 8): {
        "Question": SHARED_FIGURE_STEM,
    },
    ("2. GEN ED AND PROF ED.pdf", 9): {
        "Question": SHARED_FIGURE_STEM,
    },
    ("2. GEN ED AND PROF ED.pdf", 10): {
        "Question": SHARED_FIGURE_STEM,
    },
    ("2. GEN ED AND PROF ED.pdf", 11): {
        "Question": SHARED_FIGURE_STEM,
        "Choice A": "unequal means, equal standard deviations",
        "Choice B": "unequal means, equal standard deviations",
        "Choice C": "equal means, equal standard deviations",
        "Choice D": "equal means, unequal standard deviations",
    },
    ("2. GEN ED AND PROF ED.pdf", 12): {
        "Question": SHARED_FIGURE_STEM,
    },
    ("2. GEN ED AND PROF ED.pdf", 13): {
        "Question": SHARED_FIGURE_STEM,
    },
}


def normalize_space(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def run(args):
    subprocess.run(args, check=True, capture_output=True, text=True)


def render_page(pdf_path, page_no, resolution=180):
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    prefix = TMP_DIR / f"page_{page_no}"
    for old in TMP_DIR.glob(f"{prefix.name}-*.png"):
        old.unlink()
    run(["pdftoppm", "-png", "-r", str(resolution), "-f", str(page_no), "-l", str(page_no), pdf_path, str(prefix)])
    matches = sorted(TMP_DIR.glob(f"{prefix.name}-*.png"))
    if not matches:
        raise RuntimeError(f"pdftoppm did not render page {page_no} from {pdf_path}")
    return matches[0]


def crop_figure(attachment):
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = IMAGE_DIR / attachment["filename"]
    rendered = render_page(attachment["source_path"], attachment["page"])
    with Image.open(rendered) as img:
        page_width, page_height = 612.0, 792.0
        sx = img.width / page_width
        sy = img.height / page_height
        x0, top, x1, bottom = attachment["bbox"]
        crop_box = (
            max(0, int(round(x0 * sx))),
            max(0, int(round(top * sy))),
            min(img.width, int(round(x1 * sx))),
            min(img.height, int(round(bottom * sy))),
        )
        img.crop(crop_box).save(out_path)
    return out_path


def load_rows(base):
    path = OUT_DIR / f"{base}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def status_for(row):
    if row.get("Status") == "Duplicate":
        return "Duplicate"
    choices = [row.get(f"Choice {letter}", "") for letter in "ABCD"]
    if not normalize_space(row.get("Question")) or sum(bool(normalize_space(choice)) for choice in choices) < 2:
        return "Incomplete"
    if not normalize_space(row.get("Correct Answer")):
        return "Needs Answer"
    return "Ready for Upload"


def write_outputs(base, rows, old_summary):
    csv_path = OUT_DIR / f"{base}.csv"
    json_path = OUT_DIR / f"{base}.json"
    md_path = OUT_DIR / f"{base}.md"
    summary_path = OUT_DIR / f"{base}_summary.json"

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    json_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")

    def esc(value):
        return str(value or "").replace("|", "\\|").replace("\n", "<br>")

    lines = ["| " + " | ".join(FIELDS) + " |", "| " + " | ".join(["---"] * len(FIELDS)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(esc(row.get(field, "")) for field in FIELDS) + " |")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    status_counts = Counter(row.get("Status", "") for row in rows)
    summary = dict(old_summary)
    summary.update(
        {
            "total_questions_found": len(rows),
            "total_ready_for_upload": status_counts.get("Ready for Upload", 0),
            "total_needing_review": status_counts.get("Needs Review", 0) + status_counts.get("Incomplete", 0),
            "total_without_answer_key": status_counts.get("Needs Answer", 0),
            "total_duplicates_detected": status_counts.get("Duplicate", 0),
            "total_questions_with_images": sum(1 for row in rows if row.get("Has Image") == "Yes"),
            "status_counts": dict(status_counts),
            "image_extraction_note": "Decorative page-level image flags were cleared. Only visually verified question/answer figures with saved crop references are marked Has Image=Yes.",
        }
    )
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


def main():
    cropped = {}
    for attachment in FIGURE_ATTACHMENTS:
        row_page = attachment.get("row_page", attachment["page"])
        cropped[(attachment["source_pdf"], row_page, attachment["question_no"])] = {
            **attachment,
            "path": str(crop_figure(attachment)),
        }

    report = {
        "image_dir": str(IMAGE_DIR),
        "figures_extracted": [],
        "outputs_updated": {},
    }

    for base in OUTPUT_BASES:
        json_path = OUT_DIR / f"{base}.json"
        summary_path = OUT_DIR / f"{base}_summary.json"
        if not json_path.exists():
            continue
        rows = load_rows(base)
        old_summary = json.loads(summary_path.read_text(encoding="utf-8")) if summary_path.exists() else {}

        for row in rows:
            note = normalize_space(row.get("Notes", ""))
            note = re.sub(r"\s*Page contains embedded image\(s\); crop reference not extracted in this pass\.", "", note)
            row["Notes"] = normalize_space(note)
            row["Has Image"] = "No"
            row["Image Reference"] = ""

            source_pdf = row.get("Source PDF", "")
            qno = int(row.get("source_question_no") or 0)
            page = int(row.get("Page") or 0)
            repair = QUESTION_REPAIRS.get((source_pdf, qno)) if (source_pdf, page, qno) in cropped else None
            if repair:
                row.update(repair)

            attachment = cropped.get((source_pdf, page, qno))
            if attachment:
                row["Has Image"] = "Yes"
                row["Image Reference"] = f"{attachment['kind']}:{attachment['path']}"
                row["Notes"] = normalize_space(
                    row.get("Notes", "")
                    + f" Figure crop extracted from source PDF page {attachment['page']} and attached to this question."
                )
                report["figures_extracted"].append(
                    {
                        "output": base,
                        "row_no": row.get("No.", ""),
                        "source_pdf": source_pdf,
                        "source_question_no": qno,
                        "page": attachment["page"],
                        "image_reference": row["Image Reference"],
                    }
                )

            row["Question"] = normalize_space(row.get("Question"))
            for field in ["Choice A", "Choice B", "Choice C", "Choice D", "Choice E if there is", "Explanation", "Notes"]:
                row[field] = normalize_space(row.get(field))
            row["Status"] = status_for(row)

        report["outputs_updated"][base] = write_outputs(base, rows, old_summary)

    report_path = OUT_DIR / "let_question_image_extraction_report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
