// app.js - Quiz logic untuk index.html
// Semua soal diambil dari file questions.json di server (GitHub/Vercel)
// Tidak ada penyimpanan ke localStorage.

const LEVELS = ["Mudah", "Lumayan Susah", "Susah Banget"];

let QUESTION_BANK = {};
let lastStarts = {};
let lastSetCategory = null;
let lastSetLevel = null;

function $(sel) {
  return document.querySelector(sel);
}

const el = {
  category: $("#category"),
  level: $("#level"),
  btnStart: $("#btn-start"),
  btnRandom: $("#btn-random"),
  home: $("#home"),
  quiz: $("#quiz"),
  result: $("#result"),
  meta: $("#meta"),
  progressText: $("#progressText"),
  scoreEl: $("#score"),
  totalQuestions: $("#totalQuestions"),
  pfill: $("#pfill"),
  questionText: $("#questionText"),
  options: $("#options"),
  explain: $("#explain"),
  explainTitle: $("#explainTitle"),
  explainText: $("#explainText"),
  btnNext: $("#btn-next"),
  btnRetry: $("#btn-retry"),
  btnHome: $("#btn-home"),
  resultText: $("#resultText"),
  btnResRetry: $("#btn-res-retry"),
  btnResHome: $("#btn-res-home"),
};

let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// Helpers show/hide
function show(node) {
  node?.classList.remove("hidden");
}
function hide(node) {
  node?.classList.add("hidden");
}

// --- Load question bank dari questions.json ---
async function loadQuestionBank() {
  try {
    const res = await fetch("questions.json?cacheBust=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    QUESTION_BANK = await res.json();
    rebuildCategorySelect();
  } catch (err) {
    console.error("Gagal memuat questions.json:", err);
    alert(
      "Gagal memuat bank soal dari questions.json.\n" +
        "Pastikan file questions.json ada di repo yang sama dengan index.html."
    );
  }
}

// --- Dropdown kategori & level ---
function rebuildCategorySelect() {
  if (!el.category) return;
  el.category.innerHTML = "";

  const cats = Object.keys(QUESTION_BANK);
  if (!cats.length) return;

  cats.forEach((cat) => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    el.category.appendChild(o);
  });

  el.category.value = cats[0];
  updateLevelSelect();
}

function updateLevelSelect() {
  const cat = el.category.value;
  el.level.innerHTML = "";
  if (!QUESTION_BANK[cat]) return;

  const levelsInCat = Object.keys(QUESTION_BANK[cat] || {});

  LEVELS.forEach((L) => {
    if (levelsInCat.includes(L)) {
      const o = document.createElement("option");
      o.value = L;
      o.textContent = L;
      el.level.appendChild(o);
    }
  });

  // Kalau ada level tambahan custom
  levelsInCat.forEach((L) => {
    if (!LEVELS.includes(L)) {
      const o = document.createElement("option");
      o.value = L;
      o.textContent = L;
      el.level.appendChild(o);
    }
  });
}

// --- Utility ---
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rotateArray(arr, k = 1) {
  const a = arr.slice();
  const n = a.length;
  if (n === 0) return a;
  k = ((k % n) + n) % n;
  return a.slice(k).concat(a.slice(0, k));
}

// --- Quiz Flow ---
function startQuiz(categoryOverride, levelOverride) {
  const cat = categoryOverride || el.category.value;
  const lvl = levelOverride || el.level.value;

  const bank = (QUESTION_BANK[cat] && QUESTION_BANK[cat][lvl]) || [];
  if (!bank.length) {
    alert("Belum ada soal di kategori/level ini.");
    return;
  }

  let shuffled = shuffleArray(bank);
  const key = `${cat}||${lvl}`;
  const prevFirst = lastStarts[key];

  // Kalau ulang level, pastikan mulai dari soal berbeda
  if (prevFirst && shuffled[0].id === prevFirst && shuffled.length > 1) {
    const k = Math.max(1, Math.floor(Math.random() * shuffled.length));
    shuffled = rotateArray(shuffled, k);
  }

  lastStarts[key] = shuffled[0].id;

  currentQuestions = shuffled;
  currentIndex = 0;
  score = 0;
  lastSetCategory = cat;
  lastSetLevel = lvl;

  hide(el.home);
  hide(el.result);
  show(el.quiz);

  renderQuestion();
}

