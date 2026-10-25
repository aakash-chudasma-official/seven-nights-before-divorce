"""Build structured reader content from the reviewed manuscript, without dependencies."""
from pathlib import Path
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parent
DOCS = ROOT/'docs'
INDEX = json.loads((ROOT/'WORD_COUNTS.json').read_text())
assert INDEX['final_editorial_approval'], 'Run the manuscript editorial review before building.'
(DOCS/'content').mkdir(parents=True,exist_ok=True)
metadata=[]
for chapter in INDEX['chapters']:
    path=ROOT/chapter['source']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==chapter['sha256'], f'Changed source: {path}'
    blocks=[]
    for block in re.split(r'\n\s*\n',path.read_text().strip()):
        if block.startswith('# '):continue
        if block.strip()=='***':blocks.append({'type':'divider'});continue
        quote=block.startswith('>')
        text='\n'.join(re.sub(r'^>\s?','',line) for line in block.splitlines()) if quote else block
        blocks.append({'type':'quote' if quote else 'paragraph','text':text})
    actual=sum(len(b['text'].split()) for b in blocks if 'text'in b)
    assert actual==chapter['actual_story_words']
    data={'number':chapter['chapter'],'title':chapter['title'].split(' — ',1)[-1],
          'words':actual,'minutes':max(1,round(actual/180)),
          'sourceSha256':chapter['sha256'],'blocks':blocks}
    (DOCS/'content'/f'{chapter["chapter"]:02}.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
    metadata.append({k:v for k,v in data.items() if k!='blocks'})
(DOCS/'content'/'index.json').write_text(json.dumps({
    'title':'Seven Nights Before Divorce',
    'tagline':"Sometimes, love doesn't end. Understanding does.",
    'words':sum(c['words'] for c in metadata),'minutes':round(sum(c['words'] for c in metadata)/180),
    'chapters':metadata},ensure_ascii=False,separators=(',',':')))
shutil.copy2(ROOT/'MANUSCRIPT.html',DOCS/'manuscript.html')
assert len(metadata)==12
print(f'Reader built: {len(metadata)} chapters, {sum(c["words"] for c in metadata):,} story words.')
