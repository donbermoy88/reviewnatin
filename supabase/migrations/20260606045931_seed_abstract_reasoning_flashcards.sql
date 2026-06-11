-- Seed original Abstract Reasoning flashcards for CSE Professional and
-- CSE Subprofessional. Concept coverage was cross-checked against current
-- abstract/diagrammatic reasoning references on common pattern families:
-- rotation, reflection, movement, count, shading, position, addition,
-- subtraction, analogy, symmetry, and combination rules.

WITH flashcard_rows(topic_slug, front, back) AS (
  VALUES
    -- Pattern Completion
    ('pattern-completion', 'Abstract Reasoning: what is the first thing to inspect in a pattern-completion item?', 'Scan all panels before choosing. Identify what changes, what stays constant, and whether the missing panel must continue a row, column, or whole-grid rule.'),
    ('pattern-completion', 'How do you spot a rotation rule?', 'Track one asymmetric part, such as an arrow tip, notch, shaded corner, or triangle point. If it turns by a fixed angle each step, the rule is rotation.'),
    ('pattern-completion', 'How do you distinguish reflection from rotation?', 'Reflection creates a mirror image across an axis. Rotation turns the figure around a center. Use asymmetric details because symmetric shapes can hide the difference.'),
    ('pattern-completion', 'What is a fill or shading rule?', 'A shape cycles through fills such as empty, shaded, striped, dotted, or black. Map the cycle and apply the next fill to the missing panel.'),
    ('pattern-completion', 'What is an addition/subtraction rule in a visual grid?', 'Panels combine or remove elements. In a 3-column row, column 3 may equal column 1 plus column 2, or may show only what differs between them.'),
    ('pattern-completion', 'What is the safe way to solve a matrix pattern?', 'Check rows and columns separately. A valid answer must satisfy the horizontal rule and the vertical rule, not only one direction.'),
    ('pattern-completion', 'When should you count elements?', 'Count when shapes, dots, lines, sides, corners, or intersections change. Many abstract patterns use +1, -1, alternating, or row/column totals.'),
    ('pattern-completion', 'What is a combination rule?', 'Two or more rules run together, such as rotation plus shading, or movement plus count. Solve each rule separately before selecting an answer.'),

    -- Series Completion
    ('series-completion', 'Series Completion: what does "next in the sequence" require?', 'Find the rule from left to right, predict the next panel before looking at choices, then eliminate options that break the rule.'),
    ('series-completion', 'What is a movement or position-shift pattern?', 'One element moves through fixed positions, such as corners, edges, or grid cells. Track only that element and continue its path.'),
    ('series-completion', 'How do alternating rules work in a shape series?', 'Odd-numbered panels follow one rule and even-numbered panels follow another. Compare panels 1-3-5 and 2-4-6 separately.'),
    ('series-completion', 'How do you solve a series with both rotation and count?', 'Track rotation and count independently. Example: if a triangle turns 45 degrees each frame and dots increase by one, continue both changes.'),
    ('series-completion', 'What is a size progression?', 'The same element grows or shrinks in a cycle, such as small -> medium -> large -> small, or increases steadily each step.'),
    ('series-completion', 'What is a common trap in series questions?', 'Distractor shapes may stay constant while one small detail changes. Focus on the changing attribute, not the most noticeable object.'),
    ('series-completion', 'How do you handle a series that seems unclear after 20 seconds?', 'Switch to a checklist: movement, rotation, count, shading, size, position, add/subtract. If still unclear, eliminate impossible choices and return later.'),
    ('series-completion', 'Why should you predict before checking answer choices?', 'Prediction prevents answer choices from misleading you. The best option should match your rule, not just look visually similar.'),

    -- Figural Analogies
    ('analogies', 'Figural Analogy: what does A is to B as C is to ? mean?', 'Identify the exact transformation from A to B, then apply the same transformation to C. The answer must preserve the relationship.'),
    ('analogies', 'What transformations commonly appear in figural analogies?', 'Rotation, reflection, size change, position shift, color/fill change, element addition/removal, and shape substitution.'),
    ('analogies', 'How do you test if an analogy answer is valid?', 'Apply the A -> B rule to C. Reject choices that add extra changes or miss part of the transformation.'),
    ('analogies', 'What is shape substitution in an analogy?', 'One shape type is consistently replaced by another, such as circle -> square or triangle -> diamond, while position or fill may stay the same.'),
    ('analogies', 'How do fill changes work in figural analogies?', 'If A changes from hollow to shaded in B, then C should undergo the same fill change unless another rule clearly controls fill.'),
    ('analogies', 'How do position relationships matter in analogies?', 'Look at inside/outside, above/below, left/right, and corner positions. The relative placement often matters more than the exact shape.'),
    ('analogies', 'What is a two-step figural analogy?', 'A transformation has two rules, such as rotate 90 degrees and invert shading. Apply both to C in the same order.'),
    ('analogies', 'What is the biggest analogy mistake?', 'Choosing an answer that copies the appearance of B instead of applying the A -> B transformation to C.'),

    -- Odd One Out
    ('odd-one-out', 'Odd One Out: what is the goal?', 'Find the single figure that does not share the rule common to the others. The rule may involve shape, count, fill, position, symmetry, or movement.'),
    ('odd-one-out', 'What attributes should you compare first in odd-one-out items?', 'Compare number of elements, shape type, number of sides, fill/shading, orientation, symmetry, and relative position.'),
    ('odd-one-out', 'How can symmetry identify the odd figure?', 'Four figures may have vertical, horizontal, or rotational symmetry while one does not. Check whether a fold or rotation preserves the figure.'),
    ('odd-one-out', 'How can element count identify the odd figure?', 'Count all repeated objects, dots, sides, or intersections. The odd figure often has one extra, one missing, or a different parity.'),
    ('odd-one-out', 'How can fill pattern identify the odd figure?', 'Most figures may share the same solid/hollow/striped relationship while one reverses or breaks the fill cycle.'),
    ('odd-one-out', 'How can orientation identify the odd figure?', 'A group may point clockwise, face the same direction, or rotate by equal steps. The odd figure points or turns inconsistently.'),
    ('odd-one-out', 'What if two choices look different in an odd-one-out item?', 'Search for a rule shared by four figures. The correct odd one is the only figure excluded by a consistent rule, not just the one that looks unusual.'),
    ('odd-one-out', 'What is the best elimination strategy for odd-one-out?', 'Name the shared rule out loud or mentally. If a rule excludes more than one figure, it is not specific enough; test another attribute.')
),
target_topics AS (
  SELECT t.id AS topic_id, t.slug AS topic_slug
  FROM exam_types et
  JOIN subject_areas sa ON sa.exam_type_id = et.id
  JOIN topics t ON t.subject_area_id = sa.id
  WHERE et.slug IN ('cse-professional', 'cse-subprofessional')
    AND sa.slug = 'abstract'
)
INSERT INTO flashcards (topic_id, front, back, is_premium)
SELECT tt.topic_id, fr.front, fr.back, false
FROM target_topics tt
JOIN flashcard_rows fr ON fr.topic_slug = tt.topic_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM flashcards existing
  WHERE existing.topic_id = tt.topic_id
    AND existing.front = fr.front
    AND existing.back = fr.back
);
