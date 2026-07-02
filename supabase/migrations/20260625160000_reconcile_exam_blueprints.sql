-- exam_blueprints.topic_weights / mock_exam_config are not read by any RPC or
-- app code (verified by repo-wide grep) — subject_areas.weight_percent is the
-- one live source of truth (used by get_diagnostic_questions and
-- get_practice_questions). topic_weights had drifted stale: e.g. CSE
-- Professional/Subprofessional gained an "abstract" subject area after this
-- table was last hand-seeded, so it was missing entirely from topic_weights.
-- Re-derive both JSONB columns from subject_areas so anything that reads this
-- table later (admin tooling, a future blueprint-breakdown screen) sees the
-- truth instead of a stale snapshot. This does not change selection behavior.

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
