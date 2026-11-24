/* Dooop project page interactions (vanilla JS, no build step). */
(function () {
  "use strict";

  var SAMPLES = window.DOOOP_SAMPLES || [];
  var ASSET_ROOT = "assets/";
  /* Teacher labels per model. A sample's model follows from its set; its K options are the keys of its images. */
  var MODELS = {
    sd3: {
      name: "SD3-medium",
      teacherCaption: "Teacher (SD3-medium, 2.03B)",
      teacherEnd: "Teacher",
      teacherAlt: "Teacher (SD3-medium)"
    },
    zimage: {
      name: "Z-Image",
      teacherCaption: "Z-Image teacher",
      teacherEnd: "Z-Image teacher",
      teacherAlt: "Z-Image teacher"
    }
  };
  var MODEL_ORDER = ["sd3", "zimage"];
  var REEL_SAMPLE_ID = "main-1";
  var REEL_INTERVAL_MS = 1200;
  var SET_LABELS = {
    main: "GenEval categories",
    appcat: "GenEval object prompts",
    coco: "COCO captions",
    appa: "More GenEval prompts",
    appb: "GenEval single-object prompts",
    zimage: "Z-Image: GenEval prompts"
  };

  /* k and galleryK hold the K last chosen; a model without that K shows the nearest smaller one. */
  var state = {
    promptIndex: 0,
    k: "2",
    galleryModel: "sd3",
    galleryK: "2",
    opacity: 50
  };

  function $(id) {
    return document.getElementById(id);
  }

  function imgPath(sample, key) {
    return ASSET_ROOT + sample.images[key];
  }

  function modelOf(sample) {
    return sample.set === "zimage" ? "zimage" : "sd3";
  }

  function samplesOf(model) {
    return SAMPLES.filter(function (s) {
      return modelOf(s) === model;
    });
  }

  /* K values of one sample, ascending. */
  function kValuesOf(sample) {
    return Object.keys(sample.images).filter(function (key) {
      return key !== "teacher";
    }).sort(function (a, b) {
      return Number(a) - Number(b);
    });
  }

  /* K values that every sample of a model has. */
  function modelKValues(model) {
    var lists = samplesOf(model).map(kValuesOf);
    if (!lists.length) {
      return [];
    }
    return lists[0].filter(function (k) {
      return lists.every(function (list) {
        return list.indexOf(k) !== -1;
      });
    });
  }

  /* The wanted K if available, else the largest available K below it, else the smallest. */
  function pickK(kValues, wanted) {
    if (kValues.indexOf(wanted) !== -1) {
      return wanted;
    }
    var pick = kValues[0];
    kValues.forEach(function (k) {
      if (Number(k) <= Number(wanted)) {
        pick = k;
      }
    });
    return pick;
  }

  function frameName(key) {
    return key === "teacher" ? "Teacher" : "K = " + key;
  }

  function studentName(sample) {
    return sample.student ? "Dooop (" + sample.student + ")" : "Dooop";
  }

  function studentLabel(sample, k) {
    return studentName(sample) + ", K = " + k;
  }

  function altText(sample, key) {
    var who = key === "teacher" ? MODELS[modelOf(sample)].teacherAlt : studentName(sample) + " with K = " + key + " loops";
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

  /* Segmented controls (radiogroup with roving tabindex). options: [{value, text, label}].
     The buttons are rebuilt only when the option list changes. */
  function buildSegmented(host, options, getValue, setValue) {
    var values = options.map(function (o) {
      return o.value;
    });
    if (host.dataset.built === values.join(",")) {
      return;
    }
    host.dataset.built = values.join(",");
    host.textContent = "";
    options.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.dataset.value = o.value;
      b.textContent = o.text;
      if (o.label) {
        b.setAttribute("aria-label", o.label);
      }
      b.addEventListener("click", function () {
        setValue(o.value);
      });
      b.addEventListener("keydown", function (e) {
        var i = values.indexOf(getValue());
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          next = values[(i + 1) % values.length];
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          next = values[(i - 1 + values.length) % values.length];
        } else if (e.key === "Home") {
          next = values[0];
        } else if (e.key === "End") {
          next = values[values.length - 1];
        }
        if (next !== null) {
          e.preventDefault();
          setValue(next);
          host.querySelector('[data-value="' + next + '"]').focus();
        }
      });
      host.appendChild(b);
    });
  }

  function syncSegmented(host, value) {
    host.querySelectorAll("button").forEach(function (b) {
      var on = b.dataset.value === value;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
  }

  function kHost(group) {
    return document.querySelector('[data-k-group="' + group + '"]');
  }

  function kOptions(kValues) {
    return kValues.map(function (k) {
      return { value: k, text: k, label: "K = " + k };
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

  /* K shown in the viewer and the overlay: the chosen K, limited to the selected sample's K values. */
  function viewerK() {
    var s = SAMPLES[state.promptIndex];
    return s ? pickK(kValuesOf(s), state.k) : state.k;
  }

  function renderViewers() {
    var s = SAMPLES[state.promptIndex];
    if (!s) {
      return;
    }
    var model = MODELS[modelOf(s)];
    var k = viewerK();
    $("prompt-select").value = String(state.promptIndex);
    $("prompt-select-2").value = String(state.promptIndex);
    ["viewer", "compare"].forEach(function (group) {
      var host = kHost(group);
      buildSegmented(host, kOptions(kValuesOf(s)), viewerK, setK);
      syncSegmented(host, k);
    });

    var t = $("viewer-teacher");
    var st = $("viewer-student");
    t.src = imgPath(s, "teacher");
    t.alt = altText(s, "teacher");
    st.src = imgPath(s, k);
    st.alt = altText(s, k);
    $("viewer-teacher-cap").textContent = model.teacherCaption;
    $("viewer-student-cap").textContent = studentLabel(s, k);
    $("viewer-prompt").textContent = s.category + ": “" + s.prompt + "”";

    var ot = $("overlay-teacher");
    var os = $("overlay-student");
    ot.src = imgPath(s, "teacher");
    ot.alt = altText(s, "teacher");
    os.src = imgPath(s, k);
    os.alt = altText(s, k) + ", drawn on top of the teacher sample";
    $("overlay-teacher-end").textContent = model.teacherEnd;
    $("overlay-k-end").textContent = studentLabel(s, k);
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

  /* Gallery of all prompts of one model at one K. */
  function galleryK() {
    return pickK(modelKValues(state.galleryModel), state.galleryK);
  }

  function setGalleryK(k) {
    state.galleryK = k;
    renderGallery();
  }

  function setGalleryModel(model) {
    state.galleryModel = model;
    renderGallery();
  }

  function renderGallery() {
    var k = galleryK();
    syncSegmented($("gallery-model"), state.galleryModel);
    var host = kHost("gallery");
    buildSegmented(host, kOptions(modelKValues(state.galleryModel)), galleryK, setGalleryK);
    syncSegmented(host, k);
    var grid = $("gallery-grid");
    if (grid.dataset.model !== state.galleryModel) {
      grid.dataset.model = state.galleryModel;
      grid.textContent = "";
      SAMPLES.forEach(function (s, i) {
        if (modelOf(s) !== state.galleryModel) {
          return;
        }
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.dataset.index = String(i);
        b.innerHTML = '<span class="media"><img loading="lazy" width="285" height="285"></span>' +
          '<span class="tile-text"><span class="tile-cat"></span><span class="tile-prompt"></span></span>';
        b.querySelector(".tile-cat").textContent = s.category;
        b.querySelector(".tile-prompt").textContent = s.prompt;
        if (s.student) {
          var who = document.createElement("span");
          who.className = "tile-student";
          who.textContent = studentName(s);
          b.querySelector(".tile-text").appendChild(who);
        }
        b.addEventListener("click", function () {
          setPrompt(i);
          $("loops").scrollIntoView();
          $("prompt-select").focus({ preventScroll: true });
        });
        li.appendChild(b);
        grid.appendChild(li);
      });
    }
    grid.querySelectorAll("button").forEach(function (b) {
      var s = SAMPLES[parseInt(b.dataset.index, 10)];
      var img = b.querySelector("img");
      img.src = imgPath(s, k);
      img.alt = altText(s, k);
      b.setAttribute("aria-label", "Open in viewer: " + s.category + ", " + s.prompt + ", " + (s.student ? studentLabel(s, k) : "K = " + k));
    });
  }

  /* Hero reel: the SD3 sample REEL_SAMPLE_ID, Teacher, then K = 1 ... 16, looping. */
  function initReel() {
    var sample = SAMPLES.filter(function (s) { return s.id === REEL_SAMPLE_ID; })[0] || samplesOf("sd3")[0];
    if (!sample) {
      return;
    }
    var frames = ["teacher"].concat(kValuesOf(sample));
    var img = $("reel-img");
    var label = $("reel-label");
    var toggle = $("reel-toggle");
    var steps = $("reel-steps");
    var frame = 0;
    var timer = null;

    frames.forEach(function (key) {
      var pre = new Image();
      pre.src = imgPath(sample, key);
      var li = document.createElement("li");
      li.textContent = frameName(key);
      steps.appendChild(li);
    });
    $("reel-prompt").textContent = "“" + sample.prompt + "”";

    function show(i) {
      frame = i;
      var key = frames[i];
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
        show((frame + 1) % frames.length);
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

  /* Palette switcher: two token sets on <html data-palette>; the choice is remembered when storage works. */
  function initPalette() {
    var buttons = document.querySelectorAll("[data-palette-set]");
    function sync() {
      var current = document.documentElement.getAttribute("data-palette") || "pipeline";
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.dataset.paletteSet === current ? "true" : "false");
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        document.documentElement.setAttribute("data-palette", b.dataset.paletteSet);
        try {
          window.localStorage.setItem("dooop-palette", b.dataset.paletteSet);
        } catch (e) {}
        sync();
      });
    });
    sync();
  }

  function init() {
    initPalette();
    initImageFallback();
    buildPromptSelect($("prompt-select"));
    buildPromptSelect($("prompt-select-2"));
    buildSegmented($("gallery-model"), MODEL_ORDER.filter(function (m) {
      return samplesOf(m).length > 0;
    }).map(function (m) {
      return { value: m, text: MODELS[m].name };
    }), function () { return state.galleryModel; }, setGalleryModel);
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
