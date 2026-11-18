/* Dooop project page interactions (vanilla JS, no build step). */
(function () {
  "use strict";

  var SAMPLES = window.DOOOP_SAMPLES || [];
  var ASSET_ROOT = "assets/";
  var K_VALUES = ["1", "2", "3", "4", "8", "16"];
  var REEL_FRAMES = ["teacher"].concat(K_VALUES);
  var REEL_SAMPLE_ID = "main-1";
  var REEL_INTERVAL_MS = 1200;
  var SET_LABELS = {
    main: "GenEval categories",
    appcat: "GenEval object prompts",
    coco: "COCO captions",
    appa: "More GenEval prompts",
    appb: "GenEval single-object prompts"
  };

  var state = {
    promptIndex: 0,
    k: "2",
    galleryK: "2",
    opacity: 50
  };

  function $(id) {
    return document.getElementById(id);
  }

  function imgPath(sample, key) {
    return ASSET_ROOT + sample.images[key];
  }

  function frameName(key) {
    return key === "teacher" ? "Teacher" : "K = " + key;
  }

  function altText(sample, key) {
    var who = key === "teacher" ? "Teacher (SD3-medium)" : "Dooop with K = " + key + " loops";
    return who + " sample for the prompt: " + sample.prompt;
  }

  /* Image failure fallback: show a neutral placeholder, recover if a later src loads. */
  function markFailed(img) {
    img.style.visibility = "hidden";
    var host = img.parentNode;
    if (host && !host.querySelector(".img-fallback")) {
      var box = document.createElement("div");
      box.className = "img-fallback";
      box.textContent = "Image unavailable";
      host.appendChild(box);
    }
  }

  function initImageFallback() {
    document.addEventListener("error", function (event) {
      var img = event.target;
      if (img && img.tagName === "IMG") {
        markFailed(img);
      }
    }, true);
    /* Images that already failed before this script ran. */
    document.querySelectorAll("img").forEach(function (img) {
      if (img.getAttribute("src") && img.complete && img.naturalWidth === 0) {
        markFailed(img);
      }
    });
    document.addEventListener("load", function (event) {
      var img = event.target;
      if (!img || img.tagName !== "IMG") {
        return;
      }
      img.style.visibility = "";
      var host = img.parentNode;
      var box = host && host.querySelector(".img-fallback");
      if (box && !host.querySelector("img[style*='hidden']")) {
        box.remove();
      }
    }, true);
  }

  /* Segmented K controls (radiogroup with roving tabindex). */
  function buildSegmented(group, getValue, setValue) {
    var hosts = document.querySelectorAll('[data-k-group="' + group + '"]');
    hosts.forEach(function (host) {
      K_VALUES.forEach(function (k) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.dataset.k = k;
        b.textContent = k;
        b.setAttribute("aria-label", "K = " + k);
        b.addEventListener("click", function () {
          setValue(k);
        });
        b.addEventListener("keydown", function (e) {
          var i = K_VALUES.indexOf(getValue());
          var next = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            next = K_VALUES[(i + 1) % K_VALUES.length];
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            next = K_VALUES[(i - 1 + K_VALUES.length) % K_VALUES.length];
          } else if (e.key === "Home") {
            next = K_VALUES[0];
          } else if (e.key === "End") {
            next = K_VALUES[K_VALUES.length - 1];
          }
          if (next !== null) {
            e.preventDefault();
            setValue(next);
            host.querySelector('[data-k="' + next + '"]').focus();
          }
        });
        host.appendChild(b);
      });
    });
  }

  function syncSegmented(group, value) {
    document.querySelectorAll('[data-k-group="' + group + '"] button').forEach(function (b) {
      var on = b.dataset.k === value;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
  }

  /* Prompt selectors grouped by figure set. */
  function buildPromptSelect(select) {
    var groups = {};
    SAMPLES.forEach(function (s, i) {
      if (!groups[s.set]) {
        groups[s.set] = document.createElement("optgroup");
        groups[s.set].label = SET_LABELS[s.set] || s.set;
        select.appendChild(groups[s.set]);
      }
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = s.category + ": " + s.prompt;
      groups[s.set].appendChild(opt);
    });
    select.addEventListener("change", function () {
      setPrompt(parseInt(select.value, 10));
    });
  }

  function renderViewers() {
    var s = SAMPLES[state.promptIndex];
    if (!s) {
      return;
    }
    $("prompt-select").value = String(state.promptIndex);
    $("prompt-select-2").value = String(state.promptIndex);
    syncSegmented("viewer", state.k);
    syncSegmented("compare", state.k);

    var t = $("viewer-teacher");
    var st = $("viewer-student");
    t.src = imgPath(s, "teacher");
    t.alt = altText(s, "teacher");
    st.src = imgPath(s, state.k);
    st.alt = altText(s, state.k);
    $("viewer-student-cap").textContent = "Dooop, K = " + state.k;
    $("viewer-prompt").textContent = s.category + ": “" + s.prompt + "”";

    var ot = $("overlay-teacher");
    var os = $("overlay-student");
    ot.src = imgPath(s, "teacher");
    ot.alt = altText(s, "teacher");
    os.src = imgPath(s, state.k);
    os.alt = altText(s, state.k) + ", drawn on top of the teacher sample";
    $("overlay-k-end").textContent = "Dooop, K = " + state.k;
  }

  function setPrompt(i) {
    state.promptIndex = i;
    renderViewers();
  }

  function setK(k) {
    state.k = k;
    renderViewers();
  }

  /* Overlay opacity slider. */
  function initOpacity() {
    var input = $("opacity");
    var out = $("opacity-out");
    function apply() {
      state.opacity = parseInt(input.value, 10);
      $("overlay-student").style.opacity = String(state.opacity / 100);
      out.textContent = state.opacity + "%";
      input.setAttribute("aria-valuetext", state.opacity + "% Dooop");
    }
    input.addEventListener("input", apply);
    apply();
  }

  /* Gallery of all prompts at one K. */
  function renderGallery() {
    syncSegmented("gallery", state.galleryK);
    var grid = $("gallery-grid");
    if (!grid.children.length) {
      SAMPLES.forEach(function (s, i) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.innerHTML = '<span class="media"><img loading="lazy" width="285" height="285"></span>' +
          '<span class="tile-text"><span class="tile-cat"></span><span class="tile-prompt"></span></span>';
        b.querySelector(".tile-cat").textContent = s.category;
        b.querySelector(".tile-prompt").textContent = s.prompt;
        b.addEventListener("click", function () {
          setPrompt(i);
          $("loops").scrollIntoView();
          $("prompt-select").focus({ preventScroll: true });
        });
        li.appendChild(b);
        grid.appendChild(li);
      });
    }
    Array.prototype.forEach.call(grid.querySelectorAll("button"), function (b, i) {
      var s = SAMPLES[i];
      var img = b.querySelector("img");
      img.src = imgPath(s, state.galleryK);
      img.alt = altText(s, state.galleryK);
      b.setAttribute("aria-label", "Open in viewer: " + s.category + ", " + s.prompt + ", K = " + state.galleryK);
    });
  }

  /* Hero reel: Teacher, then K = 1 ... 16, looping. */
  function initReel() {
    var sample = SAMPLES.filter(function (s) { return s.id === REEL_SAMPLE_ID; })[0] || SAMPLES[0];
    if (!sample) {
      return;
    }
    var img = $("reel-img");
    var label = $("reel-label");
    var toggle = $("reel-toggle");
    var steps = $("reel-steps");
    var frame = 0;
    var timer = null;

    REEL_FRAMES.forEach(function (key) {
      var pre = new Image();
      pre.src = imgPath(sample, key);
      var li = document.createElement("li");
      li.textContent = frameName(key);
      steps.appendChild(li);
    });
    $("reel-prompt").textContent = "“" + sample.prompt + "”";

    function show(i) {
      frame = i;
      var key = REEL_FRAMES[i];
      img.src = imgPath(sample, key);
      img.alt = altText(sample, key);
      label.textContent = frameName(key);
      Array.prototype.forEach.call(steps.children, function (li, j) {
        li.classList.toggle("is-active", j === i);
      });
    }

    function play() {
      if (timer) {
        return;
      }
      timer = window.setInterval(function () {
        show((frame + 1) % REEL_FRAMES.length);
      }, REEL_INTERVAL_MS);
      toggle.textContent = "Pause";
      toggle.setAttribute("aria-pressed", "true");
      toggle.setAttribute("aria-label", "Pause the reel");
    }

    function pause() {
      window.clearInterval(timer);
      timer = null;
      toggle.textContent = "Play";
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "Play the reel");
    }

    toggle.addEventListener("click", function () {
      if (timer) {
        pause();
      } else {
        play();
      }
    });

    show(0);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      pause();
    } else {
      play();
    }
  }

  /* Compute bars: width proportional to the largest value. */
  function initBars() {
    var fills = document.querySelectorAll(".bar-fill[data-value]");
    var max = 0;
    fills.forEach(function (f) {
      max = Math.max(max, parseFloat(f.dataset.value));
    });
    window.requestAnimationFrame(function () {
      fills.forEach(function (f) {
        f.style.width = (parseFloat(f.dataset.value) / max * 100) + "%";
      });
    });
  }

  /* Floating back-to-top and current-section highlight in the nav. */
  function initScrollUi() {
    var toTop = $("to-top");
    function onScroll() {
      toTop.hidden = window.scrollY < 600;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!("IntersectionObserver" in window)) {
      return;
    }
    var links = {};
    document.querySelectorAll(".topnav li a").forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = links[entry.target.id];
        if (a && entry.isIntersecting) {
          Object.keys(links).forEach(function (id) {
            links[id].classList.remove("is-current");
            links[id].removeAttribute("aria-current");
          });
          a.classList.add("is-current");
          a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) {
      var el = $(id);
      if (el) {
        observer.observe(el);
      }
    });
  }

  function init() {
    initImageFallback();
    buildPromptSelect($("prompt-select"));
    buildPromptSelect($("prompt-select-2"));
    buildSegmented("viewer", function () { return state.k; }, setK);
    buildSegmented("compare", function () { return state.k; }, setK);
    buildSegmented("gallery", function () { return state.galleryK; }, function (k) {
      state.galleryK = k;
      renderGallery();
    });
    renderViewers();
    initOpacity();
    renderGallery();
    initReel();
    initBars();
    initScrollUi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
