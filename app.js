const $=id=>document.getElementById(id);const KEY='pastorLabV5';
const data=JSON.parse(localStorage.getItem(KEY)||'{"notes":{},"researchNotes":[],"stepNotes":{},"progress":{},"favorites":[],"simple":{},"lastPassage":""}');
data.notes=data.notes||{};data.researchNotes=data.researchNotes||[];data.stepNotes=data.stepNotes||{};data.progress=data.progress||{};data.favorites=data.favorites||[];data.simple=data.simple||{};data.recentSearches=data.recentSearches||[];data.plan=data.plan||{};data.planStep=Number(data.planStep||0);
let sections=[];
let passageManifest=null;
let currentPassageData=null;


async function loadResearchDatabase(){
  try{
    const manifestResponse=await fetch('passage-manifest.json',{cache:'no-store'});
    if(!manifestResponse.ok)throw new Error('본문 목록을 불러오지 못했습니다.');
    passageManifest=await manifestResponse.json();

    const defaultItem=passageManifest.passages.find(x=>x.id===passageManifest.defaultPassageId)||passageManifest.passages[0];
    if(!defaultItem)throw new Error('등록된 본문 데이터가 없습니다.');

    const passageResponse=await fetch(defaultItem.path,{cache:'no-store'});
    if(!passageResponse.ok)throw new Error('본문 연구 자료를 불러오지 못했습니다.');
    currentPassageData=await passageResponse.json();
    sections=Array.isArray(currentPassageData.sections)?currentPassageData.sections:[];
    if(!sections.length)throw new Error('연구 항목이 비어 있습니다.');
    return true;
  }catch(error){
    console.error(error);
    document.body.innerHTML=`<main style="max-width:680px;margin:40px auto;padding:24px;font-family:system-ui;line-height:1.7">
      <h1>목회 연구실</h1>
      <div style="border:1px solid #d7ded9;border-radius:18px;padding:22px">
        <h2>자료를 불러오지 못했습니다</h2>
        <p>이 버전은 연구 데이터를 별도 JSON 파일로 불러옵니다. 파일을 직접 눌러 열지 말고 GitHub Pages처럼 웹서버에 올려 실행해 주세요.</p>
        <p><b>확인할 파일:</b><br>passage-manifest.json<br>chapter06.json</p>
      </div>
    </main>`;
    return false;
  }
}