function renderQuestion() {
  const q = currentQuestions[currentIndex];
  if (!q) return;

  el.meta.textContent = `${lastSetCategory} • ${lastSetLevel}`;
  el.progressText.textContent = `Soal ${currentIndex + 1} / ${
    currentQuestions.length
  }`;

  el.scoreEl.textContent = score;
if (el.totalQuestions) {
  el.totalQuestions.textContent = `${currentQuestions.length} soal`;
}

  const ratio = (currentIndex + 1) / currentQuestions.length;
  el.pfill.style.width = `${(ratio * 100).toFixed(1)}%`;

  el.questionText.textContent = q.text;
  el.options.innerHTML = "";
  hide(el.explain);
  hide(el.btnRetry);

  q.options.forEach((opt) => {
    const b = document.createElement("button");
    b.className = "option";
    b.textContent = opt.text;
    b.dataset.opt = opt.id;
    b.addEventListener("click", () => chooseAnswer(opt.id));
    el.options.appendChild(b);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setOptionsDisabled(disabled) {
  const btns = el.options.querySelectorAll(".option");
  btns.forEach((b) => {
    if (disabled) b.classList.add("disabled");
    else b.classList.remove("disabled");
  });
}

function chooseAnswer(optId) {
  const q = currentQuestions[currentIndex];
  if (!q) return;

  // kalau penjelasan sudah muncul, cegah double-klik
  if (!el.explain.classList.contains("hidden")) return;

  const correct = optId === q.answerId;
  if (correct) score++;

  const btns = el.options.querySelectorAll(".option");
  btns.forEach((b) => {
    const id = b.dataset.opt;
    if (id === q.answerId) b.classList.add("correct");
    if (!correct && id === optId && id !== q.answerId) b.classList.add("wrong");
  });

  setOptionsDisabled(true);

  el.explainTitle.textContent = correct ? "Benar! 🎉" : "Salah 😔";
  el.explainText.textContent = q.explanation || "";
  show(el.explain);

  el.scoreEl.textContent = score;
  if (!correct) show(el.btnRetry);
  else hide(el.btnRetry);

  el.btnNext.textContent =
    currentIndex + 1 < currentQuestions.length ? "Soal berikutnya" : "Lihat hasil";
}

function nextQuestion() {
  hide(el.explain);
  setOptionsDisabled(false);

  if (currentIndex + 1 < currentQuestions.length) {
    currentIndex++;
    renderQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  el.resultText.textContent = `Skor kamu: ${score} / ${currentQuestions.length}`;
  hide(el.quiz);
  show(el.result);
}

function retryLevel() {
  if (lastSetCategory && lastSetLevel) {
    startQuiz(lastSetCategory, lastSetLevel);
  }
}

function backToHome() {
  hide(el.quiz);
  hide(el.result);
  show(el.home);
}

// --- Event binding ---
document.addEventListener("DOMContentLoaded", () => {
  if (!el.category) return;

  loadQuestionBank();

  el.category.addEventListener("change", updateLevelSelect);
  el.btnStart.addEventListener("click", () => startQuiz());
  el.btnRandom.addEventListener("click", () => {
    const cats = Object.keys(QUESTION_BANK);
    if (!cats.length) return;
    const randCat = cats[Math.floor(Math.random() * cats.length)];
    const levels = Object.keys(QUESTION_BANK[randCat] || {});
    const level = LEVELS.find((L) => levels.includes(L)) || levels[0];

    el.category.value = randCat;
    updateLevelSelect();
    el.level.value = level;
    startQuiz(randCat, level);
  });

  el.btnNext.addEventListener("click", nextQuestion);
  el.btnRetry.addEventListener("click", retryLevel);
  el.btnHome.addEventListener("click", backToHome);

  el.btnResRetry?.addEventListener("click", retryLevel);
  el.btnResHome?.addEventListener("click", backToHome);
});
