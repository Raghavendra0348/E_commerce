"""Export the reviewed Markdown using the bundled document runtime.

The PDF uses ReportLab pagination. The editable DOCX uses native Word fields;
its pagination/TOC must be updated and checked in a native Word renderer.
"""
from pathlib import Path
import re, json, html, copy
from xml.sax.saxutils import escape
from PIL import Image as PILImage
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION_START, WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
    Spacer, PageBreak, NextPageTemplate, Table, TableStyle, Image, KeepTogether, CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'Docs'
source=(DOCS/'SRS_FINAL.md').read_text(encoding='utf-8')
data=json.loads((ROOT/'output/srs-data.json').read_text(encoding='utf-8'))
figures=data['figures']

def plain(s):
    s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m:m[1] if m[2].startswith('#') else f'{m[1]} ({m[2]})',s)
    return s.replace('**','').replace('`','').strip('*')

def rich(s):
    s=escape(plain_links(s))
    s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<i>\1</i>',s)
    return s.replace('`','')

def plain_links(s):
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m:m[1] if m[2].startswith('#') else f'{m[1]} ({m[2]})',s)

def parse(md):
    lines=md.splitlines(); blocks=[]; i=0; figure=0
    while i<len(lines):
        line=lines[i].strip()
        if not line or line.startswith('<div') or line=='</div>' or line.startswith('<!--'):
            i+=1;continue
        if line=='**Contents**':
            blocks.append(('toc',None));i+=1
            while i<len(lines) and not lines[i].startswith('## 1.') : i+=1
            continue
        if line.startswith('```mermaid'):
            i+=1
            while i<len(lines) and not lines[i].startswith('```'):i+=1
            blocks.append(('figure',figures[figure]));figure+=1;i+=1;continue
        if line.startswith('|'):
            tab=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                row=[c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[-: ]+',c) for c in row):tab.append(row)
                i+=1
            blocks.append(('table',tab));continue
        if line.startswith('[Rendered figure]'):
            i+=1;continue
        heading=re.match(r'^(#{1,4}) (.+)$',line)
        if heading:
            blocks.append(('heading',(len(heading[1]),heading[2])));i+=1;continue
        if line.startswith('*Table ') or line.startswith('*Figure '):
            blocks.append(('caption',line.strip('*')));i+=1;continue
        if re.match(r'^\d+\. ',line) or line.startswith('- '):
            line=line.replace('- [x] ','Completed: ').replace('- [ ] ','Pending: ')
            if line.startswith('- '):line='• '+line[2:]
            blocks.append(('list',line));i+=1;continue
        parts=[line];i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|<|\*Table |\*Figure |\d+\. |- )',lines[i]):
            parts.append(lines[i].strip());i+=1
        blocks.append(('paragraph',' '.join(parts)))
    return blocks

blocks=parse(source)
cover_end=next(i for i,b in enumerate(blocks) if b[0]=='table')+1
cover=blocks[:cover_end];body=blocks[cover_end:]
for face,filename in [('TNR','times.ttf'),('TNR-Bold','timesbd.ttf'),('TNR-Italic','timesi.ttf'),('TNR-BoldItalic','timesbi.ttf')]:
    pdfmetrics.registerFont(TTFont(face,str(Path('C:/Windows/Fonts')/filename)))
pdfmetrics.registerFontFamily('TNR',normal='TNR',bold='TNR-Bold',italic='TNR-Italic',boldItalic='TNR-BoldItalic')

W,H=A4;M=72;PW=W-2*M;LW=H-2*M
styles={
 'body':ParagraphStyle('Body',fontName='TNR',fontSize=12,leading=18,spaceAfter=6,allowWidows=0,allowOrphans=0),
 'list':ParagraphStyle('List',fontName='TNR',fontSize=12,leading=18,leftIndent=12,firstLineIndent=-12,spaceAfter=4),
 'h1':ParagraphStyle('Chapter',fontName='TNR-Bold',fontSize=16,leading=22,spaceAfter=12,keepWithNext=True),
 'h2':ParagraphStyle('Subsection',fontName='TNR-Bold',fontSize=14,leading=19,spaceBefore=10,spaceAfter=8,keepWithNext=True),
 'h3':ParagraphStyle('Smaller heading',fontName='TNR-Bold',fontSize=12,leading=16,spaceBefore=9,spaceAfter=6,keepWithNext=True),
 'caption':ParagraphStyle('Caption',fontName='TNR-Italic',fontSize=10.5,leading=13,spaceBefore=6,spaceAfter=6),
 'figcaption':ParagraphStyle('Figure caption',fontName='TNR-Italic',fontSize=10.5,leading=13,spaceBefore=5,spaceAfter=7),
 'cell':ParagraphStyle('Cell',fontName='TNR',fontSize=9.5,leading=11.5,spaceAfter=0,splitLongWords=True),
 'headercell':ParagraphStyle('Header cell',fontName='TNR-Bold',fontSize=9.5,leading=11.5,spaceAfter=0),
 'center':ParagraphStyle('Centered',fontName='TNR',fontSize=12,leading=18,alignment=1,spaceAfter=10),
 'title':ParagraphStyle('Cover title',fontName='TNR-Bold',fontSize=22,leading=29,alignment=1,spaceAfter=24),
}

