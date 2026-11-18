/* Dooop method animations: step through the paper figures with a spotlight and a magnified region. */
(function () {
  "use strict";

  var DATA = window.DOOOP_ANIM || {};
  var STEP_MS = 3000;
  var MOBILE_MAX = 760;
  var ZOOM_MAX = 1.8;
  var MARGIN = 10;
  var MOBILE_MIN_PX_PER_PT = 0.92;
  var MOBILE_MAX_PX_PER_PT = 1.4;
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(v, lo, hi) {
    if (hi < lo) {
      return (lo + hi) / 2;
    }
    return Math.max(lo, Math.min(hi, v));
  }

  function place(node, left, top, width, height) {
    node.style.left = left + "px";
    node.style.top = top + "px";
    node.style.width = width + "px";
    node.style.height = height + "px";
  }

  /* Shared player: play/pause, prev/next, chips, caption, autoplay, pause when off screen. */
  function createPlayer(root, steps, render) {
    var playBtn = root.querySelector(".anim-play");
    var chipsEl = root.querySelector(".anim-chips");
    var caption = root.querySelector(".anim-caption");
    var index = 0;
    var timer = null;
    var wantPlay = !REDUCED;
    var visible = false;

    function setButton() {
      playBtn.textContent = wantPlay ? "Pause" : "Play";
      playBtn.setAttribute("aria-pressed", wantPlay ? "true" : "false");
      playBtn.setAttribute("aria-label", (wantPlay ? "Pause" : "Play") + " the animation");
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = null;
      if (wantPlay && visible) {
        timer = window.setTimeout(function () {
          go(index + 1);
        }, STEP_MS);
      }
    }

    function go(i) {
      index = ((i % steps.length) + steps.length) % steps.length;
      Array.prototype.forEach.call(chipsEl.children, function (li, j) {
        var b = li.firstChild;
        if (j === index) {
          b.setAttribute("aria-current", "step");
        } else {
          b.removeAttribute("aria-current");
        }
      });
      caption.innerHTML = steps[index].caption;
      render(index);
      schedule();
    }

    steps.forEach(function (s, j) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = s.chip;
      b.addEventListener("click", function () {
        go(j);
      });
      li.appendChild(b);
      chipsEl.appendChild(li);
    });

    playBtn.addEventListener("click", function () {
      wantPlay = !wantPlay;
      setButton();
      schedule();
    });
    root.querySelector(".anim-prev").addEventListener("click", function () {
      go(index - 1);
    });
    root.querySelector(".anim-next").addEventListener("click", function () {
      go(index + 1);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.25 }).observe(root);
    } else {
      visible = true;
    }

    setButton();
    go(0);
    return { current: function () { return index; } };
  }

  /* Spotlight on the figure plus a magnified copy of the active region. */
  function initSpotlight(root, fig) {
    var stage = root.querySelector(".spot-stage");
    var ring = root.querySelector(".spot-ring");
    var zoom = root.querySelector(".spot-zoom");
    var inner = root.querySelector(".spot-zoom-inner");
    var zoomImg = inner.querySelector("img");
    var hint = document.createElement("p");
    hint.className = "spot-hint";
    hint.textContent = "Swipe sideways to see the whole region.";
    hint.hidden = true;
    zoom.parentNode.appendChild(hint);
    var player = null;

    function layout(index) {
      var r = fig.steps[index].rect;
      var stageW = stage.clientWidth;
      if (!stageW) {
        return;
      }
      var f = stageW / fig.width;
      var stageH = fig.height * f;
      var rx = r[0] * f;
      var ry = r[1] * f;
      var rw = (r[2] - r[0]) * f;
      var rh = (r[3] - r[1]) * f;
      place(ring, rx, ry, rw, rh);

      var mobile = window.innerWidth < MOBILE_MAX;
      root.classList.toggle("is-mobile", mobile);
      var scale;
      if (mobile) {
        /* Full-width card below the figure; swipe sideways if the region is wider than the card. */
        var cardW = zoom.clientWidth;
        scale = clamp(cardW / (r[2] - r[0]), MOBILE_MIN_PX_PER_PT, MOBILE_MAX_PX_PER_PT);
        var innerW = (r[2] - r[0]) * scale;
        zoom.style.left = "";
        zoom.style.top = "";
        zoom.style.width = "";
        zoom.style.height = (r[3] - r[1]) * scale + "px";
        inner.style.width = innerW + "px";
        inner.style.height = (r[3] - r[1]) * scale + "px";
        zoom.scrollLeft = 0;
        hint.hidden = innerW <= cardW + 1;
      } else {
        var z = Math.min(ZOOM_MAX, (stageW - 2 * MARGIN) / rw, (stageH - 2 * MARGIN) / rh);
        z = Math.max(z, 1);
        var w = rw * z;
        var h = rh * z;
        var left = clamp(rx + rw / 2 - w / 2, MARGIN, stageW - w - MARGIN);
        var top = clamp(ry + rh / 2 - h / 2, MARGIN, stageH - h - MARGIN);
        place(zoom, left, top, w, h);
        inner.style.width = "";
        inner.style.height = "";
        hint.hidden = true;
        scale = f * z;
      }
      zoomImg.style.width = fig.width * scale + "px";
      zoomImg.style.left = -r[0] * scale + "px";
      zoomImg.style.top = -r[1] * scale + "px";
    }

    player = createPlayer(root, fig.steps, layout);

    var relayout = function () {
      root.classList.add("no-anim");
      layout(player.current());
      void root.offsetWidth;
      root.classList.remove("no-anim");
    };
    if ("ResizeObserver" in window) {
      new ResizeObserver(relayout).observe(stage);
    } else {
      window.addEventListener("resize", relayout);
    }
    root.querySelector(".spot-base").addEventListener("load", relayout);
  }

  function init() {
    document.querySelectorAll(".anim[data-anim]").forEach(function (root) {
      var fig = DATA[root.dataset.anim];
      if (fig) {
        initSpotlight(root, fig);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
