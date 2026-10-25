'use strict';
// Content is generated from the reviewed chapter files. No access gate or tracker.
const KEY = 'seven-nights-reader-v1';
const $ = s => document.querySelector(s);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storageOK = true, saved = {};
try { const probe = `${KEY}-probe`; localStorage.setItem(probe,'1'); localStorage.removeItem(probe); saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
catch { storageOK = false; }
const validNumber = (n,min,max,fallback) => Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
const state = {
  font:validNumber(saved.font,18,28,20),
  theme:['light','sepia','dark'].includes(saved.theme) ? saved.theme : 'light',
  resume:saved.resume && Number.isInteger(saved.resume.chapter) && saved.resume.chapter>=1 && saved.resume.chapter<=12 ? saved.resume : null,
  progress:saved.progress && typeof saved.progress==='object' ? saved.progress : {},
  bookmarks:Array.isArray(saved.bookmarks) ? saved.bookmarks.filter(b=>Number.isInteger(b.chapter)&&b.chapter>=1&&b.chapter<=12&&Number.isInteger(b.block)&&b.block>=0&&b.block<2000).slice(0,200) : []
};
let book, current = null, routeID = 0, navigating = false, scrollQueued = false, persistTimer;
const cache = new Map();
function persist() { if (!storageOK) return; try { localStorage.setItem(KEY,JSON.stringify(state)); } catch { storageOK=false; $('#storage-note').hidden=false; } }
function announce(message) { $('#announcement').textContent=message; }
function applySettings() {
  document.documentElement.dataset.theme=state.theme;
  document.documentElement.style.setProperty('--story-size',`${state.font}px`);
  $('#font-value').textContent=`${state.font} px`;
  $('#font-smaller').disabled=state.font<=18; $('#font-larger').disabled=state.font>=28;
  document.querySelectorAll('input[name=theme]').forEach(r=>r.checked=r.value===state.theme);
  $('#storage-note').hidden=storageOK;
}
applySettings();
const descriptions = [
  'Ek aam shaam, aur woh faisla jo ab taalna mumkin nahi.',
  'Ek hi chhat ke neeche badalti hui roz ki aadatein.',
  'Packing ke beech ek purani photograph milti hai.',
  'Dinner ka ek order, aur baat jo khane se aage badh jaati hai.',
  'Books aur notebooks ke saath kuch purane plans bhi nikalte hain.',
  'Ghar se aaya phone, aur bachpan ki kuch alag yaadein.',
  'Ek chhoti repair purane jhagde ki jagah le leti hai.',
  'Ek yellow envelope khulta hai.',
  'Apartment mein unki aakhri shaam.',
  'Movers, keys aur ek nayi subah.',
  'Chhe mahine baad, do alag rozmarra ki zindagiyan.',
  'Ek mulaqat, aur apne liye kiye gaye chhote faisle.'
];
const footer = () => `<footer class="footer wrap"><span>© 2026. All rights reserved. An original work of fiction.</span><span><a href="#contents">Contents</a> · <a href="#characters">Characters</a></span></footer>`;
function castMarkup() {
  return `<section id="characters-section" class="cast-section" aria-labelledby="cast-title"><h2 id="cast-title">The people in these pages</h2><div class="cast">
  <article class="person"><img src="assets/aarav.webp" width="800" height="1000" loading="lazy" alt="Illustration of Aarav in a slate cotton shirt beside a window"><div><h3>Aarav</h3><p>35 · Operations manager</p><p>Practical, responsible, aur aksar kaam mein uljha hua. Problems solve karna uske liye baat shuru karne se aasaan hai.</p></div></article>
  <article class="person"><img src="assets/meera.webp" width="800" height="1000" loading="lazy" alt="Illustration of Meera at her editing desk in a terracotta kurta"><div><h3>Meera</h3><p>33 · Freelance editor</p><p>Books, carefully chosen words aur kabhi-kabhi bina words ke samjhe jaane ki umeed. Har zaroorat bol paana uske liye bhi aasaan nahi.</p></div></article></div>
  <div class="supporting"><article><h3>Naina</h3><p>Meera ki dost aur former publishing colleague, apni deadlines aur family ke beech uske liye waqt nikaalti hai.</p></article><article><h3>Kabir</h3><p>Aarav ka colleague aur friend. Practical help deta hai, kabhi galat waqt par joke bhi.</p></article><article><h3>Prakash &amp; Sunanda</h3><p>Aarav ke parents. Nashik mein apni routines, worries aur interests ke saath rehte hain.</p></article><article><h3>Shaila</h3><p>Meera ki Ma. Care aur concern aksar ek hi phone call mein lekar aati hain.</p></article></div></section>`;
}
function home() {
  const resume = state.resume;
  return `<div class="wrap"><section class="hero"><div><h1>Seven Nights<br>Before Divorce</h1><p class="tagline">Sometimes, love doesn't end.<br>Understanding does.</p><p class="synopsis">Aath saal saath. Alag rehne ka faisla. Aur ek ghar mein bachi hui saat raatein.</p><div class="actions"><a class="primary" href="${resume?`#chapter/${resume.chapter}`:'#chapter/1/0'}">${resume?'Resume Reading':'Start Reading'} <span aria-hidden="true">→</span></a><a href="#contents">View contents</a></div><p class="utility">12 chapters · A Hinglish novel${resume?` · Continue Chapter ${resume.chapter}`:''}</p></div><img class="hero-cover" src="assets/cover.webp" width="1024" height="1536" alt="Seven Nights Before Divorce cover, a quiet apartment with two cups and moving boxes" fetchpriority="high"></section>
  <section class="reading-way"><h2>Reading your way</h2><p>Font size, reading themes and bookmarks. Your place is saved in this browser.</p><div class="way-items"><div><b>Aa</b>Adjust font size</div><div><b aria-hidden="true">◐</b>Choose a reading theme</div><div><b aria-hidden="true"><svg viewBox="0 0 24 28" width="24" height="30" style="display:block;margin:auto;fill:none;stroke:currentColor;stroke-width:1.7"><path d="M5 2h14v24l-7-5-7 5z"/></svg></b>Pick up where you left off</div></div></section></div>${footer()}`;
}
function contents(charactersOnly=false) {
  const rows=book.chapters.map(c=>{
    const p=validNumber(Number(state.progress[c.number]),0,100,0);
    return `<li><a href="#chapter/${c.number}"><span class="number">${String(c.number).padStart(2,'0')}</span><span><span class="row-title">${esc(c.title)}</span><small>${esc(descriptions[c.number-1])}</small>${p>0?`<span class="progress-label">${Math.round(p)}% read</span>`:''}</span><span class="minutes">${c.minutes} min</span></a></li>`;
  }).join('');
  return `<div class="wrap page-section">${charactersOnly?'':`<h1 style="font-size:48px">Contents</h1><p>Twelve chapters. Seven nights. Take your time.</p>${state.resume?`<p><a href="#chapter/${state.resume.chapter}">Resume Chapter ${state.resume.chapter} →</a></p>`:''}<ol class="toc">${rows}</ol><p class="utility">${book.words.toLocaleString()} words · About ${book.minutes} minutes, at 180 words per minute.</p><p class="utility">Your progress stays in this browser and may not transfer to another device. <a href="#bookmarks">Your bookmarks</a></p>`}${castMarkup()}</div>${footer()}`;
}
async function getChapter(n) {
  if(cache.has(n))return cache.get(n);
  const response=await fetch(`content/${String(n).padStart(2,'0')}.json`);
  if(!response.ok)throw new Error(`Chapter ${n} could not be opened.`);
  const data=await response.json();cache.set(n,data);return data;
}
function chapterImage(n) { return n>=3&&n<=9?`night-${n-2}`:n<=2?'hero':null; }
function bookmarkButton() {
  if(!current)return;
  const position=capturePosition(false);const found=state.bookmarks.some(b=>b.chapter===current.number&&b.block===position.block);
  $('#bookmark').setAttribute('aria-pressed',String(found));$('#bookmark').setAttribute('aria-label',found?'Remove bookmark at this passage':'Bookmark this passage');
}
function capturePosition(save=true) {
  if(!current)return {block:0,offset:0};
  const elements=[...document.querySelectorAll('.story [data-block]')];
  const line=window.innerHeight*.25;
  let selected=elements[0];
  for(const element of elements) { if(element.getBoundingClientRect().top<=line)selected=element;else break; }
  if(!selected)return {block:0,offset:0};
  const box=selected.getBoundingClientRect();
  const offset=validNumber((line-box.top)/Math.max(box.height,1),0,1,0);
  const block=Number(selected.dataset.block);
  const before=current.blocks.slice(0,block).reduce((sum,b)=>sum+(b.text?b.text.trim().split(/\s+/).length:0),0);
  const words=current.blocks[block]?.text?.trim().split(/\s+/).length||0;
  let pct=100*(before+words*offset)/current.words;
  if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-90)pct=100;
  pct=validNumber(pct,0,100,0);
  $('#reader-progress').value=pct;
  const detail=$('#chapter-position');if(detail)detail.textContent=`${Math.round(pct)}% of this chapter`;
  if(save&&!navigating){state.resume={chapter:current.number,block,offset};state.progress[current.number]=Math.max(Number(state.progress[current.number])||0,pct);clearTimeout(persistTimer);persistTimer=setTimeout(persist,350);}
  return {block,offset};
}
function restorePosition(position) {
  const element=document.querySelector(`[data-block="${Number(position.block)||0}"]`);
  if(!element)return;
  const rect=element.getBoundingClientRect();const offset=validNumber(Number(position.offset),0,1,0);
  window.scrollTo({top:Math.max(0,window.scrollY+rect.top+offset*rect.height-window.innerHeight*.25),behavior:'instant'});
}
function setFont(delta) {const p=current?capturePosition():null;state.font=validNumber(state.font+delta,18,28,20);applySettings();persist();if(p)requestAnimationFrame(()=>restorePosition(p));}
async function route() {
  const id=++routeID;
  if(current){capturePosition();persist();}
  current=null;navigating=true;
  if($('#settings').open)$('#settings').close();
  const hash=location.hash||'#home';const match=hash.match(/^#chapter\/(\d{1,2})(?:\/(\d+))?$/);
  const reading=Boolean(match&&Number(match[1])>=1&&Number(match[1])<=12);
  $('#site-header').hidden=reading;$('#reader-header').hidden=!reading;$('#reader-toolbar').hidden=!reading;
  const main=$('#main');window.scrollTo({top:0,behavior:'instant'});
  try {
    if(reading){
      const n=Number(match[1]);main.innerHTML='<p class="loading" role="status">Opening chapter…</p>';
      const c=await getChapter(n);if(id!==routeID)return;current=c;
      const image=chapterImage(n);
      const blocks=c.blocks.map((b,i)=>b.type==='divider'?'<hr aria-label="Scene break">':b.type==='quote'?`<blockquote data-block="${i}"><p>${esc(b.text)}</p></blockquote>`:`<p data-block="${i}">${esc(b.text)}</p>`).join('');
      main.innerHTML=`<article class="chapter">${image?`<img class="chapter-art" src="assets/${image}.webp" width="1600" height="900" alt="${n<=2?'A quiet apartment, dining table and packed boxes':`Cinematic scene for Night ${n-2}`}" fetchpriority="high">`:''}<p class="chapter-meta">Chapter ${n} · ${c.minutes} min</p><h1>${esc(c.title)}</h1><div class="story">${blocks}</div><div class="chapter-end"><p id="chapter-position">0% of this chapter</p><a class="primary" href="${n===12?'#end':`#chapter/${n+1}/0`}">${n===12?'Close the book':'Continue to next chapter'} →</a></div></article>`;
      $('#previous').disabled=n===1;$('#next').querySelector('span').textContent=n===12?'Finish':'Next';
      document.title=`${c.title} — Seven Nights Before Divorce`;
      const explicit=match[2]!==undefined;
      const p=explicit?{block:Number(match[2]),offset:0}:state.resume?.chapter===n?state.resume:null;
      // Artwork has reserved dimensions, so restoring text position does not wait on network images.
      requestAnimationFrame(()=>{if(id!==routeID)return;if(p&&(p.block>0||p.offset>0))restorePosition(p);navigating=false;capturePosition();bookmarkButton();if(explicit)history.replaceState(null,'',`#chapter/${n}`);});
      if(n<12)getChapter(n+1).catch(()=>{});
    }else{
      document.title='Seven Nights Before Divorce — A Hinglish Novel';
      if(hash==='#contents')main.innerHTML=contents();
      else if(hash==='#characters')main.innerHTML=contents(true);
      else if(hash==='#bookmarks'){
        const rows=state.bookmarks.map((b,i)=>`<li><div><p><a href="#chapter/${b.chapter}/${b.block}">Chapter ${b.chapter} · ${esc(book.chapters[b.chapter-1].title)}</a></p><p>${esc(b.excerpt||'Saved passage')}</p></div><button data-remove="${i}" aria-label="Remove bookmark ${i+1}">Remove</button></li>`).join('');
        main.innerHTML=`<section class="wrap page-section"><h1 style="font-size:48px">Your bookmarks</h1><p class="utility">Saved in this browser.</p>${rows?`<ul class="bookmark-list">${rows}</ul>`:'<p>No bookmarks yet. Tap the bookmark icon while reading to save a passage.</p>'}<a href="#contents">Back to contents</a></section>${footer()}`;
        main.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{state.bookmarks.splice(Number(b.dataset.remove),1);persist();route();announce('Bookmark removed.');}));
      }else if(hash==='#end'){
        const last=await getChapter(12);if(id!==routeID)return;
        const line=[...last.blocks].reverse().find(b=>b.text)?.text||'';
        state.progress[12]=100;persist();
        main.innerHTML=`<section class="end-screen"><h1>The End</h1><img src="assets/closing.webp" width="1600" height="900" alt="Aarav and Meera listening to a reading in neighbouring library chairs"><p class="closing-line">${esc(line)}</p><p class="utility">Thank you for spending time with Aarav and Meera.</p><div class="actions"><a class="primary" href="#chapter/1/0">Read again</a><a href="#contents">Back to contents</a></div></section>${footer()}`;
      }else main.innerHTML=home();
      navigating=false;main.focus({preventScroll:true});
    }
  }catch(error){navigating=false;current=null;$('#reader-header').hidden=true;$('#reader-toolbar').hidden=true;$('#site-header').hidden=false;main.innerHTML=`<section class="wrap page-section"><h1>The page didn't open</h1><p>${esc(error.message)} Please check your connection and try again.</p><button id="retry">Try again</button> <a href="#home">Book home</a></section>`;$('#retry').onclick=route;}
}
$('#previous').onclick=()=>{if(current&&current.number>1)location.hash=`chapter/${current.number-1}/0`;};
$('#next').onclick=()=>{if(current)location.hash=current.number===12?'end':`chapter/${current.number+1}/0`;};
$('#settings-open').onclick=()=>{$('#storage-note').hidden=storageOK;$('#settings').showModal();};
$('#settings-close').onclick=()=>$('#settings').close();
$('#view-bookmarks').onclick=()=>$('#settings').close();
$('#font-smaller').onclick=()=>setFont(-2);$('#font-larger').onclick=()=>setFont(2);
document.querySelectorAll('input[name=theme]').forEach(r=>r.addEventListener('change',()=>{state.theme=r.value;applySettings();persist();}));
$('#bookmark').onclick=()=>{
  if(!current)return;const p=capturePosition();const found=state.bookmarks.findIndex(b=>b.chapter===current.number&&b.block===p.block);
  if(found>=0){state.bookmarks.splice(found,1);announce('Bookmark removed.');}
  else{state.bookmarks.push({chapter:current.number,block:p.block,excerpt:(current.blocks[p.block]?.text||'').slice(0,150)});announce('Passage bookmarked.');}
  persist();bookmarkButton();
};
addEventListener('scroll',()=>{if(!current||navigating||scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{scrollQueued=false;capturePosition();bookmarkButton();});},{passive:true});
addEventListener('pagehide',()=>{if(current)capturePosition();persist();});
addEventListener('hashchange',()=>{if(book)route();});
fetch('content/index.json').then(r=>{if(!r.ok)throw new Error('The book index is unavailable.');return r.json();}).then(data=>{book=data;route();}).catch(error=>{$('#main').innerHTML=`<div class="wrap page-section"><h1>The book didn't open</h1><p>${esc(error.message)} Please refresh when your connection returns.</p><a href="manuscript.html">Read the complete book without controls</a></div>`;});
