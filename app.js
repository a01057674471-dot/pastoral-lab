const STORAGE_KEY = "pastoralLabResponsiveV2";
const $ = (id) => document.getElementById(id);

const defaultState = {
  pastorName: "황순영",
  largeText: false,
  works: [],
  activeWorkId: null
};

let state = loadState();
let currentFilter = "전체";
let saveTimer;

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 1600);
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  $(screenId).classList.add("active");

  document.querySelectorAll(".side-item[data-screen], .bottom-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === screenId);
  });

  if (screenId === "home") renderHome();
  if (screenId === "library") renderLibrary();
  if (screenId === "settings") renderSettings();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setGreeting() {
  const hour = new Date().getHours();
  $("timeGreeting").textContent =
    hour < 11 ? "좋은 아침입니다." : hour < 17 ? "좋은 오후입니다." : "좋은 저녁입니다.";
  $("pastorName").textContent = state.pastorName;
  $("profileButton").textContent = state.pastorName.trim().slice(0, 1) || "목";
}

function calculateProgress(work) {
  const fields = [work.title, work.passage, work.body];
  return Math.round((fields.filter((value) => value && value.trim()).length / fields.length) * 100);
}

function renderHome() {
  setGreeting();
  $("workCount").textContent = `${state.works.length}개`;
  $("fontState").textContent = state.largeText ? "크게" : "기본";

  const works = [...state.works].sort((a, b) => b.updatedAt - a.updatedAt);
  const resume = $("resumeCard");

  if (!works.length) {
    resume.innerHTML = `<div class="empty-card">아직 저장된 작업이 없습니다.<br>위에서 첫 작업을 시작해 보세요.</div>`;
    return;
  }

  const work = works[0];
  const progress = calculateProgress(work);

  resume.innerHTML = `
    <article class="resume-card">
      <div>
        <span class="item-kind">${escapeHtml(work.type)}</span>
        <h3>${escapeHtml(work.title || "제목 없는 작업")}</h3>
        <p class="resume-meta">${escapeHtml(work.passage || "본문 미입력")} · ${formatDate(work.updatedAt)}</p>
      </div>
      <div class="resume-right">
        <div class="resume-progress"><span style="width:${progress}%"></span></div>
        <p class="resume-meta">작성 진행 ${progress}%</p>
        <button class="resume-button" data-open-work="${work.id}">이어서 준비하기</button>
      </div>
    </article>`;
}

function createWork(type, passage = "", question = "") {
  const now = Date.now();
  const work = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(now),
    type,
    title: type === "성경 연구" ? passage : "",
    passage,
    body: question,
    createdAt: now,
    updatedAt: now
  };

  state.works.push(work);
  state.activeWorkId = work.id;
  saveState();
  openEditor(work.id);
}

function openEditor(id) {
  const work = state.works.find((item) => item.id === id);
  if (!work) return;

  state.activeWorkId = id;
  saveState();

  $("editorType").textContent = work.type;
  $("editorTitle").textContent = work.title || "새 작업";
  $("workTitle").value = work.title || "";
  $("workPassage").value = work.passage || "";
  $("workBody").value = work.body || "";
  $("saveState").textContent = "저장됨";

  updateEditorProgress(work);
  showScreen("editor");
}

function updateEditorProgress(work) {
  const progress = calculateProgress(work);
  $("progressBar").style.width = `${progress}%`;
  $("progressText").textContent = `작성 진행 ${progress}%`;
  $("editorTitle").textContent = work.title || "새 작업";
}

function scheduleEditorSave() {
  const work = state.works.find((item) => item.id === state.activeWorkId);
  if (!work) return;

  $("saveState").textContent = "저장 중…";
  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    work.title = $("workTitle").value;
    work.passage = $("workPassage").value;
    work.body = $("workBody").value;
    work.updatedAt = Date.now();
    saveState();
    updateEditorProgress(work);
    $("saveState").textContent = "저장됨";
  }, 300);
}

function renderLibrary() {
  const list = $("libraryList");

  const works = [...state.works]
    .filter((work) => {
      if (currentFilter === "전체") return true;
      if (currentFilter === "설교") return work.type.includes("설교") || work.type.includes("예배");
      if (currentFilter === "기도") return work.type.includes("기도");
      if (currentFilter === "연구") return work.type.includes("연구");
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (!works.length) {
    list.innerHTML = `<div class="empty-card">이 항목에 저장된 작업이 없습니다.</div>`;
    return;
  }

  list.innerHTML = works.map((work) => `
    <article class="library-item">
      <span class="item-kind">${escapeHtml(work.type)}</span>
      <h3>${escapeHtml(work.title || "제목 없는 작업")}</h3>
      <p>${escapeHtml(work.passage || "본문 미입력")} · ${formatDate(work.updatedAt)}</p>
      <button class="item-button" data-open-work="${work.id}">열어서 이어하기</button>
    </article>`).join("");
}

function renderSettings() {
  $("nameInput").value = state.pastorName;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(timestamp));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function backupData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pastoral-lab-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast("자료를 백업했습니다.");
}

document.addEventListener("click", (event) => {
  const screenButton = event.target.closest("[data-screen]");
  if (screenButton) showScreen(screenButton.dataset.screen);

  const newButton = event.target.closest("[data-new-type]");
  if (newButton) createWork(newButton.dataset.newType);

  const workButton = event.target.closest("[data-open-work]");
  if (workButton) openEditor(workButton.dataset.openWork);

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    currentFilter = filterButton.dataset.filter;
    document.querySelectorAll(".filter").forEach((button) => {
      button.classList.toggle("active", button === filterButton);
    });
    renderLibrary();
  }
});

$("researchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  createWork("성경 연구", $("passageInput").value.trim(), $("researchQuestion").value.trim());
  event.target.reset();
});

["workTitle", "workPassage", "workBody"].forEach((id) => {
  $(id).addEventListener("input", scheduleEditorSave);
});

$("finishButton").addEventListener("click", () => {
  scheduleEditorSave();
  setTimeout(() => {
    toast("오늘 작업을 안전하게 저장했습니다.");
    showScreen("home");
  }, 350);
});

$("fontButton").addEventListener("click", () => {
  state.largeText = !state.largeText;
  document.body.classList.toggle("large-text", state.largeText);
  saveState();
  renderHome();
  toast(state.largeText ? "글씨를 크게 표시합니다." : "기본 글씨 크기로 돌아왔습니다.");
});

$("saveNameButton").addEventListener("click", () => {
  const name = $("nameInput").value.trim();
  if (!name) return toast("성함을 입력해 주세요.");

  state.pastorName = name;
  saveState();
  setGreeting();
  toast("이름을 저장했습니다.");
});

$("backupButton").addEventListener("click", backupData);

$("resetButton").addEventListener("click", () => {
  if (!confirm("저장된 모든 작업을 지울까요? 이 작업은 되돌릴 수 없습니다.")) return;
  state = { ...defaultState, works: [] };
  saveState();
  renderSettings();
  renderHome();
  toast("모든 자료를 지웠습니다.");
});

document.body.classList.toggle("large-text", state.largeText);
renderHome();
