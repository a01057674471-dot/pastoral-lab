const state = {
  recent: JSON.parse(localStorage.getItem('pastoralRecent') || 'null') || [
    {icon:'📖', title:'사사기 6장 본문 연구', meta:'오늘 · 성경 연구'},
    {icon:'📝', title:'주일 설교 1페이지 요약', meta:'어제 · 설교 정리'},
    {icon:'🧭', title:'2027 교회 로드맵', meta:'3일 전 · 교회 운영'}
  ],
  notes: JSON.parse(localStorage.getItem('pastoralNotes') || 'null') || [
    {type:'설교 연구',title:'사사기 6장 — 큰 용사여',body:'부르심은 현재 능력보다 하나님의 함께하심에 근거한다.',date:'오늘'},
    {type:'설교 연구',title:'요한복음 15장 — 내 안에 거하라',body:'열매의 출발은 활동이 아니라 관계와 연합이다.',date:'7월 20일'},
    {type:'교회 운영',title:'새가족 정착 개선안',body:'등록 후 48시간 안에 첫 연락, 4주 과정 시범 운영.',date:'7월 18일'},
    {type:'기도와 묵상',title:'다음 세대를 위한 기도',body:'교회 안에서 말씀과 사랑을 함께 경험하도록 기도한다.',date:'7월 17일'}
  ]
};

const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const sidebar = document.getElementById('sidebar');

function showView(name){
  views.forEach(v=>v.classList.toggle('active', v.id===`view-${name}`));
  navItems.forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  sidebar.classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}
navItems.forEach(n=>n.addEventListener('click',()=>showView(n.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
document.getElementById('mobileMenu').addEventListener('click',()=>sidebar.classList.toggle('open'));

function renderRecent(){
  document.getElementById('recentList').innerHTML=state.recent.map(r=>`<div class="recent-item"><div class="recent-icon">${r.icon}</div><div><strong>${r.title}</strong><span>${r.meta}</span></div></div>`).join('');
}
function renderNotes(){
  document.getElementById('notesGrid').innerHTML=state.notes.map(n=>`<article class="note-card"><span>${n.type} · ${n.date}</span><h3>${n.title}</h3><p>${n.body}</p></article>`).join('');
}
renderRecent();renderNotes();

const studyNote=document.getElementById('studyNote');
studyNote.value=localStorage.getItem('studyNote')||studyNote.value;
studyNote.addEventListener('input',()=>{
  document.getElementById('saveState').textContent='저장 중...';
  localStorage.setItem('studyNote',studyNote.value);
  setTimeout(()=>document.getElementById('saveState').textContent='모든 변경사항 저장됨',500);
});

document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  tab.classList.add('active');document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
}));

const taskConfig={
  'sermon-summary':{title:'설교문 정리',desc:'설교문을 붙여 넣고 필요한 결과 형식을 선택하세요.',body:`<label>결과 형식</label><select><option>설교자용 1페이지 요약</option><option>성도 배포용 요약</option><option>주보용 500자 요약</option><option>소그룹 나눔 자료</option><option>유튜브 설명문</option></select><label>설교문</label><textarea placeholder="설교문 전체를 붙여 넣으세요"></textarea>`},
  image:{title:'설교 이미지 만들기',desc:'목사님은 장면만 알려주세요. 자연스러운 이미지 프롬프트는 AI가 구성합니다.',body:`<label>설교 본문</label><input placeholder="예: 누가복음 15장"><label>표현할 장면</label><textarea placeholder="예: 아버지가 멀리서 돌아오는 아들을 기다리는 모습"></textarea><label>이미지 느낌</label><select><option>자연스러운 실제 사진</option><option>절제된 영화 장면</option><option>따뜻한 일러스트</option><option>어린이 설교용 그림</option></select><label>사용 위치</label><select><option>설교 화면 16:9</option><option>유튜브 썸네일</option><option>주보</option><option>SNS 게시물</option></select>`},
  blog:{title:'교회 글쓰기',desc:'글의 종류와 핵심 내용만 입력하면 자연스럽게 정리합니다.',body:`<label>글 종류</label><select><option>설교 요약 블로그</option><option>주일예배 후기</option><option>교회 행사 안내</option><option>새가족 초대 글</option><option>목회 칼럼</option></select><label>핵심 내용</label><textarea placeholder="반드시 들어갈 내용을 적어주세요"></textarea><label>글의 느낌</label><select><option>담백하고 따뜻하게</option><option>공식적이고 신뢰감 있게</option><option>처음 오는 분도 쉽게</option></select>`},
  refine:{title:'내 요청 다듬기',desc:'짧게 적어도 괜찮습니다. AI가 목적·대상·형식이 분명한 요청으로 바꿉니다.',body:`<label>원래 요청</label><textarea placeholder="예: 이번 설교 블로그에 올릴 글 만들어줘"></textarea>`},
  bible:{title:'성경 질문',desc:'본문과 궁금한 점을 입력하세요.',body:`<label>본문</label><input placeholder="예: 사사기 6장 11-16절"><label>질문</label><textarea placeholder="예: 왜 하나님은 두려워하는 기드온을 큰 용사라고 부르셨나요?"></textarea>`},
  feedback:{title:'설교 점검',desc:'설교를 대신 쓰지 않고 본문 충실도와 논리 흐름을 검토합니다.',body:`<label>설교 본문</label><input placeholder="예: 요한복음 15장"><label>설교문</label><textarea placeholder="검토할 설교문을 붙여 넣으세요"></textarea>`}
};
const modal=document.getElementById('modalBackdrop');
function openTask(key){const c=taskConfig[key]||taskConfig.refine;document.getElementById('modalTitle').textContent=c.title;document.getElementById('modalDesc').textContent=c.desc;document.getElementById('modalBody').innerHTML=c.body;modal.hidden=false;}
function closeModal(){modal.hidden=true;}
document.querySelectorAll('[data-task]').forEach(b=>b.addEventListener('click',()=>openTask(b.dataset.task)));
document.getElementById('modalClose').addEventListener('click',closeModal);document.getElementById('modalCancel').addEventListener('click',closeModal);
document.getElementById('modalNext').addEventListener('click',()=>{alert('입력 내용을 바탕으로 AI 작업을 시작하는 단계입니다. 실제 API 연결은 다음 개발 단계에서 적용합니다.');closeModal();});

