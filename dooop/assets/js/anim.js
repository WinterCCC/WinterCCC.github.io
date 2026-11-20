/* Dooop method animations: the method diagrams are built up step by step in data-flow order.
   DooopBuild (mount, render, stepBox) is shared by the page player below and the promo video timeline. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var HL_PAD = 8;

  function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }

  /* ------------------------------------------------------------------ shared renderer */

  /* Inline the SVG markup into container and index its steps and pieces. */
  function mount(container, svgText) {
    container.innerHTML = svgText;
    var svg = container.querySelector("svg");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    var layer = svg.querySelector(".hl-layer");
    var steps = Array.prototype.map.call(svg.querySelectorAll("[data-step]"), function (g) {
      var pieces = Array.prototype.map.call(g.children, function (el) {
        var isArrow = el.classList.contains("arr");
        return { el: el, arrow: isArrow, dashed: el.classList.contains("dash"),
          line: isArrow ? el.querySelector(".ln") : null, head: isArrow ? el.querySelector(".hd") : null };
      });
      return { g: g, pieces: pieces, box: null };
    });
    var hl = document.createElementNS(NS, "rect");
    hl.setAttribute("class", "hl");
    hl.setAttribute("rx", "10");
    layer.appendChild(hl);
    var fig = { svg: svg, steps: steps, hl: hl, n: steps.length };
    steps.forEach(function (s) {
      s.box = unionBox(s.pieces.filter(function (p) { return !p.el.classList.contains("nohl"); }));
      if (!s.box) {
        s.box = unionBox(s.pieces);
      }
    });
    render(fig, 0, -1);
    return fig;
  }

  function unionBox(pieces) {
    var b = null;
    pieces.forEach(function (p) {
      var r = p.el.getBBox();
      if (!r.width && !r.height) {
        return;
      }
      if (!b) {
        b = { x0: r.x, y0: r.y, x1: r.x + r.width, y1: r.y + r.height };
      } else {
        b.x0 = Math.min(b.x0, r.x);
        b.y0 = Math.min(b.y0, r.y);
        b.x1 = Math.max(b.x1, r.x + r.width);
        b.y1 = Math.max(b.y1, r.y + r.height);
      }
    });
    return b && { x: b.x0 - HL_PAD, y: b.y0 - HL_PAD, width: b.x1 - b.x0 + 2 * HL_PAD, height: b.y1 - b.y0 + 2 * HL_PAD };
  }

  /* Reveal progress p in [0, 1] of one piece: arrows draw along their direction, the head comes last;
     other pieces fade in. Hidden pieces have opacity 0 (nothing is dimmed). */
  function setPiece(p, v) {
    if (p.arrow && !p.dashed) {
      var u = clamp01(v / 0.85);
      p.el.style.opacity = v > 0 ? 1 : 0;
      p.line.style.strokeDasharray = "1 1";
      p.line.style.strokeDashoffset = String(1 - u);
      if (p.head) {
        p.head.style.opacity = clamp01((v - 0.8) / 0.2);
      }
    } else {
      p.el.style.opacity = v;
    }
  }

  /* Pure state function. t in [0, n]: steps below floor(t) are complete, step floor(t) is revealed with
     progress t - floor(t), later steps are hidden. hlIndex is the highlighted step (-1: none). */
  function render(fig, t, hlIndex) {
    var cur = Math.floor(t);
    var u = t - cur;
    fig.steps.forEach(function (s, i) {
      var visible = i < cur || (i === cur && u > 0);
      s.g.style.visibility = visible ? "visible" : "hidden";
      var n = s.pieces.length;
      s.pieces.forEach(function (p, j) {
        var v;
        if (i < cur) {
          v = 1;
        } else if (i > cur) {
          v = 0;
        } else {
          var start = n > 1 ? (j / n) * 0.6 : 0;
          var len = n > 1 ? 0.4 + 0.6 / n : 1;
          v = clamp01((u - start) / len);
        }
        setPiece(p, v);
      });
    });
    var box = hlIndex >= 0 && hlIndex < fig.n ? fig.steps[hlIndex].box : null;
    if (box) {
      fig.hl.setAttribute("x", box.x);
      fig.hl.setAttribute("y", box.y);
      fig.hl.setAttribute("width", box.width);
      fig.hl.setAttribute("height", box.height);
      var a = hlIndex === cur ? clamp01(u / 0.25) : 1;
      fig.hl.style.opacity = a;
    } else {
      fig.hl.style.opacity = 0;
    }
  }

  function stepBox(fig, i) {
    return fig.steps[i].box;
  }

  window.DooopBuild = { mount: mount, render: render, stepBox: stepBox };

  /* ------------------------------------------------------------------ page player */

  var REVEAL_MS = 1100;
  var DWELL_MS = 2300;
  var HOLD_MS = 2500;
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initPlayer(root, meta) {
    var stage = root.querySelector(".build-stage");
    var scroller = root.querySelector(".build-scroll");
    var playBtn = root.querySelector(".anim-play");
    var caption = root.querySelector(".anim-caption");
    var counter = root.querySelector(".anim-counter");
    var dotsEl = root.querySelector(".anim-progress");
    var steps = meta.steps;
    var n = steps.length;
    var fig = null;
    var index = 0;
    var holding = false;
    var t0 = 0;
    var raf = 0;
    var timer = 0;
    var wantPlay = !REDUCED;
    var visible = false;

    function setButton() {
      playBtn.textContent = wantPlay ? "Pause" : "Play";
      playBtn.setAttribute("aria-pressed", wantPlay ? "true" : "false");
      playBtn.setAttribute("aria-label", (wantPlay ? "Pause" : "Play") + " the animation");
    }

    function draw() {
      raf = 0;
      if (!fig) {
        return;
      }
      if (REDUCED) {
        DooopBuild.render(fig, n, holding ? -1 : index);
        return;
      }
      if (holding) {
        DooopBuild.render(fig, n, -1);
        return;
      }
      var u = clamp01((performance.now() - t0) / REVEAL_MS);
      DooopBuild.render(fig, index + (u >= 1 ? 0.99999 : u), index);
      if (u < 1) {
        raf = window.requestAnimationFrame(draw);
      }
    }

    function scrollToStep() {
      if (!fig || scroller.scrollWidth <= scroller.clientWidth + 1) {
        return;
      }
      var box = holding ? null : DooopBuild.stepBox(fig, index);
      var scale = fig.svg.getBoundingClientRect().width / fig.svg.viewBox.baseVal.width;
      var left = box ? (box.x + box.width / 2) * scale - scroller.clientWidth / 2 : 0;
      if (box && box.width * scale > scroller.clientWidth) {
        left = box.x * scale - 8;
      }
      scroller.scrollTo({ left: Math.max(0, left), behavior: REDUCED ? "auto" : "smooth" });
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = 0;
      if (!wantPlay || !visible || REDUCED) {
        return;
      }
      var wait = holding ? HOLD_MS : Math.max(0, REVEAL_MS + DWELL_MS - (performance.now() - t0));
      timer = window.setTimeout(function () {
        if (holding) {
          go(0);
        } else if (index === n - 1) {
          hold();
        } else {
          go(index + 1);
        }
      }, wait);
    }

    function setUi() {
      Array.prototype.forEach.call(dotsEl.children, function (li, j) {
        var b = li.firstChild;
        b.classList.toggle("is-done", holding || j < index);
        if (!holding && j === index) {
          b.setAttribute("aria-current", "step");
        } else {
          b.removeAttribute("aria-current");
        }
      });
      counter.textContent = holding ? "Full figure" : "Step " + (index + 1) + " of " + n;
      caption.innerHTML = holding ? meta.summary : steps[index].caption;
    }

    function go(i) {
      holding = false;
      index = ((i % n) + n) % n;
      t0 = performance.now();
      setUi();
      if (!raf) {
        raf = window.requestAnimationFrame(draw);
      }
      scrollToStep();
      schedule();
    }

    function hold() {
      holding = true;
      setUi();
      if (!raf) {
        raf = window.requestAnimationFrame(draw);
      }
      scrollToStep();
      schedule();
    }

    steps.forEach(function (s, j) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Step " + (j + 1) + ": " + s.title);
      b.title = s.title;
      b.addEventListener("click", function () {
        go(j);
      });
      li.appendChild(b);
      dotsEl.appendChild(li);
    });

    playBtn.addEventListener("click", function () {
      wantPlay = !wantPlay;
      setButton();
      if (wantPlay && !holding && performance.now() - t0 > REVEAL_MS + DWELL_MS) {
        t0 = performance.now() - REVEAL_MS;
      }
      schedule();
    });
    root.querySelector(".anim-prev").addEventListener("click", function () {
      go(holding ? n - 1 : index - 1);
    });
    root.querySelector(".anim-next").addEventListener("click", function () {
      if (!holding && index === n - 1) {
        hold();
      } else {
        go(holding ? 0 : index + 1);
      }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var was = visible;
        visible = entries[0].isIntersecting;
        if (visible && !was && wantPlay && !holding) {
          go(index); /* replay the current step when it comes back into view */
        } else {
          schedule();
        }
      }, { threshold: 0.3 }).observe(root);
    } else {
      visible = true;
    }

    setButton();
    setUi();
    var fallback = stage.querySelector("img");
    fetch(meta.src).then(function (r) {
      if (!r.ok) {
        throw new Error(r.status);
      }
      return r.text();
    }).then(function (text) {
      fig = DooopBuild.mount(stage, text);
      fig.svg.setAttribute("aria-label", fallback ? fallback.alt : "");
      if (steps.length !== fig.n) {
        console.error("anim: " + meta.src + " has " + fig.n + " steps, captions list " + steps.length);
      }
      root.classList.add("is-ready");
      go(index);
    }).catch(function () {
      /* The full figure stays visible as a plain image; captions still step. */
      root.classList.add("is-static");
    });
  }

  function init() {
    var data = window.DOOOP_ANIM || {};
    document.querySelectorAll(".anim[data-anim]").forEach(function (root) {
      var meta = data[root.dataset.anim];
      if (meta) {
        initPlayer(root, meta);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
