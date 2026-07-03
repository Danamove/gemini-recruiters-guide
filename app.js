/* ==========================================================================
   Interactive build-along guide, interaction layer.
   Handles: step navigation, drawer, persistent checklist, real progress,
   copy-to-clipboard, reset, finish. Edit STEPS and KEY below per project.
   ========================================================================== */
(function () {
  "use strict";

  // EDIT THIS: one entry per <section class="bx-view" id="vN"> in index.html.
  // id 0 = intro (shown as a bullet, not a number). ids 1..N = numbered steps.
  // The label is what shows in the drawer ("step map"). Keep ids contiguous from 0.
  var STEPS = [
    { id: 0, label: "Intro" },
    { id: 1, label: "Messy intake" },
    { id: 2, label: "Clean the signal" },
    { id: 3, label: "Real must-haves" },
    { id: 4, label: "Translate feedback" },
    { id: 5, label: "Target profile" },
    { id: 6, label: "Sourcing brief" },
    { id: 7, label: "Make it repeatable" },
    { id: 8, label: "Build the Gem" },
    { id: 9, label: "Recap" },
    { id: 10, label: "Bonus: Common mistakes" },
    { id: 11, label: "Bonus: Good output" }
  ];
  var LAST = STEPS.length - 1;
  // EDIT THIS: a unique localStorage key for this guide (so guides do not collide).
  var KEY = "geminiRecruitersGuide";

  // EDIT THIS: user-facing UI strings. Translate per guide language (e.g. Hebrew).
  var T = {
    percentDone: function (p) { return p + "% complete"; },
    copied: "Copied ✓",
    copyOk: "Copied to clipboard",
    copyFail: "Copy failed, select and copy manually",
    reset: "Progress reset",
    finished: "All steps complete 🎉"
  };

  /* ---- state ---- */
  var state = load();

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object") {
        raw.step = typeof raw.step === "number" ? raw.step : 0;
        raw.checks = raw.checks && typeof raw.checks === "object" ? raw.checks : {};
        raw.visited = Array.isArray(raw.visited) ? raw.visited : [];
        return raw;
      }
    } catch (e) { /* fall through */ }
    return { step: 0, checks: {}, visited: [] };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ---- elements ---- */
  var elNav = document.getElementById("bxNav");
  var elDrawer = document.getElementById("bxDrawer");
  var elBackdrop = document.getElementById("bxBackdrop");
  var elMenu = document.getElementById("bxMenu");
  var elFill = document.getElementById("bxProgressFill");
  var elPText = document.getElementById("bxProgressText");
  var elProgressBar = document.querySelector(".bx-progress");
  var elToast = document.getElementById("bxToast");

  /* ---- checkbox indexing (stable per step, by DOM order) ---- */
  function checkboxesForStep(step) {
    return Array.prototype.slice.call(
      document.querySelectorAll('.bx-check input[data-step="' + step + '"]')
    );
  }
  function allCheckboxes() {
    return Array.prototype.slice.call(document.querySelectorAll('.bx-check input[data-step]'));
  }

  function isChecked(step, idx) {
    return !!(state.checks[step] && state.checks[step][idx]);
  }
  function setChecked(step, idx, val) {
    if (!state.checks[step]) state.checks[step] = {};
    state.checks[step][idx] = val;
    save();
  }
  function stepHasChecks(step) { return checkboxesForStep(step).length > 0; }
  function stepDone(step) {
    var boxes = checkboxesForStep(step);
    if (boxes.length === 0) return state.visited.indexOf(step) !== -1;
    for (var i = 0; i < boxes.length; i++) { if (!isChecked(step, i)) return false; }
    return true;
  }

  /* ---- progress (real: based on checklist completion) ---- */
  function updateProgress() {
    var boxes = allCheckboxes();
    var total = boxes.length;
    var done = 0;
    boxes.forEach(function (cb) {
      if (isChecked(parseInt(cb.getAttribute("data-step"), 10), indexWithinStep(cb))) done++;
    });
    var pct = total ? Math.round((done / total) * 100) : 0;
    if (elFill) elFill.style.width = pct + "%";
    if (elPText) elPText.textContent = T.percentDone(pct);
    if (elProgressBar) elProgressBar.setAttribute("aria-valuenow", String(pct));
  }
  function indexWithinStep(cb) {
    var step = cb.getAttribute("data-step");
    var siblings = checkboxesForStep(step);
    return siblings.indexOf(cb);
  }

  /* ---- nav (drawer list) ---- */
  function renderNav() {
    if (!elNav) return;
    elNav.innerHTML = "";
    STEPS.forEach(function (s) {
      var li = document.createElement("li");
      li.className = "bx-nav-item" +
        (s.id === state.step ? " is-active" : "") +
        (stepDone(s.id) ? " is-done" : "");
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      if (s.id === state.step) li.setAttribute("aria-current", "step");

      var dot = document.createElement("span");
      dot.className = "bx-nav-dot";
      dot.textContent = stepDone(s.id) ? "✓" : (s.id === 0 ? "•" : s.id);

      var label = document.createElement("span");
      label.className = "bx-nav-label";
      label.textContent = (s.id === 0 ? "" : s.id + ". ") + s.label;

      li.appendChild(dot);
      li.appendChild(label);
      li.addEventListener("click", function () { go(s.id); closeDrawer(); });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(s.id); closeDrawer(); }
      });
      elNav.appendChild(li);
    });
  }

  /* ---- navigation ---- */
  function go(id) {
    id = Math.max(0, Math.min(LAST, id));
    var views = document.querySelectorAll(".bx-view");
    for (var i = 0; i < views.length; i++) views[i].classList.remove("is-on");
    var target = document.getElementById("v" + id);
    if (!target) return;
    target.classList.add("is-on");

    state.step = id;
    if (state.visited.indexOf(id) === -1) state.visited.push(id);
    save();

    // Keep the URL shareable: #vN mirrors the active step (no history spam).
    if (window.history && history.replaceState) {
      history.replaceState(null, "", id === 0
        ? location.pathname + location.search
        : "#v" + id);
    }

    renderNav();
    updateProgress();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    var h = target.querySelector(".bx-h1, .bx-hero-title");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  /* ---- drawer ---- */
  function openDrawer() {
    elDrawer.classList.add("is-open");
    elBackdrop.hidden = false;
    requestAnimationFrame(function () { elBackdrop.classList.add("is-open"); });
    elMenu.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    elDrawer.classList.remove("is-open");
    elBackdrop.classList.remove("is-open");
    elMenu.setAttribute("aria-expanded", "false");
    setTimeout(function () { elBackdrop.hidden = true; }, 220);
  }
  function toggleDrawer() {
    if (elDrawer.classList.contains("is-open")) closeDrawer(); else openDrawer();
  }

  /* ---- checklist wiring ---- */
  function wireChecklist() {
    allCheckboxes().forEach(function (cb) {
      var step = cb.getAttribute("data-step");
      var idx = indexWithinStep(cb);
      cb.checked = isChecked(step, idx);
      cb.addEventListener("change", function () {
        setChecked(step, idx, cb.checked);
        updateProgress();
        renderNav();
      });
    });
  }

  /* ---- copy to clipboard ---- */
  function wireCopy() {
    document.querySelectorAll(".bx-copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var block = btn.closest(".bx-prompt");
        var code = block ? block.querySelector(".bx-code") : null;
        if (!code) return;
        var text = code.textContent;
        copyText(text).then(function () {
          var original = btn.textContent;
          btn.textContent = T.copied;
          btn.classList.add("is-done");
          toast(T.copyOk);
          setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove("is-done");
          }, 1600);
        }).catch(function () {
          toast(T.copyFail);
        });
      });
    });
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject();
      } catch (e) { reject(e); }
    });
  }

  /* ---- toast ---- */
  var toastTimer;
  function toast(msg) {
    if (!elToast) return;
    elToast.textContent = msg;
    elToast.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove("is-show"); }, 2200);
  }

  /* ---- reset ---- */
  function reset() {
    state = { step: 0, checks: {}, visited: [] };
    save();
    allCheckboxes().forEach(function (cb) { cb.checked = false; });
    renderNav();
    updateProgress();
    go(0);
    toast(T.reset);
  }

  /* ---- finish (mark all checklist items done) ---- */
  function finish() {
    allCheckboxes().forEach(function (cb) {
      cb.checked = true;
      setChecked(cb.getAttribute("data-step"), indexWithinStep(cb), true);
    });
    updateProgress();
    renderNav();
    toast(T.finished);
  }

  /* ---- global wiring ---- */
  function wireControls() {
    elMenu.addEventListener("click", toggleDrawer);
    elBackdrop.addEventListener("click", closeDrawer);
    document.getElementById("bxReset").addEventListener("click", reset);
    var fin = document.getElementById("bxFinish");
    if (fin) fin.addEventListener("click", finish);

    document.addEventListener("click", function (e) {
      var goBtn = e.target.closest("[data-go]");
      if (goBtn) { go(parseInt(goBtn.getAttribute("data-go"), 10)); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && elDrawer.classList.contains("is-open")) closeDrawer();
    });
  }

  /* ---- init ---- */
  function init() {
    wireControls();
    wireChecklist();
    wireCopy();
    renderNav();
    updateProgress();
    // A #vN deep link wins over the saved step (shared links land on the right step).
    var m = (location.hash || "").match(/^#v(\d+)$/);
    go(m ? parseInt(m[1], 10) : (state.step || 0));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
