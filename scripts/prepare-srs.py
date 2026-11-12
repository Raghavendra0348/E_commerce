"""Reorganize the preserved SRS baseline and validate its identifiers."""
from pathlib import Path
import re, json, hashlib

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'Docs'
BASE = DOCS / 'SRS_DRAFT.md'
text = BASE.read_text(encoding='utf-8')
baseline_hash = hashlib.sha256(BASE.read_bytes()).hexdigest()
figdir = DOCS / 'SRS_FIGURES'
figdir.mkdir(exist_ok=True)

def section(start, end):
    return text.split(start, 1)[1].split(end, 1)[0].strip()

def rows(s):
    return [[c.strip() for c in line.strip().strip('|').split('|')]
            for line in s.splitlines() if line.startswith('|') and not re.match(r'^\|\s*[-:]', line)]

def table(headers, data):
    return '\n'.join(['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join('---' for _ in headers) + ' |']
                     + ['| ' + ' | '.join(r) + ' |' for r in data])

fr = {}
for row in rows(section('### 3.2 Functional Requirement Register', '### 3.3')):
    if re.fullmatch(r'FR-\d{2}', row[0]):
        fr[row[0]] = {'module': row[1], 'statement': row[2], 'acceptance': row[3] if len(row)>3 else ''}
inputs = {}
for row in rows(section('### 3.3 Acceptance Criteria', '### 3.4')):
    if re.fullmatch(r'FR-\d{2}', row[0]):
        inputs[row[0]], fr[row[0]]['acceptance'] = row[1], row[2]
trace = [r for r in rows(section('## 8. Acceptance Criteria and Traceability', '## 9.'))
         if re.fullmatch(r'(?:FR|NFR)-\d{2}', r[0])]
trace_by_id = {r[0]:r for r in trace}
nfr = [r for r in rows(section('## 5. Non-Functional Requirements', '## 6.')) if re.fullmatch(r'NFR-\d{2}',r[0])]
interfaces = [r for r in rows(section('### 4.1 Interface Contracts','## 5.')) if re.fullmatch(r'INT-\d{2}',r[0])]
uc_rows = [r for r in rows(section('## 7. Use Cases and System Models','### 7.1')) if re.fullmatch(r'UC-\d{2}',r[0])]

diagrams = {
'01-architecture': '''flowchart TB
  customer["Customer browser"] --> frontend["React / Vite frontend"]
  admin["Administrator browser"] --> frontend
  frontend <-->|"HTTP JSON / HTTPS in production"| backend["Node.js / Express backend"]
  backend <--> prisma["Prisma ORM"]
  prisma <--> database[("PostgreSQL database")]
  backend <--> razorpay["Razorpay API"]
  razorpay -->|"Signed webhook"| backend
  frontend <-->|"Checkout interaction"| razorpay
  backend <--> cloudinary["Cloudinary image storage"]
  backend <--> local["Local image storage"]
  backend <-->|"PIN lookup"| postal["Postal PIN provider"]
''',
'02-use-cases': '''flowchart LR
  guest["Actor: Guest"]
  customer["Actor: Customer"]
  admin["Actor: Administrator"]
  provider["Actor: Payment provider"]
  subgraph system["E-Commerce Web Application"]
    direction TB
    uc02(["UC-02 Search catalog"])
    uc07(["UC-07 Manage account"])
    uc10(["UC-10 Read / submit reviews"])
    uc01(["UC-01 Purchase items"])
    uc03(["UC-03 Maintain addresses"])
    uc04(["UC-04 Cancel order"])
    uc08(["UC-08 Manage cart"])
    uc09(["UC-09 Maintain wishlist"])
    uc11(["UC-11 View / reorder"])
    uc05(["UC-05 Maintain catalog"])
    uc06(["UC-06 Advance fulfilment"])
    uc12(["UC-12 Administer operations"])
  end
  guest --- uc02
  guest --- uc07
  guest --- uc10
  customer --- uc01
  customer --- uc02
  customer --- uc03
  customer --- uc04
  customer --- uc07
  customer --- uc08
  customer --- uc09
  customer --- uc10
  customer --- uc11
  admin --- uc05
  admin --- uc06
  admin --- uc12
  provider --- uc01
  provider --- uc12
''',
'03-entities': '''erDiagram
  direction TB
  User ||--o| Cart : owns
  User ||--o{ Address : saves
  User ||--o{ Order : places
  User ||--o{ Wishlist : saves
  User ||--o{ Review : writes
  User ||--o{ RefreshToken : has
  Category ||--o{ Product : groups
  Product ||--o{ ProductImage : has
  Product ||--o{ CartItem : appears_in
  Product ||--o{ OrderItem : purchased_as
  Product ||--o{ Wishlist : saved_as
  Product ||--o{ Review : receives
  Cart ||--o{ CartItem : contains
  Order ||--o{ OrderItem : contains
  Order ||--o| Payment : has
  Payment ||--o{ RefundAttempt : records
''',
'04-checkout': '''flowchart TB
  start(["Select cart items"]) --> address["Validate selection and address"]
  address --> addressOk{"Valid?"}
  addressOk -->|"No"| correct(["Show validation error"])
  addressOk -->|"Yes"| prices["Calculate server prices; check stock"]
  prices --> stockOk{"Stock OK?"}
  stockOk -->|"No"| rollback(["Roll back and show error"])
  stockOk -->|"Yes"| order["Atomic stock reservation and order creation"]
  order --> method{"Method?"}
  method -->|"COD"| cod["CONFIRMED; payment PENDING"]
  method -->|"Online"| online["PENDING; Razorpay checkout"]
  online --> verify["Server verifies payment"]
  verify --> paid{"Verified?"}
  paid -->|"Yes"| confirmed["PAID; confirm eligible order"]
  paid -->|"No / dismissed"| unpaid(["Show unpaid order and retry option"])
  unpaid -.->|"Eligible retry"| online
  cod --> finish(["Show confirmation with actual states"])
  confirmed --> finish
''',
'05-fulfilment': '''stateDiagram-v2
  direction TB
  [*] --> PENDING: Online order created
  [*] --> CONFIRMED: COD order created
  PENDING --> CONFIRMED: Verified payment / permitted confirmation
  CONFIRMED --> PROCESSING: Administrator
  PROCESSING --> SHIPPED: Administrator
  SHIPPED --> DELIVERED: Administrator
  PENDING --> CANCELLED: Customer or administrator
  CONFIRMED --> CANCELLED: Customer or administrator
  PROCESSING --> CANCELLED: Administrator only
  DELIVERED --> [*]
  CANCELLED --> [*]
'''
}
# Cardinalities and entity names carry the ER semantics; omit repetitive edge
# verbs so the full model remains readable on an A4 landscape figure page.
diagrams['03-entities'] = re.sub(r': [a-z_]+$', ': " "', diagrams['03-entities'], flags=re.M)
for name, code in diagrams.items():
    (figdir / (name+'.mmd')).write_text(code,encoding='utf-8')

def figure(name, number, caption, explanation):
    return f'```mermaid\n{diagrams[name].strip()}\n```\n\n*Figure {number}. {caption}*\n\n{explanation}\n\n[Rendered figure](SRS_FIGURES/{name}.svg)\n'

out = []
def add(s): out.append(s.strip())
add('''<div align="center">

# SOFTWARE REQUIREMENTS SPECIFICATION

FOR

**E-COMMERCE WEB APPLICATION**

Academic project — Amazon-inspired storefront

</div>

| Submission field | Editable value |
| --- | --- |
| Submitted by | [TBD: Student / team name] |
| Register / Roll Number | [TBD] |
| Department | [TBD] |
| Programme | [TBD] |
| College / University | [TBD] |
| Project Guide | [TBD] |
| Academic Year | [TBD] |
| Document Version | 0.4 |
| Submission Date | [TBD] |
| Preparation Date | 7 November 2026 |
| Status | Draft for review — approval pending |

<!-- COVER PAGE ENDS: exporters start document control on a new page. -->

**Document control**

This edition reorganizes version 0.3 without changing its requirement identifiers or business intent. “FINAL” in the filename identifies the redesigned deliverable, not an approved baseline. All acceptance checks remain unexecuted for this review. Unknown academic details and unagreed quality targets remain TBD. The structure is informed by the SRS documentation skill; no formal IEEE compliance claim is made.

**Revision history**''')
revision = rows(section('### Revision history','### Contents'))[1:]
add(table(['Version','Date','Description','Author'],revision+[['0.4','7 November 2026','Presentation redesign, five system figures, consistent use cases and split traceability','[TBD: Student name]']]))
add('[[CONTENTS]]')
add('## 1. INTRODUCTION')
add('### 1.1 Purpose\n\n'+section('### 1.1 Purpose','### 1.2'))
add('### 1.2 Project Scope\n\n'+section('### 1.2 Project Scope','### 1.3'))
add('### 1.3 Intended Audience\n\n'+section('### 1.3 Intended Audience','### 1.3.1'))
add('### 1.4 Project Objectives\n\nThe project aims to let customers purchase selected catalog items, preserve accurate order and stock records, and let administrators maintain the catalog and fulfil orders.')
add('### 1.5 Definitions and Abbreviations\n\n'+section('### 1.4 Definitions and Abbreviations','### 1.5'))
add(table(['Term','Meaning'],[['INT','External interface identifier'],['UC','Use case identifier'],['AT','Acceptance check identifier'],['MRP','Maximum retail price / original price displayed by the catalog'],['ORM','Object-relational mapper; Prisma provides the application data interface'],['JWT','JSON Web Token used by authentication'],['Fulfilment','Order processing and delivery progress'],['Refund pending','Repayment has not yet been confirmed complete by the gateway']]))
add('### 1.6 References\n\nThe original draft and project documentation are internal project references. Implementation files below were inspected for alignment; their presence does not prove a requirement has passed testing.\n\n'+table(['Reference','Document / source','Purpose'],[
 ['REF-01','[SRS version 0.3](SRS_DRAFT.md)','Preserved requirements baseline'],
 ['REF-02','[Project memory](../AGENTS.md)','Historical decisions and project context'],
 ['REF-03','[Frontend plan](FRONTEND_PLAN.md)','Internal interface and feature plan'],
 ['REF-04','[Original backend plan](Backend/ecommerce_backend_plan.md)','Historical API design context'],
 ['REF-05','[Prisma schema](../Backend/prisma/schema.prisma)','Entity and relationship verification'],
 ['REF-06','[Order service](../Backend/src/services/order.service.js)','Checkout, cancellation and state transitions'],
 ['REF-07','[Input validators](../Backend/src/validators)','Field rules and validation boundaries'],
 ['REF-08','[SRS documentation skill](../.agents/skills/srs-documentation/SKILL.md)','IEEE 830-style organizational guidance; not a formal standards assessment'],
 ['REF-09','[Design review](SRS_DESIGN_REVIEW.md)','Formatting findings and implementation discrepancies']]))
add('### 1.7 Document Overview\n\nChapters 1–2 establish scope, actors and constraints. Chapters 3–6 specify behaviour, interfaces, quality and data. Chapter 7 describes workflows and system models. Chapter 8 preserves acceptance-check mappings. Chapter 9 records unresolved decisions and approval status.')
add('## 2. OVERALL DESCRIPTION')
add('### 2.1 Product Perspective\n\n'+section('### 2.1 Product Perspective','### 2.2'))
add(figure('01-architecture',1,'High-level system architecture','Browsers use the frontend and backend API. Prisma connects the backend to PostgreSQL; browsers have no direct database path. Razorpay handles the customer checkout interaction and sends signed notifications to the backend. Cloudinary and local storage represent configured image-storage options.'))
for n,title,nexttitle in [(2,'User Classes','### 2.3'),(3,'Operating Environment','### 2.4'),(4,'Assumptions and Dependencies','### 2.5')]:
    add(f'### 2.{n} {title}\n\n'+section(f'### 2.{n} {title}',nexttitle))
    if n == 2:
        add(figure('02-use-cases',2,'UML use-case view','Rectangles identify actors and ellipses identify use cases within the system boundary. Solid associations indicate participation rather than processing order. Mermaid flowchart notation renders this UML-style view; no unsupported include, extend or inheritance relationships are asserted. Guests participate in reading reviews, while submission requires authentication. Payment-provider participation is limited to payment interaction and reconciliation within UC-01/UC-12.'))
add('### 2.5 Constraints\n\n'+section('### 2.5 Constraints and Operations','## 3.'))
add('## 3. FUNCTIONAL REQUIREMENTS')
add('### 3.1 Requirement Conventions\n\nEach FR identifier denotes one preserved requirement. Mandatory statements use “The system shall”. All requirements are Draft with proposed Must Have priority (M), pending review. Section 3.2 contains the authoritative statements; Section 3.3 contains inputs, acceptance and failure details; Section 3.4 expands checkout. Chapter 8 retains the original acceptance-check identifiers. No listed check is marked passed.')
add('### 3.2 Functional Requirement Register')
for j,start in enumerate([1,14,27],1):
    stop=min(start+12,39)
    add(f'#### 3.2.{j} Requirements FR-{start:02d} to FR-{stop:02d}\n\n'+table(['Requirement ID','Module','Requirement statement','Priority'],[[f'FR-{i:02d}',fr[f'FR-{i:02d}']['module'],fr[f'FR-{i:02d}']['statement'],'M'] for i in range(start,stop+1)]))
add('### 3.3 Detailed Functional Requirements\n\nThese details supplement the register without repeating its full statements. The acceptance/failure text preserves the baseline. Preconditions express the actors and eligibility already stated in the requirement or use case; uncertain boundaries remain open in Chapter 9.')
later_inputs={14:'Sign-out action and current session',15:'Own account identifier and supported profile fields',16:'Current password and new password',17:'Sort field, direction, page and active filters',18:'Product identifier and requested quantity',19:'Product identifier in the current cart',20:'Owned address identifier and edited fields',21:'Owned address identifier and delete action',22:'Selected cart items, owned address and COD method',23:'Eligible existing unpaid application order and payment retry',24:'Owned order identifier and cancellation confirmation',25:'Eligible cancelled paid online order and refund request',26:'Signed gateway event with payment/refund identifiers',27:'Eligible delivered COD order and collection action',28:'Saved product identifier and remove action',29:'Product identifier and requested review page',30:'Validated product details, price, stock and category',31:'Product identifier and delete request',32:'Product identifier and supported multipart image file',33:'Category identifier or details and create/update/delete action',34:'Order identifier and requested next fulfilment state',35:'Requested user page or supported role change',36:'Dashboard / inventory overview request',37:'Search text, date preset, status filter and history page',38:'Owned order identifier',39:'Previously ordered product identifier and add action'}
for i in range(1,40):
    rid=f'FR-{i:02d}'; r=fr[rid]
    actor = r['module'].split(' / ')[0] if i>=14 else {'FR-01':'Guest','FR-02':'Registered account holder','FR-03':'Guest or customer','FR-04':'Guest or customer','FR-05':'Customer','FR-06':'Customer','FR-07':'Customer','FR-08':'Customer / payment provider','FR-09':'Customer','FR-10':'Customer','FR-11':'Authenticated customer','FR-12':'Administrator','FR-13':'Guest or customer'}[rid]
    pre = 'The relevant catalog or public interface is available.' if i in [1,2,3,4,13,17,29] else 'The actor is authenticated and authorized for the relevant account/resource.'
    if i in [23,24,25,27]: pre += ' The order meets the eligibility conditions stated below.'
    if i == 26: pre = 'The payment provider supplies an event whose signature and payment/refund references must be validated.'
    criteria=r['acceptance'] or ('See Section 3.4 for the selected-item checkout conditions.' if i==6 else '')
    add(f'#### 3.3.{i} {rid} {r["module"]}\n\n**Actor:** {actor}. **Priority:** M.\n\n**Preconditions:** {pre}\n\n**Inputs / trigger:** {inputs.get(rid,later_inputs.get(i,"Selected cart item IDs, owned delivery address and payment method"))}.\n\n**Acceptance and failure behaviour:** {criteria}\n\n**Traceability:** {trace_by_id[rid][1]}; {re.search(r"AT-F\d{2}",trace_by_id[rid][2]).group()}.')
add('### 3.4 Checkout Requirements\n\n'+section('### 3.4 Worked Example: FR-06 — Selected Cart Checkout','## 4.'))
add('## 4. EXTERNAL INTERFACE REQUIREMENTS')
add('### 4.1 Interface Scope\n\n'+section('## 4. External Interface Requirements','### 4.1'))
add('### 4.2 Interface Contracts\n\n'+table(['Interface ID','Interface','Input / communication','Required response / failure handling'],interfaces))
add('### 4.3 Field Specifications\n\nDetailed input rules are maintained in the [backend validators](../Backend/src/validators). Supported upload types/limits and specific eligibility boundaries require review where the requirement does not state them explicitly. Source inspection is evidence of implementation structure, not an acceptance-test result.')
add('## 5. NON-FUNCTIONAL REQUIREMENTS\n\nAll quality requirements remain Draft. Proposed targets are not measured results.')
for n,(start,stop,title) in enumerate([(1,6,'Security integrity and evaluation targets'),(7,12,'Usability protection and operations')],1):
    add(f'### 5.{n} {title}\n\n'+table(['Requirement ID','Quality','Draft requirement / target','Verification method'],[r for r in nfr if start<=int(r[0][-2:])<=stop]))
add('### 5.3 Proposed Evaluation Conditions\n\n'+section('For NFR-05, proposed evaluation widths','## 6.').join(['For NFR-05, proposed evaluation widths','']))
add('## 6. DATA REQUIREMENTS\n\n'+section('## 6. Data Requirements','### 6.1'))
for start,end in [('### 6.1 Initial Data Dictionary','### 6.2'),('### 6.2 Field Types and Business Rules','### 6.3')]:
    add(start+'\n\n'+section(start,end))
relationship=section('### 6.3 Ownership and Relationships','## 7.').split('This relationship table',1)[0].strip()
add('### 6.3 Ownership and Relationships\n\n'+relationship+'\n\nData-retention periods, account-erasure procedures and backup retention remain policy decisions. No automatic deletion schedule is assumed.')
add('### 6.4 Entity Relationship Model\n\n'+figure('03-entities',3,'Entity relationship diagram','Crow’s-foot notation shows the 14 Prisma models and their declared relationships. The circle indicates an optional side. A User may have no Cart and an Order may have no Payment; an empty Cart is permitted by storage. Successful orders contain purchased lines as a business rule. cashCollectedBy and requestedById are scalar audit identifiers without declared User relations, so no foreign-key edges are invented.'))
add('## 7. USE CASES AND SYSTEM MODELS\n\nThe workflow descriptions preserve the baseline use cases. Primary actors, preconditions, triggers, numbered steps, alternatives and postconditions use one presentation throughout.')
add('### 7.1 Use Case Register\n\n'+table(['Use case ID','Use case name','Primary actor'],uc_rows))
add('### 7.2 UML Use Case View\n\nFigure 2 in Section 2.2 provides the system-boundary view of all 12 use cases. The following specifications expand each association into observable flows.')
for i in range(1,7):
    uid=f'UC-{i:02d}'; source=section(f'### 7.{i} {uid}',f'### 7.{i+1}' if i<6 else '### 7.7')
    title=uc_rows[i-1][1]
    fields={k:re.search(r'\*\*'+k+r':\*\*\s*(.*?)(?=\s*\*\*|\n\n|$)',source,re.S).group(1).strip() for k in ['Goal','Preconditions','Trigger']}
    steps='\n'.join(re.findall(r'^\d+\. .*$',source,re.M))
    alternatives=source.split('**Alternatives:**',1)[1].split('**Postconditions:**',1)[0].strip()
    post=source.split('**Postconditions:**',1)[1].split('**Requirements:**',1)[0].strip()
    related=source.split('**Requirements:**',1)[1].strip()
    add(f'### 7.{i+2} {uid} {title}\n\n**Primary actor:** {uc_rows[i-1][2]}.\n\n**Goal:** {fields["Goal"]}\n\n**Preconditions:** {fields["Preconditions"]}\n\n**Trigger:** {fields["Trigger"]}\n\n**Main success flow:**\n\n{steps}\n\n**Alternative flows:** {alternatives}\n\n**Postconditions:** {post}\n\n**Related requirements:** {related}')
support = [r for r in rows(section('### 7.7 Supporting Use Cases','### 7.8')) if re.fullmatch(r'UC-\d{2}',r[0])]
goals=['Manage account access and supported settings.','Maintain chosen cart quantities and items.','Maintain saved products.','Read product feedback and submit one eligible review.','Review owned orders and purchase available items again.','Maintain authorized payment, user and operational records.']
related=['FR-01, FR-02, FR-14, FR-15, FR-16','FR-05, FR-18, FR-19','FR-10, FR-28','FR-11, FR-29','FR-09, FR-37, FR-38, FR-39','FR-12, FR-25, FR-26, FR-27, FR-35, FR-36']
for j,r in enumerate(support):
    i=j+7
    flow=r[2].replace('; ','. ')
    add(f'### 7.{i+2} {r[0]} {uc_rows[i-1][1]}\n\n**Primary actor:** {uc_rows[i-1][2]}.\n\n**Goal:** {goals[j]}\n\n**Preconditions:** Public reading/registration is available to guests; private actions require an authorized session. UC-12 provider reconciliation requires a valid gateway signature.\n\n**Trigger:** {r[1]}.\n\n**Main success flow:**\n\n1. The actor opens or invokes the relevant operation.\n2. {flow}\n3. The system presents the resulting current state.\n\n**Alternative flows:** {r[3]}\n\n**Postconditions:** Successful changes persist within the actor’s authorized scope; rejected operations do not grant access or duplicate recorded effects.\n\n**Related requirements:** {related[j]}.')
add('### 7.15 Checkout Activity Model\n\n'+figure('04-checkout',4,'Checkout activity diagram','Selection/address validation precedes calculation from server prices and conditional stock reservation. Order creation, reservation and selected-cart removal are one transaction. Database failures roll back. Gateway dismissal occurs after application order creation and therefore leaves an unpaid order for an eligible retry. A late capture after cancellation is reconciled through refund handling; it does not reopen fulfilment.'))
state=section('### 7.8 Fulfilment State Model','## 8.').split('This table describes',1)[0].strip()
add('### 7.16 Order Fulfilment State Model\n\n'+state)
add(figure('05-fulfilment',5,'Order fulfilment state diagram','Customer cancellation is limited to PENDING/CONFIRMED; administrator cancellation also permits PROCESSING. DELIVERED and CANCELLED are terminal fulfilment states. Payment/refund reconciliation is separate. The online paid-status guard remains a requirement with an implementation discrepancy recorded in OD-07; this diagram is a requirements model, not a claim that the administrator guard is implemented.'))
add('## 8. ACCEPTANCE CRITERIA AND TRACEABILITY\n\nAll checks remain **Not assessed for this SRS**. The identifiers and requirement/use-case/check associations from version 0.3 are preserved. Historical application test results are not substituted for this review’s acceptance evidence.')
for heading,prefix in [('### 8.1 Functional Requirements Traceability Matrix','FR-'),('### 8.2 Non-Functional Requirements Traceability Matrix','NFR-')]:
    add(heading+'\n\n'+table(['Requirement','Use case','Original acceptance check'],[r for r in trace if r[0].startswith(prefix)]))
add('### 8.3 Evidence Records\n\n'+section('For executed checks, add an evidence record','## 9.').join(['For executed checks, add an evidence record','']))
add('## 9. OPEN DECISIONS AND REVIEW')
add('### 9.1 Decision Register\n\n'+section('### 9.1 Decision Register','### 9.2'))
add(table(['ID','Decision required','Current position','Suggested reviewer'],[
 ['OD-07','Online fulfilment payment guard','FR-34 and UC-06 require rejection of unpaid online advancement. The inspected administrator update service/controller does not enforce the paid-status guard. Preserve the requirement and resolve the implementation gap.','Project team / evaluator'],
 ['OD-08','Acceptance boundaries','Confirm supported profile fields, image types/limits and payment-retry/refund eligibility against validators and gateway rules before approving the corresponding checks.','Project team / guide'],
 ['OD-09','Export validation','Record the actual PDF/DOCX renderer availability, visual review and remaining export limitations in the design review report.','Document reviewer']]))
add('### 9.2 Completion Checklist\n\n- [x] Preserve the original version 0.3 document and requirement identifiers.\n- [x] Standardize headings, requirement presentation and use-case structure.\n- [x] Prepare source-aligned system diagram definitions.\n- [x] Preserve the 51 original acceptance-check mappings.\n- [ ] Fill academic metadata and confirm the college format.\n- [ ] Approve scope, priorities and measurable quality targets.\n- [ ] Resolve implementation discrepancies and eligibility boundaries.\n- [ ] Execute acceptance checks and attach dated evidence.\n- [ ] Complete final academic approval and record export validation results.')
add('### 9.3 Review and Approval\n\n'+section('### 9.2 Review and Approval','The document remains')+'\n\nThe document remains a draft until the required reviewers approve its content and unresolved decisions are recorded.')

final='\n\n'.join(out)+'\n'
# Number each table consistently, including the cover metadata and front matter.
number=0
lines=final.splitlines(); captioned=[]
for i,line in enumerate(lines):
    if line.startswith('|') and (i==0 or not lines[i-1].startswith('|')):
        number+=1
        if i<35: label='Submission details'
        else:
            last=next((x for x in reversed(captioned) if x.startswith('#') or x=='**Revision history**'),'Document control')
            label=re.sub(r'^#+\s*|^\*\*|\*\*$','',last)
        captioned.extend([f'*Table {number}. {label}*',''])
    captioned.append(line)
final='\n'.join(captioned)+'\n'
def slug(s):
    return re.sub(r'[^\w\s-]','',s.lower()).replace(' ','-')
toc=['**Contents**','']
for match in re.finditer(r'^(#{2,4}) (.+)$',final,re.M):
    level=len(match[1])-2
    toc.append('  '*level+'- ['+match[2]+'](#'+slug(match[2])+')')
final=final.replace('[[CONTENTS]]','\n'.join(toc))
(DOCS/'SRS_FINAL.md').write_text(final,encoding='utf-8')
payload={'baseline_sha256':baseline_hash,'figures':list(diagrams),'functional':fr,'nfr':nfr,'interfaces':interfaces,'traceability':trace,'table_count':number}
(ROOT/'output'/'srs-data.json').write_text(json.dumps(payload,indent=2,ensure_ascii=False),encoding='utf-8')
print(f'Prepared SRS_FINAL.md: {len(fr)} FR, {len(nfr)} NFR, {len(interfaces)} interfaces, {len(trace)} checks, {number} tables, {len(diagrams)} figures.')
