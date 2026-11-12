# SRS Working Plan

Date: 7 November 2026

## Current document

[SRS_DRAFT.md](SRS_DRAFT.md) is the editable college-submission draft, version 0.3. It contains 39 functional requirements, 12 quality requirements, 12 use cases (six detailed and six supporting), interface contracts, a data dictionary, relationship/state tables and a draft acceptance mapping for every requirement.

The project-installed [srs-documentation skill](../.agents/skills/srs-documentation/SKILL.md) supplies an IEEE 830-style outline and writing checklist. This draft does not claim certification or completed acceptance testing.

## Recommended writing order

1. Fill in the project title, student names, roll numbers, department, college, guide and academic year.
2. Review scope and proposed priorities with the guide. Confirm whether the department requires a specific chapter sequence or page limit.
3. Review functional requirements, especially payment retries, cancellation eligibility, COD collection and refunds.
4. Review the six detailed and six supporting use cases against the agreed scope.
5. Create the ER model from the current Prisma schema and add the department's required use-case/DFD/activity diagrams.
6. Agree browser support, accessibility, performance, availability and recovery targets. Unagreed numbers remain TBD.
7. Review the complete draft traceability matrix and record actual verification evidence separately from proposed acceptance checks.
8. Review using the skill's checklist, then produce the final Word/PDF submission.

## Source priorities

Use the current source and project decisions when historical plans disagree. The November source inspection reviewed the order/payment routes, cancellation service, authentication validator and Prisma schema. This is document preparation, not a new execution of the application test suite.

## Details still needed

| Detail | Current value |
| --- | --- |
| Final project title | E-Commerce Web Application (working title) |
| Student / team details | To be supplied |
| College and guide | To be supplied |
| Academic year | To be supplied |
| Required submission template | Standard outline unless the college specifies otherwise |
| Final output format | Markdown draft now; Word/PDF after content review |