def widths(tab,available):
    headers=tab[0];n=len(headers)
    if headers[0]=='Requirement ID' and n==4 and headers[-1]=='Priority':return [70,85,available-200,45]
    if n==2:return [available*.31,available*.69]
    if n==3:
        if headers[0] in ['Requirement','Requirement ID']:return [72,105,available-177]
        return [available*.23,available*.30,available*.47]
    if n==4:
        if headers[0]=='Requirement ID':return [59,62,(available-121)*.57,(available-121)*.43]
        if headers[0]=='Interface ID':return [55,76,(available-131)*.43,(available-131)*.57]
        if headers[0]=='Version':return [39,69,available-181,73]
        return [available*.12,available*.25,available*.43,available*.20]
    return [available/n]*n

def pdf_table(tab,available):
    cells=[]
    for r,row in enumerate(tab):
        cells.append([Paragraph(rich(c),styles['headercell' if r==0 else 'cell']) for c in row])
    t=Table(cells,colWidths=widths(tab,available),repeatRows=1,hAlign='LEFT')
    commands=[('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eeeeee')),('GRID',(0,0),(-1,-1),.5,colors.HexColor('#d9d9d9')),
              ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),
              ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]
    t.setStyle(TableStyle(commands));t.spaceAfter=9
    return t

def footer(canvas,doc):
    if doc.page==1:return
    page_w,page_h=canvas._pagesize
    canvas.saveState();canvas.setFont('TNR',9)
    canvas.drawString(M,page_h-43,'E-Commerce Web Application | SRS Version 0.5')
    canvas.drawString(M,39,'Draft for review — approval pending')
    canvas.drawRightString(page_w-M,39,f'Page {doc.page}')
    canvas.restoreState()

class SrsPDF(BaseDocTemplate):
    def __init__(self,*a,**kw):
        super().__init__(*a,**kw);self.heading_pages={}
    def afterFlowable(self,flowable):
        if getattr(flowable,'srs_heading',None):
            level,title,key=flowable.srs_heading
            self.canv.bookmarkPage(key)
            if level <= 1:
                self.notify('TOCEntry',(level,title,self.page,key))
            self.heading_pages[title]=self.page

def pdf_heading(level,title):
    p=Paragraph(escape(title),styles['h'+str(level-1)])
    p.srs_heading=(level-2,title,'heading-'+re.sub('[^a-zA-Z0-9]','-',title))
    return p

