from pathlib import Path
import re,json,hashlib
from pypdf import PdfReader
from PIL import Image,ImageOps,ImageDraw
root=Path(__file__).resolve().parents[1]
s=(root/'Docs/SRS_FINAL.md').read_text(encoding='utf-8')
data=json.loads((root/'output/srs-data.json').read_text(encoding='utf-8'))
report={}
for prefix,count in [('FR',39),('NFR',12),('UC',12),('INT',7)]:
    expected={f'{prefix}-{i:02d}' for i in range(1,count+1)}
    actual=set(re.findall(rf'\b{prefix}-\d{{2}}\b',s))
    assert expected<=actual,(prefix,expected-actual)
    report[prefix]=count
for prefix,count in [('AT-F',39),('AT-N',12)]:
    expected={f'{prefix}{i:02d}' for i in range(1,count+1)}
    assert expected<=set(re.findall(rf'\b{prefix}\d{{2}}\b',s))
    report[prefix]=count
assert s.count('```mermaid')==5
report['figures']=5
assert hashlib.sha256((root/'Docs/SRS_DRAFT.md').read_bytes()).hexdigest()==data['baseline_sha256']
report['original_draft_unchanged']=True
r=PdfReader(root/'Docs/SRS_FINAL.pdf')
report['pdf_pages']=len(r.pages)
assert 35<=len(r.pages)<40
# Retain each original functional statement and all original acceptance mappings.
for key,value in data['functional'].items():
    assert value['statement'] in s,key
report['functional_statements_preserved']=True
(root/'output/srs-final-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
paths=sorted((root/'output/srs-final-pages').glob('page-*.png'))[:len(r.pages)]
if paths:
    out=root/'output/srs-final-sheets';out.mkdir(exist_ok=True)
    for start in range(0,len(paths),4):
        sheet=Image.new('RGB',(1420,2040),'#bbbbbb');draw=ImageDraw.Draw(sheet)
        for j,p in enumerate(paths[start:start+4]):
            img=Image.open(p).convert('RGB');img.thumbnail((700,980))
            x=(j%2)*710+(700-img.width)//2;y=(j//2)*1020+25
            sheet.paste(img,(x,y));draw.text((x,y-20),p.stem,fill='black')
        sheet.save(out/f'sheet-{start//4+1:02d}.png')
print(json.dumps(report))