function save(){localStorage.setItem(KEY,JSON.stringify(data))}function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}
function setGreeting(){const h=new Date().getHours();$('greeting').textContent=(h<11?'좋은 아침입니다':h<17?'좋은 오후입니다':'좋은 저녁입니다')+', 황순영 목사님.'}
function setNav(id){document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));if(id)$(id).classList.add('active')}
function openScreen(id,title,nav){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');$('pageTitle').textContent=title;setNav(nav);window.scrollTo(0,0);if(id==='search'){renderRecentSearches();if(!lastSearchQuery)renderSearchResults()}}function goHome(){openScreen('home','목회 연구실','navHome');renderResume()}

let searchFilter='전체',lastSearchQuery='',lastSearchMatches=[];
const searchAliases={
 '삿6':'사사기 6장','삿 6':'사사기 6장','사사기6':'사사기 6장','사사기 6':'사사기 6장',
 '여룹바알':'기드온 바알 제단','양털시험':'양털 표징','양털 시험':'양털 표징',
 '여호와샬롬':'여호와 샬롬','성령':'여호와의 영','우상숭배':'우상 바알 아세라'
};
const topicCatalog=[
 {kind:'본문',title:'사사기 6장',subtitle:'미디안의 압제부터 기드온의 양털 표징까지',keywords:'삿6 삿 6 사사기6 기드온 미디안 바알 아세라 양털 여룹바알 여호와 샬롬',action:'passage'},
 {kind:'인물',title:'기드온',subtitle:'두려움 속에서 부름받은 불완전한 사사',keywords:'기드온 여룹바알 큰 용사 포도주 틀 므낫세 아비에셀 양털',step:'characters'},
 {kind:'인물',title:'요아스',subtitle:'바알 제단의 소유자이자 기드온을 보호한 아버지',keywords:'요아스 아버지 바알 스스로 다툴 것 여룹바알',step:'characters'},
 {kind:'인물',title:'미디안',subtitle:'이스라엘의 생존 기반을 무너뜨린 약탈 세력',keywords:'미디안 아말렉 동방 사람 낙타 약탈 압제',step:'history'},
 {kind:'주제',title:'바알과 아세라',subtitle:'외부 전쟁보다 먼저 다뤄진 공동체 내부의 우상',keywords:'우상 우상숭배 바알 아세라 제단 풍요 종교 배교',step:'culture'},
 {kind:'주제',title:'양털 표징',subtitle:'오늘의 보편적 의사결정 공식으로 만들지 말아야 할 장면',keywords:'양털 시험 표징 하나님의 뜻 결정 확인 기드온',step:'views'},
 {kind:'주제',title:'여호와 샬롬',subtitle:'두려움 속에서 주어진 하나님의 안전과 평안 선언',keywords:'여호와 샬롬 평안 제단 죽음 두려움',step:'language'},
 {kind:'주제',title:'큰 용사',subtitle:'현재의 자신감보다 하나님의 임재와 소명을 드러내는 호칭',keywords:'큰 용사 깁보르 헤하일 소명 임재 내가 너와 함께',step:'language'},
 {kind:'주제',title:'여호와의 영',subtitle:'기드온을 입으신 하나님의 영과 사명의 능력',keywords:'성령 여호와의 영 옷 입히다 지도력 능력',step:'language'},
 {kind:'주제',title:'우상 철거와 구원',subtitle:'외부의 적보다 내부의 불순종을 먼저 다루시는 하나님',keywords:'우상 철거 회개 구원 성화 바알 제단 전쟁 순종',step:'theology'}
];
function normalizeSearch(v){let s=String(v||'').trim().toLowerCase().replace(/[·,._\-]/g,' ').replace(/\s+/g,' ');return searchAliases[s]||s}
function plainText(v){const d=document.createElement('div');d.innerHTML=v;return d.textContent.replace(/\s+/g,' ').trim()}
function buildSearchIndex(){
 const sectionItems=sections.map(s=>({kind:'연구',title:s.title.replace(/^\d+\.\s*/,''),subtitle:plainText(s.html).slice(0,150),keywords:[s.title,plainText(s.html),'사사기 6장'].join(' '),step:s.id}));
 const noteItems=data.researchNotes.map(n=>({kind:'내 노트',title:n.title||'제목 없음',subtitle:(n.body||'').slice(0,150),keywords:[n.passage,n.type,n.title,n.body].join(' '),noteId:n.id,passage:n.passage}));
 return [...topicCatalog,...sectionItems,...noteItems];
}
function searchScore(item,query){
 const q=normalizeSearch(query),terms=q.split(' ').filter(Boolean),title=normalizeSearch(item.title),all=normalizeSearch([item.title,item.subtitle,item.keywords].join(' '));
 if(!terms.every(t=>all.includes(t)))return 0;
 let score=10;
 if(title===q)score+=100;if(title.includes(q))score+=45;
 terms.forEach(t=>{if(title.includes(t))score+=18;if(normalizeSearch(item.keywords||'').includes(t))score+=7});
 if(item.kind==='본문')score+=8;
 return score;
}
function rememberSearch(q){const v=q.trim();data.recentSearches=[v,...data.recentSearches.filter(x=>x!==v)].slice(0,6);save()}
function runSearch(id){
 const input=$(id),q=input.value.trim();
 if(!q){alert('연구할 본문이나 주제를 입력해 주세요.');input.focus();return}
 if(id==='homeSearch'){openScreen('search','통합 검색','navSearch');$('searchInput').value=q}
 lastSearchQuery=q;rememberSearch(q);showSearchHints('');
 lastSearchMatches=buildSearchIndex().map(x=>({...x,score:searchScore(x,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 renderRecentSearches();renderSearchResults();
}
function setSearchFilter(filter,btn){
 searchFilter=filter;document.querySelectorAll('.search-tab').forEach(x=>x.classList.toggle('active',x===btn));renderSearchResults()
}
function renderSearchResults(){
 const box=$('searchResults');if(!box)return;
 const items=lastSearchMatches.filter(x=>searchFilter==='전체'||x.kind===searchFilter);
 if(!lastSearchQuery){box.innerHTML=`<div class="card"><h3>무엇을 찾을 수 있나요?</h3><div class="search-guide"><button onclick="quickSearch('기드온')">인물 · 기드온</button><button onclick="quickSearch('양털 표징')">주제 · 양털 표징</button><button onclick="quickSearch('바알과 아세라')">주제 · 우상</button><button onclick="quickSearch('설교 설계')">연구 · 설교 설계</button></div></div>`;return}
 if(!items.length){box.innerHTML=`<div class="no-result"><h3>“${escapeHtml(lastSearchQuery)}” 검색 결과가 없습니다</h3><p class="meta">현재 검증된 본문 데이터는 사사기 6장을 중심으로 구축되어 있습니다. 단어를 짧게 바꾸어 검색해 보세요.</p><div class="search-guide"><button onclick="quickSearch('사사기 6장')">사사기 6장</button><button onclick="quickSearch('기드온')">기드온</button><button onclick="quickSearch('미디안')">미디안</button><button onclick="quickSearch('양털')">양털</button></div></div>`;return}
 box.innerHTML=`<div class="search-status"><b>검색 결과 ${items.length}개</b><span class="meta">${escapeHtml(lastSearchQuery)}</span></div>`+items.map(renderSearchItem).join('');
}
function renderSearchItem(x){
 const title=highlightMatch(x.title,lastSearchQuery),desc=highlightMatch(x.subtitle||'',lastSearchQuery);
 let action='';
 if(x.action==='passage')action=`openPassage('사사기 6장')`;
 else if(x.step)action=`openResearchSection('${x.step}')`;
 else if(x.noteId)action=`openSearchNote('${x.noteId}')`;
 return `<article class="search-result"><span class="result-kind">${x.kind}</span><h3 class="match-text">${title}</h3><p class="match-text">${desc}</p><div class="result-actions"><button class="primary" onclick="${action}">${x.kind==='내 노트'?'노트 열기':x.kind==='본문'?'본문 연구 시작':'관련 연구 열기'}</button><button class="mini-btn" onclick="copySearchTitle('${escapeJs(x.title)}')" aria-label="제목 복사">복사</button></div></article>`
}
function highlightMatch(text,q){
 let safe=escapeHtml(String(text||'')),terms=normalizeSearch(q).split(' ').filter(x=>x.length>1).sort((a,b)=>b.length-a.length);
 terms.forEach(t=>{const escaped=t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');safe=safe.replace(new RegExp('('+escaped+')','gi'),'<mark>$1</mark>')});return safe
}
function quickSearch(q){openScreen('search','통합 검색','navSearch');$('searchInput').value=q;runSearch('searchInput')}
function openResearchSection(stepId){
 const s=sections.find(x=>x.id===stepId);if(!s)return;
 if(!s.quick)data.mode='deep';data.currentStep=data.currentStep||{};const list=data.mode==='deep'?sections:sections.filter(x=>x.quick);data.currentStep['사사기 6장']=Math.max(0,list.findIndex(x=>x.id===stepId));save();openPassage('사사기 6장')
}
function openSearchNote(id){openScreen('notes','내 연구노트','navNotes');renderNotes();const n=data.researchNotes.find(x=>x.id===id);if(n)openNoteEditor(n)}
async function copySearchTitle(t){try{await navigator.clipboard.writeText(t);toast('제목을 복사했습니다')}catch{toast('복사하지 못했습니다')}}
function showSearchHints(value){
 const box=$('searchHints');if(!box)return;const q=value.trim();
 if(!q){box.innerHTML='';return}
 const hints=buildSearchIndex().map(x=>({...x,score:searchScore(x,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
 box.innerHTML=hints.length?`<div class="search-hint-list">${hints.map(x=>`<button onclick="quickSearch('${escapeJs(x.title)}')"><b>${escapeHtml(x.title)}</b><br><small>${x.kind} · ${escapeHtml(x.subtitle.slice(0,55))}</small></button>`).join('')}</div>`:''
}
function renderRecentSearches(){
 const box=$('recentSearches');if(!box)return;
 if(!data.recentSearches.length){box.innerHTML='';return}
 box.innerHTML=`<div class="recent-box"><div class="recent-head"><b>최근 검색</b><button onclick="clearRecentSearches()">기록 지우기</button></div><div class="recent-list">${data.recentSearches.map(q=>`<button class="recent-chip" onclick="quickSearch('${escapeJs(q)}')">${escapeHtml(q)}</button>`).join('')}</div></div>`
}
function clearRecentSearches(){data.recentSearches=[];save();renderRecentSearches()}

function openPassage(p){data.lastPassage=p;data.currentStep=data.currentStep||{};data.mode=data.mode||'quick';save();openScreen('research',p,'navResearch');$('passageTitle').textContent=p;setMode(data.mode,true);$('passageNote').value=data.notes[p]||'';$('passageNote').oninput=e=>{data.notes[p]=e.target.value;save();$('passageSaveState').textContent='✓ 자동 저장됨 · '+formatTime(new Date());renderResume()};updateFav()}
function visibleSections(){return data.mode==='deep'?sections:sections.filter(s=>s.quick)}
function renderResearch(){
 const p='사사기 6장', list=visibleSections(), completed=data.progress[p]||[];
 data.currentStep=data.currentStep||{};
 let idx=Number(data.currentStep[p]||0);if(idx<0)idx=0;if(idx>=list.length)idx=list.length-1;data.currentStep[p]=idx;save();
 const s=list[idx];
 $('stepPill').textContent=(idx+1)+'단계';$('stepCount').textContent=(idx+1)+' / '+list.length;
 $('focusResearch').innerHTML=`<article class="focus-card"><div class="focus-title"><span class="focus-icon">${s.icon}</span><h3>${s.title}</h3></div><div class="focus-content">${s.html}<div class="step-note-box"><label for="currentStepNote"><b>이 단계 메모</b></label><textarea id="currentStepNote" class="notearea" placeholder="${s.title}에서 발견한 점을 적으세요." oninput="saveCurrentStepNote(this.value)">${escapeHtml(getCurrentStepNote(s.id))}</textarea><div class="autosave" id="stepSaveState">입력 즉시 자동 저장됩니다.</div></div><div class="step-actions"><button class="prev-btn" onclick="moveStep(-1)" ${idx===0?'disabled style="opacity:.45"':''}>← 이전 단계</button><button class="next-btn" onclick="finishAndNext('${s.id}')">${completed.includes(s.id)?(idx===list.length-1?'연구 완료 확인':'다음 단계 →'):'읽음 · 다음 단계 →'}</button></div></div></article>`;
 $('researchRoadmap').innerHTML=list.map((x,i)=>`<button class="roadmap-item ${i===idx?'active':''} ${completed.includes(x.id)?'done':''}" onclick="goStep(${i})"><span class="num">${completed.includes(x.id)?'✓':i+1}</span><span><b>${x.title}</b><br><small>${completed.includes(x.id)?'읽음 완료':'눌러서 연구하기'}</small></span></button>`).join('');
 updateProgress();
 const allDone=list.every(x=>completed.includes(x.id));
 $('completeBanner').innerHTML=allDone?`<div class="complete-banner"><h3>✓ ${data.mode==='deep'?'깊이 연구':'핵심 연구'} 완료</h3><p>연구 기록이 안전하게 저장되었습니다.</p></div>`:'';
}
function goStep(i){const p='사사기 6장';data.currentStep=data.currentStep||{};data.currentStep[p]=i;save();renderResearch();window.scrollTo({top:250,behavior:'smooth'})}
function moveStep(d){const list=visibleSections(),p='사사기 6장';let i=Number(data.currentStep?.[p]||0)+d;i=Math.max(0,Math.min(list.length-1,i));goStep(i)}
function finishAndNext(id){const p='사사기 6장',list=visibleSections();data.progress[p]=data.progress[p]||[];if(!data.progress[p].includes(id))data.progress[p].push(id);const i=Number(data.currentStep?.[p]||0);if(i<list.length-1)data.currentStep[p]=i+1;save();renderResearch();toast(i<list.length-1?'다음 연구 단계로 이동합니다':'연구를 완료했습니다');window.scrollTo({top:250,behavior:'smooth'})}
function toggleRoadmap(){const r=$('researchRoadmap');r.classList.toggle('show');$('roadmapToggle').textContent=r.classList.contains('show')?'목차 닫기':'☰ 전체 연구 목차 보기'}
function updateProgress(){const list=visibleSections(),done=data.progress['사사기 6장']||[],n=list.filter(x=>done.includes(x.id)).length,pct=Math.round(n/list.length*100);$('progressBar').style.width=pct+'%';$('progressText').textContent=(data.mode==='deep'?'깊이 연구':'핵심 연구')+' 진행 '+pct+'% ('+n+'/'+list.length+')'}
function setMode(m,initial=false){data.mode=m;save();document.body.classList.toggle('deep',m==='deep');$('quickBtn').classList.toggle('active',m==='quick');$('deepBtn').classList.toggle('active',m==='deep');data.currentStep=data.currentStep||{};if(!initial)data.currentStep['사사기 6장']=0;renderResearch()}
function toggleFavorite(){const p='사사기 6장',i=data.favorites.indexOf(p);if(i>=0)data.favorites.splice(i,1);else data.favorites.push(p);save();updateFav();toast(i>=0?'즐겨찾기에서 뺐습니다':'즐겨찾기에 추가했습니다')}
function updateFav(){$('favBtn').textContent=data.favorites.includes('사사기 6장')?'★ 즐겨찾기됨':'☆ 즐겨찾기 추가'}
function renderResume(){const p=data.lastPassage;if(!p){$('resumeCard').innerHTML='';return}const n=(data.progress[p]||[]).length,pct=Math.round(n/sections.length*100);$('resumeCard').innerHTML=`<div class="card"><div class="meta">이어서 연구하기</div><h2>${p}</h2><div class="progress"><span style="width:${pct}%"></span></div><div class="meta">진행 ${pct}%</div><button class="primary" onclick="openPassage('${p}')">계속 연구하기</button></div>`}
function migrateLegacyNotes(){if(data.legacyMigrated)return;Object.keys(data.notes).forEach(p=>{const body=(data.notes[p]||'').trim();if(body&&!data.researchNotes.some(n=>n.passage===p&&n.body===body)){data.researchNotes.push({id:uid(),passage:p,type:'본문 관찰',title:p+' 전체 메모',body,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()})}});data.legacyMigrated=true;save()}
function renderNotes(){migrateLegacyNotes();const q=($('noteSearch')?.value||'').trim().toLowerCase(),f=$('noteFilter')?.value||'전체';const items=[...data.researchNotes].filter(n=>(f==='전체'||n.type===f)&&(!q||[n.passage,n.type,n.title,n.body].join(' ').toLowerCase().includes(q))).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));if($('noteCount'))$('noteCount').textContent='저장된 노트 '+items.length+'개';$('notesList').innerHTML=items.length?items.map(n=>`<article class="note-card"><div><span class="type-badge">${escapeHtml(n.type)}</span> <span class="note-date">${formatDate(n.updatedAt)}</span></div><h3>${escapeHtml(n.title||'제목 없음')}</h3><div class="meta">${escapeHtml(n.passage||'본문 미지정')}</div><div class="note-preview" id="preview_${n.id}"><p>${escapeHtml(n.body).replace(/\n/g,'<br>')}</p></div><button class="mini-btn" style="width:100%;min-height:44px;border-radius:12px" onclick="togglePreview('${n.id}',this)">전체 보기</button><div class="actions"><button class="mini-btn" onclick="editNote('${n.id}')">수정</button><button class="delete-btn" onclick="deleteNote('${n.id}')">삭제</button></div>${n.passage?`<button class="secondary" onclick="openPassage('${escapeJs(n.passage)}')">본문 연구 열기</button>`:''}</article>`).join(''):'<div class="empty">검색 조건에 맞는 연구노트가 없습니다.</div>'}
function openNoteEditor(prefill={}){$('noteEditor').style.display='block';$('noteEditorTitle').textContent=prefill.id?'연구노트 수정':'새 연구노트';$('editingNoteId').value=prefill.id||'';$('notePassage').value=prefill.passage||data.lastPassage||'';$('noteType').value=prefill.type||'본문 관찰';$('noteTitle').value=prefill.title||'';$('noteBody').value=prefill.body||'';$('noteEditorState').textContent='';setTimeout(()=>$('noteTitle').focus(),50);window.scrollTo({top:$('noteEditor').offsetTop-110,behavior:'smooth'})}
function closeNoteEditor(){$('noteEditor').style.display='none';$('editingNoteId').value=''}
function saveNoteEditor(){const id=$('editingNoteId').value,passage=$('notePassage').value.trim(),type=$('noteType').value,title=$('noteTitle').value.trim(),body=$('noteBody').value.trim();if(!title&&!body){alert('제목이나 내용을 입력해 주세요.');return}const now=new Date().toISOString();if(id){const n=data.researchNotes.find(x=>x.id===id);if(n)Object.assign(n,{passage,type,title:title||'제목 없음',body,updatedAt:now})}else data.researchNotes.push({id:uid(),passage,type,title:title||'제목 없음',body,createdAt:now,updatedAt:now});save();closeNoteEditor();renderNotes();toast('연구노트를 저장했습니다')}
function editNote(id){const n=data.researchNotes.find(x=>x.id===id);if(n)openNoteEditor(n)}
function deleteNote(id){const n=data.researchNotes.find(x=>x.id===id);if(n&&confirm('“'+(n.title||'이 노트')+'”를 삭제할까요?')){data.researchNotes=data.researchNotes.filter(x=>x.id!==id);save();renderNotes();toast('노트를 삭제했습니다')}}
function togglePreview(id,btn){const e=$('preview_'+id);e.classList.toggle('expanded');btn.textContent=e.classList.contains('expanded')?'접기':'전체 보기'}
function createNoteFromPassage(type){openScreen('notes','내 연구노트','navNotes');renderNotes();const p=data.lastPassage||'사사기 6장',body=(data.notes[p]||'').trim();openNoteEditor({passage:p,type,title:type==='설교 아이디어'?p+' 설교 아이디어':p+' 본문 관찰',body:type==='본문 관찰'?body:''})}
function getCurrentStepNote(stepId){const p=data.lastPassage||'사사기 6장';return data.stepNotes[p]?.[stepId]||''}
function saveCurrentStepNote(value){const p=data.lastPassage||'사사기 6장',step=visibleSections()[Number(data.currentStep?.[p]||0)]?.id;if(!step)return;data.stepNotes[p]=data.stepNotes[p]||{};data.stepNotes[p][step]=value;save();const e=$('stepSaveState');if(e)e.textContent='✓ 자동 저장됨 · '+formatTime(new Date())}
function uid(){return 'n_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function formatDate(v){const d=new Date(v);return isNaN(d)?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'short',day:'numeric'})}
function formatTime(d){return d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}
function escapeJs(s){return String(s).replace(/'/g,"\\'").replace(/\n/g,' ')}


const planSteps=[
 {key:'current',title:'1. 현재 우리 교회',help:'지금의 모습을 솔직하게 적는 단계입니다.',questions:[
  ['strength','우리 교회의 가장 큰 강점은 무엇입니까?','예: 따뜻한 공동체, 말씀 중심, 선교 경험'],
  ['challenge','현재 가장 시급한 어려움은 무엇입니까?','예: 고령화, 다음세대 감소, 봉사자 부족'],
  ['region','봉담·화성 지역에서 보이는 변화는 무엇입니까?','예: 신도시 유입, 젊은 가정 증가, 지역 공동체 변화']
 ]},
 {key:'vision',title:'2. 우리 교회의 비전',help:'하나님께서 아가페교회에 맡기신 방향을 정리합니다.',questions:[
  ['calling','교회가 끝까지 지켜야 할 가장 중요한 사명은 무엇입니까?',''],
  ['people','어떤 사람들을 특히 섬기고 싶습니까?',''],
  ['picture','미래의 아가페교회를 한 문장으로 표현해 보세요.','예: 세대를 잇고 지역을 품는 선교적 교회']
 ]},
 {key:'year',title:'3. 올해 목표',help:'올해 안에 실제로 이루고 싶은 일을 적습니다.',questions:[
  ['top1','올해 가장 중요한 목표 1',''],['top2','올해 가장 중요한 목표 2',''],['top3','올해 가장 중요한 목표 3',''],
  ['measure','연말에 무엇을 보면 잘 진행됐다고 판단할 수 있습니까?','예: 새가족 정착률, 청년 참여, 소그룹 수']
 ]},
 {key:'three',title:'4. 3년 계획',help:'가장 먼저 변화를 만들어야 할 기간입니다.',questions:[
  ['goal','3년 후 교회의 모습',''],['nextgen','다음세대·청년 사역 계획',''],['care','장년·노년 돌봄 계획',''],['mission','전도·선교 계획','']
 ]},
 {key:'five',title:'5. 5년 계획',help:'교회의 체질과 구조를 세우는 중기 계획입니다.',questions:[
  ['goal','5년 후 교회의 모습',''],['leaders','다음 리더와 사역자 세우기',''],['system','교육·행정·재정에서 정비할 부분',''],['community','지역사회와의 관계 계획','']
 ]},
 {key:'ten',title:'6. 10년 계획',help:'세대교체와 교회의 지속 가능성을 바라봅니다.',questions:[
  ['goal','10년 후 꼭 남아 있어야 할 모습',''],['succession','목회 계승과 다음 리더십 준비',''],['generation','세대가 함께 예배하는 교회 계획',''],['legacy','후대에 남기고 싶은 신앙의 유산','']
 ]},
 {key:'action',title:'7. 실행하기',help:'좋은 계획을 실제 행동으로 바꾸는 단계입니다.',questions:[
  ['first','이번 달 가장 먼저 할 일',''],['owner','누가 함께 맡으면 좋습니까?',''],['date','언제까지 시작합니까?',''],['review','계획을 언제 다시 점검합니까?','예: 매월 첫째 주, 분기별 당회']
 ]}
];
let currentPlanStep=0;
function openPlan(){currentPlanStep=Math.max(0,Math.min(planSteps.length-1,Number(data.planStep||0)));openScreen('plan','앞으로의 계획');renderPlan()}
function renderPlan(){
 const step=planSteps[currentPlanStep];data.planStep=currentPlanStep;save();
 document.querySelectorAll('.plan-tab').forEach((b,i)=>b.classList.toggle('active',i===currentPlanStep));
 const values=data.plan[step.key]||{};
 $('planStepCard').innerHTML=`<div class="plan-step-card"><div class="step-pill">${currentPlanStep+1}단계</div><h3>${step.title}</h3><p class="plan-help">${step.help}</p>${step.questions.map(([key,label,ph])=>`<label class="plan-question" for="plan_${step.key}_${key}"><b>${label}</b><textarea id="plan_${step.key}_${key}" class="notearea" placeholder="${ph}" oninput="savePlanField('${step.key}','${key}',this.value)">${escapeHtml(values[key]||'')}</textarea></label>`).join('')}<div class="autosave" id="planSaveState">입력 즉시 자동 저장됩니다.</div></div>`;
 $('planPrev').disabled=currentPlanStep===0;$('planNext').textContent=currentPlanStep===planSteps.length-1?'계획서 확인':'다음 단계 →';
 updatePlanProgress();renderPlanSummary();
}
function savePlanField(group,key,value){data.plan[group]=data.plan[group]||{};data.plan[group][key]=value;save();const e=$('planSaveState');if(e)e.textContent='✓ 자동 저장됨 · '+formatTime(new Date());updatePlanProgress();renderPlanSummary()}
function goPlanStep(i){currentPlanStep=Math.max(0,Math.min(planSteps.length-1,i));renderPlan();window.scrollTo({top:170,behavior:'smooth'})}
function movePlanStep(d){if(currentPlanStep===planSteps.length-1&&d>0){document.querySelector('.plan-summary-card').scrollIntoView({behavior:'smooth'});return}goPlanStep(currentPlanStep+d)}
function updatePlanProgress(){let total=0,filled=0;planSteps.forEach(s=>s.questions.forEach(([k])=>{total++;if((data.plan[s.key]?.[k]||'').trim())filled++}));const pct=Math.round(filled/total*100);$('planProgressBar').style.width=pct+'%';$('planProgressText').textContent=`작성 진행 ${pct}% (${filled}/${total})`}
function buildPlanText(){let out='화성 아가페교회 앞으로의 계획\n';out+='작성일: '+new Date().toLocaleDateString('ko-KR')+'\n\n';planSteps.forEach(s=>{out+=s.title+'\n';s.questions.forEach(([k,label])=>{const v=(data.plan[s.key]?.[k]||'').trim();out+='- '+label+': '+(v||'아직 작성하지 않음')+'\n'});out+='\n'});return out}
function renderPlanSummary(){const box=$('planSummary');if(!box)return;box.innerHTML=planSteps.map(s=>{const rows=s.questions.filter(([k])=>(data.plan[s.key]?.[k]||'').trim()).map(([k,label])=>`<p><b>${label}</b><br>${escapeHtml(data.plan[s.key][k]).replace(/\n/g,'<br>')}</p>`).join('');return `<section><h4>${s.title}</h4>${rows||'<p class="meta">아직 작성한 내용이 없습니다.</p>'}</section>`}).join('')}
async function copyPlanSummary(){try{await navigator.clipboard.writeText(buildPlanText());toast('계획서를 복사했습니다')}catch{alert('복사하지 못했습니다.')} }
function downloadPlanSummary(){const blob=new Blob([buildPlanText()],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='아가페교회_앞으로의_계획.txt';a.click();URL.revokeObjectURL(a.href);toast('계획서를 저장했습니다')}


const aiTasks={
 sermon:{icon:'✍️',title:'설교 원고 쓰기',desc:'본문과 핵심 메시지를 바탕으로 설교 개요와 원고를 정리합니다.',tools:[['Claude','★★★★★','긴 글과 자연스러운 문장 정리에 좋습니다.','https://claude.ai/'],['ChatGPT','★★★★☆','질문을 주고받으며 개요를 발전시키기 좋습니다.','https://chatgpt.com/']],prompt:`당신은 건강한 개신교 신학에 기초해 설교 준비를 돕는 조력자입니다.\n\n설교 본문: [본문을 입력하세요]\n예배 대상: [주일예배/청년예배/수요예배]\n설교 시간: [예: 30분]\n핵심 주제: [주제를 입력하세요]\n\n다음 순서로 작성해 주세요.\n1. 본문의 문맥과 핵심 메시지\n2. 설교 제목 5개\n3. 3대지 설교 개요\n4. 각 대지의 설명과 오늘의 적용\n5. 복음 중심의 결론\n6. 설교자가 반드시 확인할 해석상 주의점\n\n본문에 없는 내용을 단정하지 말고, 불확실한 내용은 따로 표시해 주세요.`},
 bible:{icon:'📖',title:'성경 본문 연구',desc:'본문의 역사적 배경, 문맥, 핵심 단어와 신학적 메시지를 살펴봅니다.',tools:[['ChatGPT','★★★★★','질문을 이어가며 여러 관점으로 연구하기 좋습니다.','https://chatgpt.com/'],['Claude','★★★★☆','긴 본문과 참고자료를 정리하기 좋습니다.','https://claude.ai/'],['NotebookLM','★★★★☆','올린 주석과 자료 안에서 근거를 찾아 정리하기 좋습니다.','https://notebooklm.google.com/']],prompt:`다음 성경 본문을 건강한 개신교 해석 원칙에 따라 연구해 주세요.\n\n본문: [본문을 입력하세요]\n\n다음 항목으로 구분해 주세요.\n1. 앞뒤 문맥\n2. 역사적·문화적 배경\n3. 주요 인물과 장소\n4. 중요한 원어 또는 반복 표현\n5. 본문이 처음 독자에게 전한 핵심 메시지\n6. 성경 전체와 연결되는 신학적 의미\n7. 오늘의 교회와 성도에게 적용할 점\n8. 잘못 해석하기 쉬운 부분\n\n사실, 해석, 적용을 구분하고 출처가 필요한 내용은 확인 필요라고 표시해 주세요.`},
 prayer:{icon:'🙏',title:'대표기도 준비',desc:'예배와 공동체 상황에 맞는 자연스러운 대표기도문을 준비합니다.',tools:[['ChatGPT','★★★★★','상황을 반영해 여러 길이와 어조로 수정하기 좋습니다.','https://chatgpt.com/'],['Claude','★★★★☆','차분하고 자연스러운 긴 문장 정리에 좋습니다.','https://claude.ai/']],prompt:`한국 교회 예배에서 사용할 대표기도문을 작성해 주세요.\n\n예배: [주일예배/수요예배/특별예배]\n기도 시간: [예: 3분]\n이번 주 말씀 또는 주제: [입력]\n교회 상황: [입력]\n꼭 포함할 기도 제목: [입력]\n\n구성은 찬양과 감사, 회개, 교회와 성도, 나라와 선교, 말씀 전하시는 목회자, 결단의 순서로 해 주세요. 과장된 표현과 지나치게 긴 문장을 피하고, 공동체가 함께 공감할 수 있는 따뜻하고 정중한 문체로 작성해 주세요.`},
 poster:{icon:'🖼️',title:'행사 포스터 만들기',desc:'행사의 목적과 분위기를 이미지 생성 AI가 이해하도록 정리합니다.',tools:[['ChatGPT','★★★★★','문구와 이미지를 함께 만들고 수정하기 편합니다.','https://chatgpt.com/'],['Gemini','★★★★☆','이미지와 글을 함께 다룰 때 활용할 수 있습니다.','https://gemini.google.com/']],prompt:`교회 행사 포스터 이미지를 만들어 주세요.\n\n행사명: [입력]\n주제 문구: [입력]\n날짜와 시간: [입력]\n장소: [입력]\n주최: 화성 아가페교회\n대상: [입력]\n원하는 분위기: [예: 따뜻함, 여름, 거룩함, 젊은 감각]\n주요 색상: [입력]\n크기: [정사각형/세로형/가로형]\n\n한글이 잘 읽히도록 여백을 충분히 두고, 핵심 제목이 가장 먼저 보이게 해 주세요. 촌스럽거나 복잡한 교회 상징은 피하고, 오타와 글자 깨짐이 없도록 주의해 주세요.`},
 pdf:{icon:'📄',title:'긴 문서·PDF 읽기',desc:'PDF, 회의자료, 설교자료를 올리고 핵심 내용을 질문합니다.',tools:[['NotebookLM','★★★★★','올린 자료를 근거로 요약하고 질문하기에 적합합니다.','https://notebooklm.google.com/'],['Claude','★★★★☆','긴 문서를 읽고 구조화하기 좋습니다.','https://claude.ai/'],['ChatGPT','★★★★☆','문서 내용을 대화하며 다시 정리하기 좋습니다.','https://chatgpt.com/']],prompt:`첨부한 문서를 읽고 다음 형식으로 정리해 주세요.\n\n1. 문서의 목적\n2. 핵심 내용 10가지\n3. 중요한 날짜·인물·수치\n4. 교회가 결정해야 할 사항\n5. 바로 실행할 일과 담당자\n6. 확인이 필요한 부분\n7. 한 페이지 분량의 쉬운 요약\n\n문서에 없는 내용을 추측하지 말고, 각 답변이 어느 부분에 근거하는지 함께 표시해 주세요.`},
 search:{icon:'🔎',title:'인터넷 자료 찾기',desc:'최신 지역 정보, 통계, 사례와 참고자료를 찾아 비교합니다.',tools:[['Gemini','★★★★★','웹 자료와 구글 검색을 함께 활용하기 편합니다.','https://gemini.google.com/'],['ChatGPT','★★★★☆','찾은 자료를 비교하고 실행안으로 정리하기 좋습니다.','https://chatgpt.com/']],prompt:`다음 주제에 관한 최신 인터넷 자료를 찾아 정리해 주세요.\n\n주제: [입력]\n지역: [예: 화성시 봉담읍]\n목적: [예: 교회 5년 계획 수립]\n\n공공기관, 공식 통계, 신뢰할 수 있는 연구기관 자료를 우선 사용해 주세요. 자료마다 발행기관, 발행일, 핵심 내용, 원문 링크를 표시하고 서로 다른 자료가 충돌하면 그 차이도 설명해 주세요. 마지막에는 아가페교회가 참고할 수 있는 현실적인 시사점 5가지를 정리해 주세요.`},
 translate:{icon:'🌏',title:'번역하기',desc:'뜻을 살리면서 예배와 선교 현장에 자연스러운 문장으로 옮깁니다.',tools:[['ChatGPT','★★★★★','문맥과 대상에 맞춰 자연스럽게 다듬기 좋습니다.','https://chatgpt.com/'],['Claude','★★★★☆','긴 글의 문체와 흐름을 유지하기 좋습니다.','https://claude.ai/']],prompt:`아래 글을 [목표 언어]로 자연스럽게 번역해 주세요.\n\n사용 상황: [예: 일본 교회 예배 안내, 선교 편지]\n독자: [예: 일본인 목회자, 처음 교회에 온 사람]\n원하는 말투: [정중함/따뜻함/쉬운 표현]\n원문: [여기에 붙여넣기]\n\n직역보다 의미 전달을 우선하되 성경 용어와 교회 용어는 해당 언어권에서 실제 사용하는 표현을 적용해 주세요. 번역문 아래에는 어색할 수 있는 표현과 선택 가능한 다른 표현도 알려 주세요.`},
 meeting:{icon:'📝',title:'회의록 정리',desc:'회의 내용을 결정사항, 담당자, 기한과 다음 회의 안건으로 정리합니다.',tools:[['Claude','★★★★★','긴 회의 내용을 빠짐없이 구조화하기 좋습니다.','https://claude.ai/'],['ChatGPT','★★★★☆','표와 실행 목록으로 바꾸고 수정하기 좋습니다.','https://chatgpt.com/'],['NotebookLM','★★★★☆','회의자료를 함께 올려 근거 중심으로 정리하기 좋습니다.','https://notebooklm.google.com/']],prompt:`아래 회의 내용을 교회에서 바로 사용할 수 있는 회의록으로 정리해 주세요.\n\n회의명: [입력]\n일시: [입력]\n참석자: [입력]\n회의 내용: [붙여넣기]\n\n다음 형식으로 작성해 주세요.\n1. 회의 목적\n2. 주요 논의 내용\n3. 확정된 결정사항\n4. 해야 할 일·담당자·기한 표\n5. 보류하거나 추가 확인할 내용\n6. 다음 회의에서 다룰 안건\n\n발언에 없던 결론은 만들지 말고, 담당자나 기한이 불분명하면 '확인 필요'라고 표시해 주세요.`}
};
function openAiTask(key){
 const task=aiTasks[key],box=$('aiTaskDetail');if(!task||!box)return;
 box.hidden=false;
 box.innerHTML=`<button class="ai-detail-back" onclick="closeAiTask()">← 다른 일 선택</button><div class="ai-detail-head"><span>${task.icon}</span><div><h3>${task.title}</h3><p>${task.desc}</p></div></div><h4>추천 AI</h4><div class="ai-recommend-list">${task.tools.map((t,i)=>`<a href="${t[3]}" target="_blank" rel="noopener" class="ai-recommend ${i===0?'best':''}"><div><b>${t[0]}</b><span>${t[1]}</span><small>${t[2]}</small></div><strong>${i===0?'가장 추천':'열기'} ›</strong></a>`).join('')}</div><div class="prompt-box"><div class="prompt-head"><h4>바로 사용할 질문 문장</h4><button onclick="copyAiPrompt('${key}')">복사하기</button></div><pre id="aiPromptText">${escapeHtml(task.prompt)}</pre></div>`;
 $('aiTaskGrid').hidden=true;
 box.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeAiTask(){$('aiTaskDetail').hidden=true;$('aiTaskGrid').hidden=false;window.scrollTo({top:120,behavior:'smooth'})}
async function copyAiPrompt(key){try{await navigator.clipboard.writeText(aiTasks[key].prompt);toast('질문 문장을 복사했습니다')}catch{alert('복사하지 못했습니다. 질문 문장을 길게 눌러 복사해 주세요.')}}

function openSimpleTool(t){openScreen('simpleTool',t);$('simpleTitle').textContent=t;$('simpleSubject').value=data.simple[t]?.subject||'';$('simpleText').value=data.simple[t]?.text||'';const store=()=>{data.simple[t]={subject:$('simpleSubject').value,text:$('simpleText').value};save()};$('simpleSubject').oninput=store;$('simpleText').oninput=store}
async function copySimple(){try{await navigator.clipboard.writeText($('simpleText').value);toast('복사했습니다')}catch{alert('복사하지 못했습니다. 내용을 길게 눌러 복사해 주세요.')}}
let fontStep=Number(localStorage.getItem('fontStep')||0);function changeFont(){fontStep=(fontStep+1)%3;const sizes=['20px','22px','24px'];document.documentElement.style.setProperty('--base',sizes[fontStep]);localStorage.setItem('fontStep',fontStep);toast(['기본 글씨','큰 글씨','아주 큰 글씨'][fontStep])}
function speakCurrent(){if(!('speechSynthesis'in window)){alert('이 기기에서는 읽어주기를 지원하지 않습니다.');return}speechSynthesis.cancel();const text=document.querySelector('.screen.active').innerText.replace(/열기|읽음으로 표시/g,'');const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.9;speechSynthesis.speak(u)}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='목회연구실_백업.json';a.click();URL.revokeObjectURL(a.href)}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);localStorage.setItem(KEY,JSON.stringify(x));alert('복원이 완료되었습니다.');location.reload()}catch{alert('올바른 백업 파일이 아닙니다.')}};r.readAsText(f)}
function clearData(){if(confirm('저장한 연구 메모와 진행 기록을 모두 삭제할까요?')){localStorage.removeItem(KEY);location.reload()}}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function boot(){
  const loaded=await loadResearchDatabase();
  if(!loaded)return;
  if($('homeSearch'))$('homeSearch').addEventListener('keydown',e=>{if(e.key==='Enter')runSearch('homeSearch')});
  $('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')runSearch('searchInput')});
  document.documentElement.style.setProperty('--base',['20px','22px','24px'][fontStep]);
  migrateLegacyNotes();
  setGreeting();
  renderResume();
  renderRecentSearches();
}
boot();
