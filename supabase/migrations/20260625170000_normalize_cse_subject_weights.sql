-- CSE Professional and CSE Subprofessional subject_areas.weight_percent summed
-- to 110%, not 100% — an 'abstract' (Abstract Reasoning) subject area was
-- added after the original 4-subject 25/25/25/25 (and 30/30/20/20) split was
-- seeded, without rebalancing the rest. get_practice_questions/
-- get_diagnostic_questions both derive per-subject quotas from this column,
-- so an overstated total causes the final LIMIT to randomly trim whichever
-- subjects happen to rank last, rather than trimming according to weight.
--
-- Rescale every exam's subjects proportionally so they sum to exactly 100%,
-- preserving each subject's relative share. Exams that already sum to 100
-- (LET Elementary/Secondary, PNLE) are untouched by the `<> 100` guard.

UPDATE subject_areas sa
SET weight_percent = ROUND(sa.weight_percent * 100.0 / totals.total_weight, 2)
FROM (
  SELECT exam_type_id, SUM(weight_percent) AS total_weight
  FROM subject_areas
  GROUP BY exam_type_id
) totals
WHERE totals.exam_type_id = sa.exam_type_id
  AND totals.total_weight <> 100;

-- Re-derive the (unused-by-RPCs, but kept-truthful) blueprint snapshot from
-- the now-normalized weights, same as 20260625160000.
UPDATE exam_blueprints eb
SET topic_weights = (
  SELECT jsonb_object_agg(sa.slug, sa.weight_percent)
  FROM subject_areas sa
  WHERE sa.exam_type_id = eb.exam_type_id
),
mock_exam_config = mock_exam_config
  - 'components'
  || jsonb_build_object(
       'components',
       (
         SELECT jsonb_agg(jsonb_build_object('subject', sa.slug, 'weight_percent', sa.weight_percent) ORDER BY sa.sort_order)
         FROM subject_areas sa
         WHERE sa.exam_type_id = eb.exam_type_id
       )
     );
