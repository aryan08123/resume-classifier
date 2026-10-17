(() => {
  "use strict";
  const MAX = 2 * 1024 * 1024, EXT = [".pdf", ".txt"];
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const form = $("#analyze-form");
  if (!form) return;

  const input = $("#resume_file"), zone = $("#dropzone"), idle = $(".dz-idle", zone), chosen = $(".dz-file", zone);
  const msg = $("#dz-msg"), text = $("#resume_text"), counter = $("#word-count");
  const err = $("#client-error"), submit = $("#submit-btn");
  let busy = false;

  const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
  const size = (b) => (b < 1048576 ? (b / 1024).toFixed(0) + " KB" : (b / 1048576).toFixed(2) + " MB");

  function showFile(f) {
    $(".dz-name", zone).textContent = f.name;
    $(".dz-size", zone).textContent = size(f.size);
    idle.hidden = true; chosen.hidden = false; zone.classList.add("has-file");
  }
  function clearFile() {
    input.value = ""; idle.hidden = false; chosen.hidden = true; zone.classList.remove("has-file");
  }
  function take(f) {
    msg.textContent = "";
    if (!f) return clearFile();
    const ok = EXT.some((e) => f.name.toLowerCase().endsWith(e));
    if (!ok) { clearFile(); msg.textContent = "Only PDF or TXT files are supported."; return; }
    if (f.size > MAX) { clearFile(); msg.textContent = "That file is over 2 MB. Choose a smaller one."; return; }
    const dt = new DataTransfer(); dt.items.add(f); input.files = dt.files;
    showFile(f);
  }

  input.addEventListener("change", () => take(input.files[0]));
  $("#dz-remove").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); msg.textContent = ""; clearFile(); });
  ["dragenter", "dragover"].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((t) => zone.addEventListener(t, () => zone.classList.remove("is-over")));
  zone.addEventListener("drop", (e) => { e.preventDefault(); take(e.dataTransfer.files[0]); });
  ["dragover", "drop"].forEach((t) => addEventListener(t, (e) => e.preventDefault()));

  text.addEventListener("input", () => {
    const n = words(text.value);
    counter.textContent = n + (n === 1 ? " word" : " words");
    counter.classList.toggle("ok", n >= 20);
  });

  form.addEventListener("submit", (e) => {
    if (busy) return e.preventDefault();
    if (!input.files.length && words(text.value) < 20) {
      e.preventDefault();
      err.textContent = "Please upload or paste a resume (at least 20 words).";
      err.hidden = false;
      form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      return;
    }
    err.hidden = true; busy = true;
    submit.classList.add("is-loading"); submit.setAttribute("aria-busy", "true");
  });
  addEventListener("pageshow", () => { busy = false; submit.classList.remove("is-loading"); submit.removeAttribute("aria-busy"); });

  $("#clear-btn").addEventListener("click", () => {
    form.reset(); clearFile(); msg.textContent = ""; err.hidden = true;
    counter.textContent = "0 words"; counter.classList.remove("ok");
  });

  // animated score
  document.querySelectorAll(".count").forEach((el) => {
    const to = parseFloat(el.dataset.value);
    if (isNaN(to) || reduce) return;
    const t0 = performance.now(), dur = 1200;
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(1);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // glow follows the pointer; result cards tilt slightly
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  document.querySelectorAll(".glass").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty("--mx", x + "px"); c.style.setProperty("--my", y + "px");
      if (fine && !reduce && c.classList.contains("tilt")) {
        c.style.setProperty("--rx", (-(y / r.height - 0.5) * 4).toFixed(2) + "deg");
        c.style.setProperty("--ry", ((x / r.width - 0.5) * 5).toFixed(2) + "deg");
      }
    });
    c.addEventListener("pointerleave", () => { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
  });

  // on stacked (mobile/tablet) layouts, bring new results into view
  const res = $("#results");
  if (matchMedia("(max-width: 959px)").matches && res && res.querySelector(".card:not(.empty), .alert")) {
    res.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
})();