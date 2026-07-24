(function () {
  "use strict";

  const STORAGE_KEY = "gildongDiaries";
  const DARK_MODE_KEY = "gildongDarkMode";
  const FONT_SIZE_KEY = "gildongFontSize";

  const MIN_FONT_SIZE = 14;
  const MAX_FONT_SIZE = 22;
  const FONT_STEP = 2;

  // DOM 요소
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section");
  const diaryForm = document.getElementById("diary-form");
  const diaryTitle = document.getElementById("diary-title");
  const diaryDate = document.getElementById("diary-date");
  const diaryContent = document.getElementById("diary-content");
  const diaryList = document.getElementById("diary-list");
  const diaryDetail = document.getElementById("diary-detail");
  const diaryCount = document.getElementById("diary-count");
  const backToListBtn = document.getElementById("back-to-list");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const fontDecreaseBtn = document.getElementById("font-decrease");
  const fontIncreaseBtn = document.getElementById("font-increase");

  // 초기화
  function init() {
    setTodayDate();
    loadDarkMode();
    loadFontSize();
    renderDiaryList();
    updateDiaryCount();
    bindEvents();
  }

  function setTodayDate() {
    const today = new Date().toISOString().split("T")[0];
    diaryDate.value = today;
  }

  // 내비게이션
  function showSection(sectionName) {
    sections.forEach(function (section) {
      section.classList.remove("active");
    });

    const target = document.getElementById("section-" + sectionName);
    if (target) {
      target.classList.add("active");
    }

    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.dataset.section === sectionName);
    });
  }

  function bindEvents() {
    navLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        showSection(link.dataset.section);
      });
    });

    diaryForm.addEventListener("submit", handleSaveDiary);
    backToListBtn.addEventListener("click", function () {
      showSection("list");
    });

    darkModeToggle.addEventListener("click", toggleDarkMode);
    fontDecreaseBtn.addEventListener("click", function () {
      changeFontSize(-FONT_STEP);
    });
    fontIncreaseBtn.addEventListener("click", function () {
      changeFontSize(FONT_STEP);
    });
  }

  // localStorage - 일기
  function getDiaries() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveDiaries(diaries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
  }

  function handleSaveDiary(e) {
    e.preventDefault();

    const diary = {
      id: Date.now().toString(),
      title: diaryTitle.value.trim(),
      date: diaryDate.value,
      content: diaryContent.value.trim(),
      createdAt: new Date().toISOString(),
    };

    const diaries = getDiaries();
    diaries.unshift(diary);
    saveDiaries(diaries);

    diaryForm.reset();
    setTodayDate();

    renderDiaryList();
    updateDiaryCount();
    showSection("list");
    alert("일기가 저장되었습니다!");
  }

  function deleteDiary(id, e) {
    e.stopPropagation();
    if (!confirm("이 일기를 삭제하시겠습니까?")) return;

    const diaries = getDiaries().filter(function (d) {
      return d.id !== id;
    });
    saveDiaries(diaries);
    renderDiaryList();
    updateDiaryCount();
  }

  function showDiaryDetail(id) {
    const diary = getDiaries().find(function (d) {
      return d.id === id;
    });

    if (!diary) return;

    diaryDetail.innerHTML =
      "<h3>" + escapeHtml(diary.title) + "</h3>" +
      '<p class="detail-date">' + formatDate(diary.date) + "</p>" +
      '<div class="detail-content">' + escapeHtml(diary.content) + "</div>";

    showSection("detail");
  }

  function renderDiaryList() {
    const diaries = getDiaries();

    if (diaries.length === 0) {
      diaryList.innerHTML = '<p class="empty-message">아직 저장된 일기가 없습니다.</p>';
      return;
    }

    diaryList.innerHTML = diaries
      .map(function (diary) {
        const preview =
          diary.content.length > 60
            ? diary.content.substring(0, 60) + "..."
            : diary.content;

        return (
          '<div class="diary-item" data-id="' +
          diary.id +
          '">' +
          '<div class="diary-item-title">' +
          escapeHtml(diary.title) +
          "</div>" +
          '<div class="diary-item-date">' +
          formatDate(diary.date) +
          "</div>" +
          '<div class="diary-item-preview">' +
          escapeHtml(preview) +
          "</div>" +
          '<div class="diary-item-actions">' +
          '<button type="button" class="btn-delete" data-id="' +
          diary.id +
          '">삭제</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    diaryList.querySelectorAll(".diary-item").forEach(function (item) {
      item.addEventListener("click", function () {
        showDiaryDetail(item.dataset.id);
      });
    });

    diaryList.querySelectorAll(".btn-delete").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        deleteDiary(btn.dataset.id, e);
      });
    });
  }

  function updateDiaryCount() {
    diaryCount.textContent = getDiaries().length;
  }

  // 다크모드
  function loadDarkMode() {
    const isDark = localStorage.getItem(DARK_MODE_KEY) === "true";
    document.body.classList.toggle("dark-mode", isDark);
    updateDarkModeButton(isDark);
  }

  function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem(DARK_MODE_KEY, isDark);
    updateDarkModeButton(isDark);
  }

  function updateDarkModeButton(isDark) {
    darkModeToggle.textContent = isDark ? "☀️ 라이트모드" : "🌙 다크모드";
  }

  // 폰트 크기
  function loadFontSize() {
    const saved = parseInt(localStorage.getItem(FONT_SIZE_KEY), 10);
    if (saved && saved >= MIN_FONT_SIZE && saved <= MAX_FONT_SIZE) {
      applyFontSize(saved);
    }
  }

  function changeFontSize(delta) {
    const current = parseInt(
      getComputedStyle(document.documentElement).fontSize,
      10
    );
    const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, current + delta));
    applyFontSize(next);
    localStorage.setItem(FONT_SIZE_KEY, next);
  }

  function applyFontSize(size) {
    document.documentElement.style.setProperty("--font-size-base", size + "px");
  }

  // 유틸
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    return year + "년 " + month + "월 " + day + "일 (" + weekday + ")";
  }

  init();
})();
