# Phase 1 Exam Blueprints

ReviewNatin launches with **three exam tracks** only. Each blueprint is versioned and aligned to official Table of Specifications (TOS) or examination program documents.

**Disclaimer (required in app):** ReviewNatin is an independent study tool. Not affiliated with CSC, PRC, or any government agency. Content is for review purposes only; verify schedules and requirements on official sites.

| Exam | Official source | ReviewNatin slug |
|------|-----------------|------------------|
| CSE Professional | [CSC](https://www.csc.gov.ph) | `cse-professional` |
| CSE Subprofessional | [CSC](https://www.csc.gov.ph) | `cse-subprofessional` |
| LET Elementary | [PRC LEPT](https://www.prc.gov.ph) | `let-elementary` |
| LET Secondary | [PRC LEPT](https://www.prc.gov.ph) | `let-secondary` |
| PNLE (Nursing) | [PRC PNLE program PDF](https://www.prc.gov.ph) | `pnle` |

---

## 1. Civil Service Examination (CSE-PPT)

### Exam types (Phase 1)

| Slug | Display name | Items | Time limit | Min score to pass |
|------|--------------|-------|------------|-------------------|
| `cse-professional` | CSE Professional | 170 | 3h 10m | Per CSC rating (typically ~80% equivalent) |
| `cse-subprofessional` | CSE Subprofessional | 165 | 2h 40m | Per CSC rating |

**Official registration:** [CSC website](https://www.csc.gov.ph) — CSE-PPT held twice yearly (typically March and August).

### Subject areas and topic weights (blueprint v1.0)

Weights are **approximate** for question bank distribution; CSC does not publish exact percentages per subtopic. Use for MVP content planning.

#### CSE Professional (`cse-professional`)

| Subject area | Slug | Weight % | Topics |
|--------------|------|----------|--------|
| Verbal Ability | `verbal` | 25 | Grammar & correct usage, vocabulary, paragraph organization, reading comprehension (EN + FIL) |
| Analytical Ability | `analytical` | 25 | Word association, identifying assumptions/conclusions, logic, data interpretation |
| Numerical Ability | `numerical` | 25 | Basic operations, number series, word problems |
| General Information | `general-info` | 25 | Philippine Constitution, RA 6713 (Code of Conduct), peace & human rights, environment management |

#### CSE Subprofessional (`cse-subprofessional`)

| Subject area | Slug | Weight % | Topics |
|--------------|------|----------|--------|
| Verbal Ability | `verbal` | 30 | Same as Professional |
| Numerical Ability | `numerical` | 30 | Basic operations, word problems |
| Clerical Ability | `clerical` | 20 | Filing, spelling, alphabetizing |
| General Information | `general-info` | 20 | Same as Professional |

### Mock exam config

```json
{
  "exam_type_slug": "cse-professional",
  "item_count": 170,
  "duration_seconds": 11400,
  "allow_back_navigation": false,
  "show_hints": false,
  "shuffle_questions": true,
  "shuffle_choices": true
}
```

### MVP content targets (Phase 1)

| Exam type | Min questions | Min mock exams |
|-----------|---------------|----------------|
| CSE Professional | 500 | 3 full-length |
| CSE Subprofessional | 500 | 3 full-length |

---

## 2. Licensure Examination for Teachers (LET / LEPT)

### Exam types (Phase 1)

| Slug | Display name | Components | Items per component |
|------|--------------|------------|---------------------|
| `let-elementary` | LET Elementary | Gen Ed (40%) + Prof Ed (60%) | ~150 each (300 total typical) |
| `let-secondary` | LET Secondary | Gen Ed (20%) + Prof Ed (40%) + Major (40%) | ~150 per component |

**TOS reference:** Enhanced Table of Specifications — PRC Board Resolution No. 11 (s. 2022), amended 2025. Effective March 2023 onward. Aligns with **PPST** (DepEd Order No. 42, s. 2017).

**Official registration:** [PRC LERIS](https://online.prc.gov.ph) — typically March and September schedules.

### LET Elementary — subject structure

| Subject area | Slug | Weight % | Key topics |
|--------------|------|----------|------------|
| General Education | `gen-ed` | 40 | English, Filipino, Math, Science, Social Science |
| Professional Education | `prof-ed` | 60 | Teaching Profession, Principles of Teaching, Child & Adolescent Dev, Facilitating Learning, Curriculum Dev, Assessment, Educational Technology, Social Dimensions, Developmental Reading, Practice Teaching, Field Study |

### LET Secondary — subject structure

| Subject area | Slug | Weight % | Key topics |
|--------------|------|----------|------------|
| General Education | `gen-ed` | 20 | Same core as Elementary |
| Professional Education | `prof-ed` | 40 | Same Prof Ed domains |
| Area of Specialization | `major` | 40 | User selects one: English, Filipino, Math, Biological Science, Physical Science, Social Studies, Values Ed, MAPEH, TLE, Agriculture & Fishery Arts |

### Major specializations (Phase 1 — ship top 5 first)

Priority majors for MVP question bank:

1. `major-english`
2. `major-filipino`
3. `major-mathematics`
4. `major-prof-ed-only` (users without major selection — Prof Ed heavy practice)
5. `major-social-studies`

Defer remaining majors to Phase 1.1 content sprint.

### Mock exam config

```json
{
  "exam_type_slug": "let-elementary",
  "components": [
    { "subject": "gen-ed", "item_count": 150, "duration_seconds": 10800 },
    { "subject": "prof-ed", "item_count": 150, "duration_seconds": 10800 }
  ],
  "allow_back_navigation": false
}
```

### MVP content targets

| Exam type | Min questions | Notes |
|-----------|---------------|-------|
| LET Elementary | 800 (Gen Ed + Prof Ed) | Split 320 / 480 by weight |
| LET Secondary (per major) | 600 base + 400 major | Launch with 2 majors minimum |

---

## 3. Philippine Nurse Licensure Examination (PNLE)

### Exam type (Phase 1)

| Slug | Display name | Total items | Structure |
|------|--------------|-------------|-----------|
| `pnle` | PNLE (Nursing) | 500 | 5 parts per PRC examination program |

**Official source:** PRC examination program for PNLE (signed PDF on prc.gov.ph). Competency framework: **11 key areas** of nursing practice in the Philippines.

### Five examination parts

| Part | Slug | Focus | Approx. items |
|------|------|-------|---------------|
| NP I | `np1-community` | Community Health Nursing | 100 (20%) |
| NP II | `np2-maternal-child` | Care of Healthy / At-Risk Mother and Child | ~80 |
| NP III | `np3-alterations-a` | Physiologic & Psychosocial Alterations (Part A) | ~107 |
| NP IV | `np4-alterations-b` | Alterations (Part B) — Med-Surg, Pharmacology | ~107 |
| NP V | `np5-alterations-c` | Alterations (Part C) — Psychiatric & Mental Health | ~106 |

### Integrated sciences (tag questions across parts)

- Anatomy & Physiology
- Pathophysiology
- Pharmacology & Therapeutics
- Nutrition & Diet Therapy
- Parasitology & Microbiology

### Competency categories (for analytics tags)

| Category | Competencies |
|----------|--------------|
| Patient Care | Safe/quality care, communication, collaboration, health education |
| Empowering | Legal, ethico-moral-spiritual, personal/professional development |
| Enabling | Resource/environment management, records management |
| Enhancing | Research, quality improvement |

### Passing reference (for readiness score calibration)

- **75% general weighted average**
- **No subject/part below 60%**

ReviewNatin readiness score is **indicative only** — not a guarantee of PNLE pass.

### Mock exam config

```json
{
  "exam_type_slug": "pnle",
  "item_count": 500,
  "duration_seconds": 36000,
  "parts": ["np1-community", "np2-maternal-child", "np3-alterations-a", "np4-alterations-b", "np5-alterations-c"],
  "min_part_score_display": 60
}
```

### MVP content targets

| Metric | Target |
|--------|--------|
| Total questions | 1,500+ |
| Full mock exams | 3 |
| Per-part practice sets | 50 items minimum each |

---

## Blueprint versioning

Store in `exam_blueprints` table:

| Field | Example |
|-------|---------|
| `exam_type_id` | UUID |
| `version` | `1.0.0` |
| `effective_date` | `2026-05-01` |
| `topic_weights` | JSON (see structures above) |
| `mock_exam_config` | JSON |
| `official_source_url` | CSC / PRC link |
| `content_targets` | JSON min questions per subject |

When CSC or PRC publishes syllabus changes, create `1.1.0` blueprint — do not mutate published questions in place; use `question_versions`.

---

## Phase 2+ roadmap (not in MVP)

| Phase | Exams |
|-------|-------|
| 2 | UPCAT, DOST-SEI |
| 3 | CPALE, CELE, ECE |
| 4 | Bar, PSHS NCE (with strict non-affiliation copy), scholarships |

---

## Legal copy (per exam screen)

```
ReviewNatin is not affiliated with the Civil Service Commission (CSC),
Professional Regulation Commission (PRC), or any government agency.
For official exam schedules and registration, visit:
• CSC: https://www.csc.gov.ph
• PRC: https://www.prc.gov.ph / https://online.prc.gov.ph
```
