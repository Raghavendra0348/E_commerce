from pathlib import Path
import re
p=Path(__file__).resolve().parents[1]/'Docs/SRS_FINAL.md'
s=p.read_text(encoding='utf-8')
s=s.replace('Editable value','Details')
s=s.replace('The actor opens or invokes the relevant operation. ','').replace(' The system presents the resulting current state.','')
s=s.replace('The workflow descriptions preserve the baseline use cases. Primary actors, preconditions, triggers, numbered steps, alternatives and postconditions use one presentation throughout.','The following use cases describe customer and administrator workflows, their prerequisites, results and exceptions.')
common='Public reading/registration is available to guests; private actions require an authorized session. UC-12 provider reconciliation requires a valid gateway signature.'
for n,new in {7:'Registration and sign-in are available to guests; profile and password changes require an authenticated account.',8:'The customer is signed in. Cart changes must satisfy current stock limits.',9:'The customer is signed in and the selected product exists.',10:'The product exists. Reading is public; submission requires a signed-in customer.',11:'The customer is signed in. Order details are restricted to their owner.',12:'An authenticated administrator performs administrative actions. Provider notifications require a valid gateway signature.'}.items():
    pat=rf'(### 7\.\d+ UC-{n:02d}[^\n]*\n)(.*?)(?=### |\Z)'
    m=re.search(pat,s,re.S)
    if m:s=s[:m.start()]+m[1]+m[2].replace(common,new)+s[m.end():]
if '### 4.3 Field Specifications' in s:
    start=s.index('### 4.3 Field Specifications');end=s.index('## 5.')
    s=s[:start]+s[end:]
s=s.replace('The online paid-status guard remains a requirement with an implementation discrepancy recorded in OD-07; this diagram is a requirements model, not a claim that the administrator guard is implemented.','The online paid-status guard is required by FR-34; implementation verification is recorded separately in the design review.')
s=s.replace('Chapter 9 records unresolved decisions and approval status.','Chapter 9 records outstanding agreements and the review process.')
s=s.replace('## 9. REVIEW AND REFERENCES','## 9. REVIEW AND APPROVAL').replace('[9. REVIEW AND REFERENCES](#9-review-and-references)','[9. REVIEW AND APPROVAL](#9-review-and-approval)')
s='\n'.join(x for x in s.splitlines() if '[4.3 Field Specifications]' not in x)+'\n'
p.write_text(s,encoding='utf-8')
