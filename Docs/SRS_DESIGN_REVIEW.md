# SRS Design Review

Review date: 7 November 2026. Baseline: `SRS_DRAFT.md`, version 0.3. The baseline is preserved. This report reviews document design and source alignment; it does not record executed application acceptance tests.

## Findings before redesign

| ID | Severity | Location | Issue and reason | Proposed correction |
| --- | --- | --- | --- | --- |
| RV-01 | Critical | FR-34, UC-06, state model | The SRS requires a payment guard for online fulfilment. `../Backend/src/services/order.service.js`, `updateOrderStatus`, validates transition membership but contains no paid-status guard; its controller adds none. | Preserve the requirement, identify the implementation gap in the final decision register, and require evaluation with AT-F34. Do not change application behaviour during document redesign. |
| RV-02 | High | Cover and front matter | Product name is an unnumbered H2 and revision/contents headings skip the requested hierarchy. The cover has no page-layout contract. | Use one H1 title, a distinct cover, structured front matter and sequential numbered chapters. |
| RV-03 | High | Section 3.2 | FR-01–13 and FR-14–39 use different column structures; later rows combine long requirements and acceptance paragraphs. | Build a common four-column register; place acceptance/failure details in structured subsections without repeating complete statements. |
| RV-04 | High | Sections 3 and 8 | Some acceptance criteria depend on undefined eligibility, supported fields or file limits. | Retain wording, link checks to existing validators, and flag unresolved boundary values for review. |
| RV-05 | High | Sections 5 and 9 | NFR-06 and parts of NFR-11/12 depend on unagreed targets, browser versions and operational policy. | Retain TBD status and proposed evaluation conditions; do not convert them to verified results. |
| RV-06 | High | System models | Architecture, use-case, ER, checkout and state diagrams are absent. | Add five numbered, captioned diagrams derived from the SRS and source; keep payment/refund separate from fulfilment. |
| RV-07 | High | Section 8 | A single dense 51-row traceability matrix mixes FR and NFR checks. | Separate functional and quality matrices; preserve all original AT-F01–39 and AT-N01–12 assignments. |
| RV-08 | High | PDF export | Markdown cannot set A4, margins, Times New Roman, repeating table headers, page numbering or reliable chapter breaks. | Add a deterministic export workflow with explicit styles and render validation where supported. |
| RV-09 | Medium | Section 1 | Objectives and overview are combined inside audience; references and glossary numbering differ from the requested organization. | Separate 1.4 Objectives and 1.7 Overview; renumber glossary/references and update internal links. |
| RV-10 | Medium | Sections 4 and 6 | Planning instructions appear beside specifications; relationship rows group several entities. | Keep interface scope/context, remove obsolete authoring instructions, and add a source-checked ER view with optional cardinalities. |
| RV-11 | Medium | Section 7 | UC-01–06 have narrative fields; UC-07–12 compress different fields into a table. | Present all 12 using a consistent actor, goal, preconditions, trigger, numbered flow, alternatives, postconditions and requirements structure. |
| RV-12 | Medium | References | Source paths lack a consistent relative base and formal/internal references are mixed. | Use relative Markdown links; distinguish project documents, implementation evidence and structural guidance. Avoid machine-specific paths. |
| RV-13 | Medium | Glossary and terminology | INT, UC, AT, MRP, ORM and payment terminology are not all defined; fulfillment spelling varies. | Expand glossary and use “fulfilment” consistently while preserving source identifier spelling. |
| RV-14 | Medium | Section 9 checklist | Tasks already drafted are still described as not started. | Separate completed document preparation from pending approvals, figures and acceptance execution. |
| RV-15 | Medium | Figures and tables | No numbered table captions or export sizing rules exist. | Add consistent captions, deliberate column widths and figure sizing inside printable bounds. |
| RV-16 | Low | Global spacing | Table rows and prose use inconsistent density and some headings repeat long identifiers. | Normalize blank lines, heading spacing and concise labels without dropping technical content. |
| RV-17 | Low | Submission metadata | Student, guide, institution and academic-year details remain unknown. | Keep editable TBD placeholders and draft status. Never invent academic details. |

## Source alignment notes

- The Prisma schema has 14 models, including RefundAttempt. Some historical project notes still describe 11 models; the diagram will follow the current schema.
- `Payment.cashCollectedBy` and `RefundAttempt.requestedById` are scalar identifiers without declared Prisma User relations. Do not invent ER foreign-key edges for them.
- A User has zero or one Cart; an Order has zero or one Payment. These are optional relationships even though a successful checkout creates the relevant business records.
- Customer cancellation is limited to PENDING/CONFIRMED; administrator cancellation also permits PROCESSING. DELIVERED and CANCELLED have no outgoing fulfilment transitions.
- Checkout validates selection/address, calculates server-side totals, reserves stock conditionally and creates the order transactionally. Failed transactions roll back; dismissed gateway checkout does not mean an already created order was rolled back.

## Redesign and validation status

Faculty edition completed on 12 November 2026 as version 0.5. The PDF is 35 pages including the cover, contents and five diagrams. The original SRS_DRAFT.md is unchanged; the longer review edition is retained in SRS_ARCHIVE/SRS_FULL_REVIEW_EDITION.md.

Replaced 39 repeated narrative requirement blocks with input/acceptance tables. Shortened routine use cases, removed repeated actor/priority/traceability text, removed the internal field-specification note and condensed the working decision/checklist section into an academic review section. Retained the student's entered submission metadata, all 39 original functional statements, 12 quality requirements, seven interfaces, 12 use cases and all 51 acceptance-check identifiers and mappings.

Validation: generated the PDF using ReportLab with embedded Times New Roman, A4 pages, one-inch margins and a landscape ER page. Rendered all 35 pages using Poppler and visually reviewed the page sheets for clipping, table continuity, figures, captions and contents pagination. Automated checks confirm the original draft hash, requirement identifiers, functional statements, five Mermaid blocks and the 35-page total. Evidence is recorded in ../output/srs-final-validation.json. These are document checks; no application acceptance check was executed or marked passed.

DOCX was regenerated as an editable working export, but its pagination and automatic contents field remain unverified. The bundled DOCX renderer could not start because LibreOffice is absent. The PDF is the page-count-verified submission artifact. The previously identified unpaid-online-fulfilment implementation discrepancy remains recorded above; this document edit does not resolve application code or approve pending quality targets.
