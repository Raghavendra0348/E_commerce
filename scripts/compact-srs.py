"""Prepare the shorter faculty edition without changing the retained baseline."""
from pathlib import Path
import re, shutil

root=Path(__file__).resolve().parents[1]
path=root/'Docs/SRS_FINAL.md'
archive=root/'Docs/SRS_ARCHIVE/SRS_FULL_REVIEW_EDITION.md'
archive.parent.mkdir(exist_ok=True)
if not archive.exists():
    shutil.copy2(path,archive)
s=archive.read_text(encoding='utf-8')
# Keep the author's entered cover details, including edits made after generation.
current=path.read_text(encoding='utf-8')
cover=current.split('**Document control**')[0]
s=cover+'**Document control**'+s.split('**Document control**',1)[1]
start=s.index('### 3.3 Detailed Functional Requirements')
end=s.index('### 3.4 Checkout Requirements')
details=s[start:end]
rows=[]
for m in re.finditer(r'#### 3\.3\.\d+ (FR-\d{2})[^\n]*\n(.*?)(?=#### |\Z)',details,re.S):
    text=m[2]
    inp=re.search(r'\*\*Inputs / trigger:\*\* (.*)',text)[1]
    accept=re.search(r'\*\*Acceptance and failure behaviour:\*\* (.*)',text)[1]
    rows.append(f'| {m[1]} | {inp} | {accept} |')
assert len(rows)==39
replacement='### 3.3 Inputs and Acceptance Conditions\n\nThe register states each required function. The following conditions define its inputs, expected result and failure handling. Private operations require an authenticated owner; administrative operations require the administrator role. Chapter 8 maps each requirement to its use case and acceptance check.\n\n'
for i in range(0,39,13):
    replacement+=f'#### 3.3.{i//13+1} Acceptance conditions FR-{i+1:02d} to FR-{min(i+13,39):02d}\n\n| Requirement | Inputs or trigger | Acceptance and failure behaviour |\n| --- | --- | --- |\n'+'\n'.join(rows[i:i+13])+'\n\n'
s=s[:start]+replacement+s[end:]
# Compact routine use cases, preserving all success, alternative and postcondition text.
for n in [2,3,5,7,8,9,10,11,12]:
    pattern=rf'(### 7\.\d+ UC-{n:02d}[^\n]*\n)(.*?)(?=### |\Z)'
    m=re.search(pattern,s,re.S)
    if not m: continue
    b=m[2]
    b=re.sub(r'\*\*Goal:\*\*[^\n]*\n\n','',b)
    b=re.sub(r'\*\*Trigger:\*\*[^\n]*\n\n','',b)
    # Numbered steps become a single connected flow paragraph.
    b=re.sub(r'\*\*Main success flow:\*\*\s*\n((?:\d+\.[^\n]*\n)+)',lambda x:'**Main flow:** '+ ' '.join(re.sub(r'^\d+\. ','',z) for z in x[1].splitlines())+'\n',b)
    b=b.replace('**Primary actor:**','**Actor:**').replace('**Alternative flows:**','**Exceptions:**')
    s=s[:m.start()]+m[1]+b+s[m.end():]
start=s.index('## 9. OPEN DECISIONS AND REVIEW')
s=s[:start]+'''## 9. REVIEW AND REFERENCES

### 9.1 Outstanding Agreements

Scope and priorities require guide approval. Performance thresholds, the browser/version matrix, backup retention and recovery targets must be agreed before the related acceptance checks can be assessed. Acceptance checks in Chapter 8 describe planned verification; they do not record completed testing.

### 9.2 Review and Approval

The student and project guide shall review this specification before treating it as the approved project baseline. Any subsequent requirement change shall retain its identifier and record its reason and impact. Approval and signatures are recorded by the faculty through the submission process.
'''
s=re.sub(r'\*\*Document control\*\*.*?\*\*Contents\*\*','**Document details**\n\nSoftware Requirements Specification for the E-Commerce Web Application. Faculty submission edition, version 0.5. Prepared on 12 November 2026. This specification defines the project scope, required behaviour, interfaces, data and planned acceptance conditions.\n\n**Contents**',s,flags=re.S)
# Rebuild a short contents list from chapter/subsection headings only.
start=s.index('**Contents**');end=s.index('## 1. INTRODUCTION')
toc=[]
for level,title in re.findall(r'^(#{2,3}) (.+)$',s[end:],re.M):
    anchor=re.sub(r'[^\w\- ]','',title.lower()).replace(' ','-')
    toc.append(('  ' if len(level)==3 else '')+f'- [{title}](#{anchor})')
s=s[:start]+'**Contents**\n\n'+'\n'.join(toc)+'\n\n'+s[end:]
# Remove editorial process prose, keep product requirements.
s=re.sub(r'This document follows.*?\n\n','',s)
s=s.replace('recordcontaining','record containing')
s=s.replace('E-03 &\u00a0CSE','E-03 & CSE').replace('Section\u00a0','Section')
s=s.replace('| Status                 | Draft for review   |','| Status                 | Faculty review     |')
# Regenerate caption numbering after removed tables.
counter=[0]
def cap(m):
    counter[0]+=1
    title=m[1]
    if title=='Submission details' and counter[0]>1: title='Document information'
    return f'*Table {counter[0]}. {title}*'
s=re.sub(r'\*Table \d+\. ([^\n]*?)\*',cap,s)
path.write_text(s,encoding='utf-8')
print('Shortened edition prepared; original and full review edition preserved.')