function addRecent(title,icon='📝'){
 state.recent.unshift({icon,title,meta:'방금 · 자동 저장'});state.recent=state.recent.slice(0,5);localStorage.setItem('pastoralRecent',JSON.stringify(state.recent));renderRecent();
}
document.getElementById('saveStudyBtn').addEventListener('click',()=>{addRecent('사사기 6장 연구 노트','📖');alert('연구 노트에 저장했습니다.');});
document.getElementById('askAiBtn').addEventListener('click',()=>{showView('ai');document.getElementById('quickPrompt').value='사사기 6장 12절에서 하나님이 기드온을 큰 용사라고 부르신 의미를 본문과 원어를 바탕으로 설명해줘.';});
document.getElementById('newNoteBtn').addEventListener('click',()=>{const title=prompt('새 노트 제목을 입력하세요');if(!title)return;state.notes.unshift({type:'새 노트',title,body:'내용을 작성하세요.',date:'방금'});localStorage.setItem('pastoralNotes',JSON.stringify(state.notes));renderNotes();});
document.getElementById('newRoadmapBtn').addEventListener('click',()=>{document.getElementById('modalTitle').textContent='새 교회 로드맵';document.getElementById('modalDesc').textContent='AI가 한 번에 하나씩 질문하며 실행 가능한 문서로 정리합니다.';document.getElementById('modalBody').innerHTML='<label>가장 먼저 해결하고 싶은 과제</label><select><option>새가족 정착</option><option>다음 세대</option><option>제자훈련</option><option>전도와 지역사회</option><option>리더 양성</option><option>직접 입력</option></select><label>목표 기간</label><select><option>1년</option><option>3년</option><option>5년</option></select>';modal.hidden=false;});
document.querySelectorAll('[data-roadmap-task]').forEach(b=>b.addEventListener('click',()=>{alert(`${b.textContent} 문서 생성 화면을 준비했습니다. 실제 AI 문서 생성은 API 연결 후 작동합니다.`)}));

document.getElementById('refineBtn').addEventListener('click',()=>openTask('refine'));
document.getElementById('runPromptBtn').addEventListener('click',()=>{const v=document.getElementById('quickPrompt').value.trim();if(!v)return alert('요청 내용을 입력해주세요.');addRecent(v,'✦');alert('요청이 저장되었습니다. 실제 AI 응답 연결은 다음 단계에서 적용합니다.');});
document.getElementById('globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.trim();if(q){alert(`“${q}” 통합검색 결과 화면은 다음 단계에서 실제 데이터와 연결합니다.`)}}});
document.getElementById('helpBtn').addEventListener('click',()=>alert('프롬프트를 직접 만들 필요 없이 원하는 작업을 선택하고 질문에 답하면 됩니다.'));
document.getElementById('churchProfileBtn').addEventListener('click',()=>alert('화성 아가페교회 · 황순영 목사님 전용 설정이 적용되어 있습니다.'));
