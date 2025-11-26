// guru.js – login sederhana + ringkasan & download bank soal
document.addEventListener("DOMContentLoaded", () => {
  const loginCard = document.getElementById("loginCard");
  const adminPanel = document.getElementById("adminPanel");
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("loginError");
  const questionSummary = document.getElementById("questionSummary");
  const jsonInput = document.getElementById("jsonInput");
  const btnDownloadJson = document.getElementById("btnDownloadJson");
  const btnBackToLogin = document.getElementById("btnBackToLogin");

  // Kalau elemen-elemen penting tidak ditemukan, jangan lakukan apa-apa (hindari error)
  if (!loginCard || !adminPanel || !loginForm) {
    console.warn("Elemen guru.html belum lengkap, guru.js tidak dijalankan penuh.");
    return;
  }

  let bankSoal = null; // objek questions.json yang dimuat di memori

  function showAdmin() {
    loginCard.classList.add("hidden");
    adminPanel.classList.remove("hidden");
  }

  function showLogin() {
    adminPanel.classList.add("hidden");
    loginCard.classList.remove("hidden");
    if (loginError) loginError.textContent = "";
    if (loginForm) loginForm.reset();
  }

  // ---- LOGIN HANDLER ----
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = (usernameInput?.value || "").trim();
    const p = (passwordInput?.value || "").trim();

    if (u === "guru" && p === "admin") {
      showAdmin();
      loadQuestionsFromServer();
    } else {
      if (loginError) {
        loginError.textContent = "Username atau password salah. Contoh: guru / admin.";
      } else {
        alert("Username atau password salah.");
      }
    }
  });

  if (btnBackToLogin) {
    btnBackToLogin.addEventListener("click", () => {
      showLogin();
    });
  }

  // ---- LOAD DEFAULT questions.json ----
  async function loadQuestionsFromServer() {
    if (!questionSummary) return;

    questionSummary.textContent = "Memuat questions.json dari server...";
    try {
      const res = await fetch("questions.json");
      if (!res.ok) {
        throw new Error("Gagal mengambil questions.json (status " + res.status + ")");
      }
      const data = await res.json();
      bankSoal = data;
      questionSummary.textContent = makeSummary(bankSoal);
    } catch (err) {
      console.error(err);
      questionSummary.textContent =
        "Gagal memuat questions.json. Pastikan file tersebut ada di folder yang sama dengan guru.html.";
    }
  }

  function makeSummary(data) {
    if (!data || typeof data !== "object") {
      return "Format data tidak dikenali.";
    }
    const lines = [];
    for (const mapel of Object.keys(data)) {
      const levels = data[mapel] || {};
      const detail = [];
      let total = 0;
      for (const lvl of Object.keys(levels)) {
        const count = Array.isArray(levels[lvl]) ? levels[lvl].length : 0;
        total += count;
        detail.push(`${lvl}: ${count}`);
      }
      lines.push(`• ${mapel} — total ${total} soal (${detail.join(", ")})`);
    }
    if (!lines.length) return "Belum ada soal di bank soal.";
    return lines.join("\n");
  }

  // ---- IMPOR JSON BARU DARI FILE ----
  if (jsonInput) {
    jsonInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        bankSoal = parsed;
        if (questionSummary) {
          questionSummary.textContent =
            "Berhasil memuat file JSON dari komputer.\n" + makeSummary(bankSoal);
        }
        alert("Berhasil memuat questions.json dari file lokal.");
      } catch (err) {
        console.error(err);
        alert("Gagal membaca file JSON. Pastikan formatnya valid.");
      }
    });
  }

  // ---- DOWNLOAD BANK SOAL YANG SEDANG DIMUAT ----
  if (btnDownloadJson) {
    btnDownloadJson.addEventListener("click", () => {
      if (!bankSoal) {
        alert("Bank soal belum dimuat. Login dulu dan pastikan questions.json berhasil diambil.");
        return;
      }
      const blob = new Blob([JSON.stringify(bankSoal, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "questions.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
});
