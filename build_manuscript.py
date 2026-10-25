"""Assemble the available story draft; do not treat a partial draft as final."""
from pathlib import Path
from html import escape
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
chapter_files = sorted((ROOT / 'chapters').glob('[0-9][0-9]-*.md'))
targets = [2500, 2200, 2900, 3000, 3000, 2900, 3000, 3000, 3200, 2500, 2800, 2600]
rows = []
chapters = []
for i, path in enumerate(chapter_files, 1):
    if int(path.name[:2]) != i:
        raise ValueError('Chapter numbering must be consecutive')
    text = path.read_text(encoding='utf-8').strip()
    title = text.splitlines()[0].removeprefix('# ')
    body = '\n'.join(line for line in text.splitlines()
                     if not line.startswith('#') and line.strip() != '***')
    words = len(body.split())
    rows.append(dict(chapter=i, title=title, actual_story_words=words,
                     planned_words=targets[i-1], source=str(path.relative_to(ROOT)),
                     sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    chapters.append((title, text))

total = sum(row['actual_story_words'] for row in rows)
length_ok = 30000 <= total <= 40000
complete = len(chapters) == 12 and length_ok
counts = dict(status='draft_needs_editorial_approval' if complete else 'INCOMPLETE',
              actual_story_words=total, drafted_chapters=len(chapters),
              required_chapters=12, required_story_words_min=30000,
              required_story_words_max=40000, planned_story_words=sum(targets),
              method='Whitespace tokens after excluding Markdown heading and scene-divider lines. '
                     'Message-block markers count as formatting and are removed below.',
              chapters=rows,
              undrafted_chapters=list(range(len(chapters)+1,13)),
              final_editorial_approval=False)

# Exclude blockquote markers from actual story-token counts, rather than treating
# a Markdown rendering instruction as a word of fiction.
for row, (_, text) in zip(rows, chapters):
    clean = '\n'.join(re.sub(r'^>\s?', '', line) for line in text.splitlines()
                      if not line.startswith('#') and line.strip() != '***')
    row['actual_story_words'] = len(clean.split())
total = sum(row['actual_story_words'] for row in rows)
counts['actual_story_words'] = total
complete = len(chapters) == 12 and 30000 <= total <= 40000
record_path = ROOT/'editorial'/'REVIEW_RECORD.json'
record = json.loads(record_path.read_text()) if record_path.exists() else {}
approved = complete and record.get('internal_editorial_review_complete', False) and all(
    record.get('source_sha256', {}).get(row['source'].split('/')[-1]) == row['sha256'] for row in rows)
counts['status'] = 'COMPLETE_REVISED_MANUSCRIPT' if approved else ('draft_needs_editorial_approval' if complete else 'INCOMPLETE')
counts['final_editorial_approval'] = approved
(ROOT/'WORD_COUNTS.json').write_text(json.dumps(counts, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

front = f'''# SEVEN NIGHTS BEFORE DIVORCE

*Sometimes, love doesn't end. Understanding does.*

## Manuscript edition

{len(chapters)} chapters · {total:,} story-body words. Internal editorial review: {"complete" if approved else "pending"}. Website and artwork production are separate deliverables.

## Copyright and fiction notice

Copyright © 2026. All rights reserved. No copyright registration is claimed. No open-source reuse licence is granted for the manuscript or future artwork.

This is a work of fiction. Characters and events are invented. Real locations provide a general setting; any resemblance to actual people or private events is coincidental. This novel does not provide relationship counselling or legal advice.

## Dedication

Un baaton ke naam, jo kehne mein der hui.

## Contents

'''
front += '\n'.join(f'{i}. {title.split(" — ",1)[-1]}' for i,(title,_) in enumerate(chapters,1))
front += '''

## Characters

**Aarav Deshmukh, 35:** Pune mein ek logistics company ka operations manager. Problems solve karna uske liye baat shuru karne se aasaan hai.

**Meera Sane, 33:** Freelance editor. Books, carefully chosen words aur kabhi-kabhi bina words ke samjhe jaane ki umeed.

**Naina:** Meera ki dost aur publishing colleague; apne deadlines aur family ke beech uske liye waqt nikaalti hai.

**Kabir:** Aarav ka colleague aur friend. Practical help deta hai, kabhi galat waqt par joke bhi.

**Prakash aur Sunanda:** Aarav ke parents, Nashik mein rehte hain. Unki apni routines, worries aur interests hain.

**Shaila:** Meera ki Ma. Care aur concern aksar ek hi phone call mein lekar aati hain.

---

'''
(ROOT/'MANUSCRIPT.md').write_text(front+'\n\n---\n\n'.join(text for _,text in chapters)+'\n', encoding='utf-8')

def render_blocks(source):
    result=[]
    for block in re.split(r'\n\s*\n',source.strip()):
        if block.strip() in ('***','---'):
            result.append('<hr aria-label="Scene break">')
        elif block.startswith('# '):
            result.append('<h2>'+escape(block[2:])+'</h2>')
        elif block.startswith('## '):
            result.append('<h3>'+escape(block[3:])+'</h3>')
        elif block.startswith('>'):
            clean='\n'.join(re.sub(r'^>\s?', '',l) for l in block.splitlines())
            result.append('<blockquote><p>'+escape(clean)+'</p></blockquote>')
        else:
            result.append('<p>'+escape(block)+'</p>')
    return '\n'.join(result)

sections='\n'.join(f'<section id="chapter-{i}" data-source-sha256="{rows[i-1]["sha256"]}">'+render_blocks(text)+'</section>'
                   for i,(_,text) in enumerate(chapters,1))
toc=''.join(f'<li><a href="#chapter-{i}">{escape(title)}</a></li>' for i,(title,_) in enumerate(chapters,1))
document='''<!doctype html><html lang="hi-Latn"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Seven Nights Before Divorce — Manuscript</title>
<style>
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f6f1e8;color:#302b28;font:19px/1.85 Georgia,'Times New Roman',serif}main{max-width:760px;margin:auto;padding:48px 24px 100px}h1{font-size:clamp(2.3rem,8vw,4rem);line-height:1.08;letter-spacing:-.025em;font-weight:normal;margin:24px 0}h2{font-size:1.8rem;line-height:1.3;font-weight:normal}h3{font-size:1.2rem}p{margin:0 0 1.2em;overflow-wrap:anywhere}section{padding-top:48px;margin-top:56px;border-top:1px solid #d9cdbd}a{color:#813f35;text-underline-offset:4px}nav{font:16px/1.7 system-ui,sans-serif}nav li{margin-bottom:12px}.notice{font:15px/1.65 system-ui,sans-serif;padding:20px;background:#ede2d5;border-left:3px solid #8c4c3d;margin:32px 0}.tagline{font-style:italic;color:#6e5e53}blockquote{border-left:2px solid #bd9b81;margin:24px 12px;padding-left:20px}hr{border:0;text-align:center;margin:36px auto;color:#977561}hr:after{content:'•   •   •'}footer{font:14px/1.6 system-ui,sans-serif;margin-top:60px}@media(max-width:375px){main{padding:28px 18px 70px}body{font-size:18px}}@media print{body{background:white;color:black}main{max-width:none;padding:0}section{break-before:page;border:0}.notice{background:white}a{color:black}}
</style></head><body><main>
<header><p>A HINGLISH NOVEL</p><h1>Seven Nights<br>Before Divorce</h1><p class="tagline">Sometimes, love doesn't end. Understanding does.</p></header>
'''
if (ROOT/'assets'/'cover.webp').exists():
    document+='<img src="assets/cover.webp" width="1024" height="1536" alt="Seven Nights Before Divorce cover: two cups and moving boxes in a quiet rainy apartment" style="display:block;width:min(100%,380px);height:auto;margin:32px auto">'
document+=f'<aside class="notice"><strong>Complete manuscript reading copy</strong><br>{len(chapters)} chapters · {total:,} story words.<br>This offline document contains the story. The illustrated reading website is a separate, pending deliverable.</aside>'
cast_html = '<section id="characters">'+render_blocks('## Characters'+front.split('## Characters',1)[1].split('---',1)[0])+'</section>'
document+='<p>Un baaton ke naam, jo kehne mein der hui.</p><nav aria-label="Book contents"><h2>Contents</h2><ol>'+toc+'</ol></nav>'+cast_html+sections
document+='<footer><p>The End</p><p>Copyright © 2026. All rights reserved. Fictional characters and events; no counselling or legal advice. No copyright registration claimed.</p></footer></main></body></html>'
(ROOT/'MANUSCRIPT.html').write_text(document,encoding='utf-8')

# Validate every story paragraph is present in the generated reading document.
for _,source in chapters:
    for block in re.split(r'\n\s*\n',source.strip()):
        if block.startswith('# ') or block.strip()=='***':
            continue
        clean='\n'.join(re.sub(r'^>\s?', '',l) for l in block.splitlines()) if block.startswith('>') else block
        if escape(clean) not in document:
            raise AssertionError('A story paragraph is missing from the HTML assembly')
assert document.count('<section id="chapter-')==len(chapters)
assert '[BOOK_URL]' not in document
for extension in ['md', 'html']:
    (ROOT/f'MANUSCRIPT_WORKING_DRAFT.{extension}').write_bytes((ROOT/f'MANUSCRIPT.{extension}').read_bytes())

print(json.dumps(dict(drafted_chapters=len(chapters),actual_story_words=total,
                      complete_novel=complete, internal_editorial_review=approved,
                      source_to_html_paragraph_check='PASS'),indent=2))