def make_pdf():
    document=SrsPDF(str(DOCS/'SRS_FINAL.pdf'),pagesize=A4,leftMargin=M,rightMargin=M,topMargin=M,bottomMargin=M,
                    title='Software Requirements Specification for E-Commerce Web Application',author='Arella Raghavendra')
    document.addPageTemplates([
      PageTemplate(id='portrait',frames=[Frame(M,M,PW,H-2*M,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=footer,pagesize=A4),
      PageTemplate(id='landscape',frames=[Frame(M,M,LW,W-2*M,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=footer,pagesize=landscape(A4))])
    story=[Spacer(1,18),Paragraph('SOFTWARE REQUIREMENTS<br/>SPECIFICATION',styles['title']),Paragraph('FOR',styles['center']),
           Paragraph('<b>E-COMMERCE WEB APPLICATION</b>',styles['center']),Paragraph('Academic project — Amazon-inspired storefront',styles['center']),Spacer(1,18)]
    for kind,value in cover:
        if kind=='caption':story.append(Paragraph(escape(value),styles['caption']))
        if kind=='table':story.append(pdf_table(value,PW))
    story.append(PageBreak());wide=False
    for block_index,(kind,value) in enumerate(body):
        if kind=='toc':
            story.extend([Spacer(1,18),Paragraph('Contents',styles['h1'])])
            toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc'+str(i),fontName='TNR-Bold' if i==0 else 'TNR',fontSize=10.5,leading=13,leftIndent=i*14,firstLineIndent=0,spaceBefore=2 if i==0 else 0) for i in range(3)]
            toc.tableStyle=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)])
            story.append(toc);continue
        if kind=='heading':
            level,title=value
            if title.startswith('6.4 '):
                story.extend([NextPageTemplate('landscape'),PageBreak()]);wide=True
            elif level==2:
                if wide:story.append(NextPageTemplate('portrait'));wide=False
                story.append(PageBreak())
            if block_index+2<len(body) and body[block_index+1][0]=='caption' and body[block_index+2][0]=='table':
                story.append(CondPageBreak(170))
            story.append(pdf_heading(level,title));continue
        if kind=='figure':
            imgpath=DOCS/'SRS_FIGURES'/f'{value}.png'
            iw,ih=PILImage.open(imgpath).size
            available=LW if wide else PW
            maximum_height=510 if wide else 615
            factor=min(available/iw,maximum_height/ih)
            image=Image(str(imgpath),width=iw*factor,height=ih*factor)
            image.hAlign='CENTER';story.append(image);continue
        if kind=='table':story.append(pdf_table(value,LW if wide else PW));continue
        if kind=='caption':
            caption=Paragraph(escape(value),styles['figcaption' if value.startswith('Figure') else 'caption'])
            caption.keepWithNext=False
            story.append(caption);continue
        story.append(Paragraph(rich(value),styles['list' if kind=='list' else 'body']))
    document.multiBuild(story,maxPasses=5)
    (ROOT/'output/srs-pdf-heading-pages.json').write_text(json.dumps(document.heading_pages,indent=2),encoding='utf-8')

def run_inline(p,s):
    for part in re.split(r'(\*\*.*?\*\*|(?<!\*)\*[^*]+\*(?!\*))',plain_links(s)):
        run=p.add_run(part.strip('*').replace('`',''))
        run.bold=part.startswith('**');run.italic=part.startswith('*') and not run.bold

def docx_table(doc,tab,available):
    t=doc.add_table(rows=0,cols=len(tab[0]));t.alignment=WD_TABLE_ALIGNMENT.CENTER;t.autofit=False
    sizes=widths(tab,available)
    for col,size in zip(t.columns,sizes):col.width=Pt(size)
    prop=t._tbl.tblPr
    borders=OxmlElement('w:tblBorders')
    for edge in ['top','left','bottom','right','insideH','insideV']:
        element=OxmlElement('w:'+edge);element.set(qn('w:val'),'single');element.set(qn('w:sz'),'4');element.set(qn('w:color'),'D9D9D9');borders.append(element)
    prop.append(borders)
    for idx,values in enumerate(tab):
        row=t.add_row();pr=row._tr.get_or_add_trPr()
        pr.append(OxmlElement('w:cantSplit'))
        if idx==0:pr.append(OxmlElement('w:tblHeader'))
        for col,(cell,value,size) in enumerate(zip(row.cells,values,sizes)):
            cell.width=Pt(size);cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            cp=cell._tc.get_or_add_tcPr();margins=OxmlElement('w:tcMar')
            for edge in ['top','bottom','left','right']:
                margin=OxmlElement('w:'+edge);margin.set(qn('w:w'),'80');margin.set(qn('w:type'),'dxa');margins.append(margin)
            cp.append(margins)
            if idx==0:
                shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'EEEEEE');cp.append(shade)
            p=cell.paragraphs[0];p.paragraph_format.line_spacing=1.05;p.paragraph_format.space_after=Pt(1)
            run_inline(p,value)
            for run in p.runs:run.font.size=Pt(9.5);run.bold=idx==0 or run.bold
    doc.add_paragraph().paragraph_format.space_after=Pt(2)

def field(paragraph,instruction,cached=''):
    run=paragraph.add_run();begin=OxmlElement('w:fldChar');begin.set(qn('w:fldCharType'),'begin');run._r.append(begin)
    ins=OxmlElement('w:instrText');ins.set(qn('xml:space'),'preserve');ins.text=' '+instruction+' ';run._r.append(ins)
    sep=OxmlElement('w:fldChar');sep.set(qn('w:fldCharType'),'separate');run._r.append(sep)
    paragraph.add_run(cached)
    end=OxmlElement('w:fldChar');end.set(qn('w:fldCharType'),'end');paragraph.add_run()._r.append(end)

def configure_section(section,wide=False):
    section.different_first_page_header_footer=False
    section.orientation=WD_ORIENT.LANDSCAPE if wide else WD_ORIENT.PORTRAIT
    section.page_width=Pt(H if wide else W);section.page_height=Pt(W if wide else H)
    section.left_margin=section.right_margin=section.top_margin=section.bottom_margin=Inches(1)
    section.header_distance=section.footer_distance=Inches(.45)

def make_docx():
    doc=Document();configure_section(doc.sections[0]);doc.sections[0].different_first_page_header_footer=True
    for name in ['Normal','Title','Subtitle','Heading 1','Heading 2','Heading 3','Caption']:
        style=doc.styles[name];style.font.name='Times New Roman';style.font.color.rgb=RGBColor(0,0,0)
        rf=style.element.get_or_add_rPr();fonts=OxmlElement('w:rFonts')
        for attr in ['ascii','hAnsi','eastAsia','cs']:fonts.set(qn('w:'+attr),'Times New Roman')
        rf.insert(0,fonts)
    normal=doc.styles['Normal'];normal.font.size=Pt(12);normal.paragraph_format.line_spacing=1.5;normal.paragraph_format.space_after=Pt(6)
    for name,size in [('Heading 1',16),('Heading 2',14),('Heading 3',12)]:
        st=doc.styles[name];st.font.size=Pt(size);st.font.bold=True
        st.paragraph_format.keep_with_next=True;st.paragraph_format.space_before=Pt(10);st.paragraph_format.space_after=Pt(7)
    doc.styles['Heading 1'].paragraph_format.page_break_before=True
    doc.styles['Title'].font.size=Pt(22)
    doc.styles['Caption'].font.size=Pt(10.5);doc.styles['Caption'].font.italic=True;doc.styles['Caption'].paragraph_format.line_spacing=1.1
    head=doc.sections[0].header.paragraphs[0];head.text='E-Commerce Web Application | SRS Version 0.5';head.runs[0].font.size=Pt(9)
    foot=doc.sections[0].footer.paragraphs[0];foot.alignment=WD_ALIGN_PARAGRAPH.CENTER
    foot.add_run('Draft for review | Page ').font.size=Pt(9);field(foot,'PAGE')
    doc.add_paragraph().paragraph_format.space_after=Pt(12)
    for title,style in [('SOFTWARE REQUIREMENTS SPECIFICATION','Title'),('FOR','Normal'),('E-COMMERCE WEB APPLICATION','Subtitle'),('Academic project — Amazon-inspired storefront','Normal')]:
        p=doc.add_paragraph(title,style);p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    for kind,value in cover:
        if kind=='caption':doc.add_paragraph(value,'Caption')
        if kind=='table':docx_table(doc,value,PW)
    doc.add_page_break();wide=False
    for kind,value in body:
        if kind=='toc':
            p=doc.add_paragraph('Contents');p.runs[0].bold=True;p.runs[0].font.size=Pt(16)
            p=doc.add_paragraph();field(p,'TOC \\o "1-2" \\h \\z \\u','Update this automatic table of contents in Word before printing.')
            continue
        if kind=='heading':
            level,title=value
            if title.startswith('6.4 '):
                configure_section(doc.add_section(WD_SECTION_START.NEW_PAGE),True);wide=True
            elif level==2 and wide:
                configure_section(doc.add_section(WD_SECTION_START.NEW_PAGE),False);wide=False
            p=doc.add_paragraph(title,'Heading '+str(level-1))
            if title.startswith('6.4 ') or (title.startswith('7.') and level==2):p.paragraph_format.page_break_before=False
            continue
        if kind=='table':docx_table(doc,value,LW if wide else PW);continue
        if kind=='figure':
            path=DOCS/'SRS_FIGURES'/f'{value}.png';iw,ih=PILImage.open(path).size
            ratio=min((LW if wide else PW)/iw,(490 if wide else 600)/ih)
            p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.keep_with_next=True
            p.add_run().add_picture(str(path),width=Pt(iw*ratio),height=Pt(ih*ratio));continue
        p=doc.add_paragraph(style='Caption' if kind=='caption' else 'Normal');run_inline(p,value)
        if kind=='caption':p.paragraph_format.keep_with_next=not value.startswith('Figure')
        if kind=='list':p.paragraph_format.left_indent=Pt(12);p.paragraph_format.first_line_indent=Pt(-12)
    update=OxmlElement('w:updateFields');update.set(qn('w:val'),'true');doc.settings.element.append(update)
    doc.core_properties.title='Software Requirements Specification for E-Commerce Web Application'
    doc.core_properties.author='Arella Raghavendra';doc.core_properties.version='0.5';doc.core_properties.subject='Faculty submission specification'
    doc.save(DOCS/'SRS_FINAL.docx')

make_pdf()
make_docx()
print('Created SRS_FINAL.pdf with generated page-aware contents and SRS_FINAL.docx with native TOC/page fields.')
