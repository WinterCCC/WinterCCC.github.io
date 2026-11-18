/* Dooop method animations: training and inference, step by step (inline SVG, vanilla JS). */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var STEP_MS = 2500;
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
  var SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

  function sub(n) {
    return String(n).split("").map(function (d) { return SUB[+d]; }).join("");
  }

  function sup(n) {
    return "⁽" + String(n).split("").map(function (d) { return SUP[+d]; }).join("") + "⁾";
  }

  /* Create an SVG element with attributes; optional text content (may contain tspans). */
  function el(tag, attrs, parent, markup) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      node.setAttribute(k, attrs[k]);
    });
    if (markup !== undefined) {
      node.innerHTML = markup;
    }
    if (parent) {
      parent.appendChild(node);
    }
    return node;
  }

  function defs(svg, id) {
    var d = el("defs", {}, svg);
    ["", "-a"].forEach(function (suffix) {
      var m = el("marker", { id: id + suffix, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }, d);
      el("path", { d: "M0 0 L10 5 L0 10 z", "class": suffix ? "mk-accent" : "mk" }, m);
    });
    return d;
  }

  function arrow(parent, d, id, cls) {
    return el("path", { d: d, "class": "wire " + (cls || ""), "marker-end": "url(#" + id + ")" }, parent);
  }

  function box(parent, x, y, w, h, label, cls) {
    var g = el("g", { "class": "node " + (cls || "") }, parent);
    el("rect", { x: x, y: y, width: w, height: h, rx: 8 }, g);
    el("text", { x: x + w / 2, y: y + h / 2 + 5, "class": "lbl", "text-anchor": "middle" }, g, label);
    return g;
  }

  function star(parent, cx, cy, r, cls) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var rr = i % 2 ? r * 0.45 : r;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return el("polygon", { points: pts.join(" "), "class": cls || "star" }, parent);
  }

  function hint(layer, text) {
    el("text", { x: 120, y: 126, "class": "tiny", "text-anchor": "middle" }, layer, text);
  }

  /* Hide a zero-length depth segment so its round cap does not show as a dot. */
  function segVisibility(seg) {
    seg.style.visibility = seg.getAttribute("x1") === seg.getAttribute("x2") ? "hidden" : "visible";
  }

  /* Shared player: play/pause, prev/next, chips, caption, autoplay, pause when off screen. */
  function createPlayer(root, opts) {
    var playBtn = root.querySelector(".anim-play");
    var chipsEl = root.querySelector(".anim-chips");
    var caption = root.querySelector(".anim-caption");
    var steps = [];
    var index = 0;
    var timer = null;
    var wantPlay = !REDUCED;
    var visible = false;

    function setButton() {
      var playing = wantPlay;
      playBtn.textContent = playing ? "Pause" : "Play";
      playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      playBtn.setAttribute("aria-label", (playing ? "Pause" : "Play") + " the animation");
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = null;
      if (wantPlay && visible) {
        timer = window.setTimeout(function () {
          go(index + 1, true);
        }, STEP_MS);
      }
    }

    function go(i, auto) {
      var n = steps.length;
      var wrapped = i >= n;
      index = ((i % n) + n) % n;
      if (wrapped && opts.onCycle) {
        opts.onCycle();
      }
      Array.prototype.forEach.call(chipsEl.children, function (li, j) {
        var b = li.firstChild;
        if (j === index) {
          b.setAttribute("aria-current", "step");
        } else {
          b.removeAttribute("aria-current");
        }
      });
      caption.innerHTML = steps[index].caption;
      opts.render(index, steps[index], !!auto);
      schedule();
    }

    function rebuild(keep) {
      steps = opts.steps();
      chipsEl.innerHTML = "";
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
      var target = 0;
      if (keep) {
        target = keep(steps);
      }
      go(Math.max(0, Math.min(target, steps.length - 1)));
    }

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
    return {
      rebuild: rebuild,
      go: go,
      current: function () { return steps[index]; }
    };
  }

  /* ---------------- Training animation ---------------- */
  function initTraining(root) {
    var main = root.querySelector(".anim-main");
    var side = root.querySelector(".anim-side");
    var K = 4;
    main.setAttribute("viewBox", "0 0 520 300");
    side.setAttribute("viewBox", "0 0 240 240");
    defs(main, "tr-arr");
    defs(side, "tr-arr-s");

    /* Sources and the training state. */
    var srcData = box(main, 8, 10, 126, 32, "Noisy data state", "src");
    var srcRoll = box(main, 8, 56, 126, 32, "Rollout state", "src");
    var wData = arrow(main, "M134 26 C150 26 152 40 162 44", "tr-arr");
    var wRoll = arrow(main, "M134 72 C150 72 152 56 162 52", "tr-arr");
    var lData = el("text", { x: 140, y: 20, "class": "tiny" }, main, "1 − ρ");
    var lRoll = el("text", { x: 146, y: 90, "class": "tiny" }, main, "ρ");
    var xt = el("g", { "class": "node round" }, main);
    el("circle", { cx: 180, cy: 48, r: 17 }, xt);
    el("text", { x: 180, y: 53, "class": "lbl", "text-anchor": "middle" }, xt, "x<tspan class=\"sub\" dy=\"4\">t</tspan>");

    /* Frozen teacher. */
    var teacher = el("g", { "class": "node teacher" }, main);
    for (var i = 0; i < 10; i++) {
      el("rect", { x: 222 + i * 15, y: 32, width: 11, height: 32, rx: 3 }, teacher);
    }
    el("text", { x: 296, y: 24, "class": "tiny", "text-anchor": "middle" }, teacher, "Frozen teacher (non-looped)");
    var lock = el("g", { "class": "lock" }, teacher);
    el("rect", { x: 373, y: 44, width: 12, height: 10, rx: 2 }, lock);
    el("path", { d: "M375.5 44 v-3 a3.5 3.5 0 0 1 7 0 v3", fill: "none" }, lock);
    var wTeach = arrow(main, "M197 48 L216 48", "tr-arr");
    var wVT = arrow(main, "M390 48 L414 48", "tr-arr");
    var vtStar = star(main, 428, 48, 12, "star");
    el("text", { x: 446, y: 53, "class": "lbl" }, main, "vᵀ");

    /* Student: P, shared R_theta with a loop arc, Q, per-loop output. */
    var wDown = arrow(main, "M180 66 L180 124", "tr-arr");
    var P = box(main, 158, 128, 46, 44, "P", "stu");
    var wPR = arrow(main, "M204 150 L236 150", "tr-arr");
    var h0Lbl = el("text", { x: 220, y: 143, "class": "tiny", "text-anchor": "middle" }, main, "h" + sub(0));
    var R = box(main, 240, 120, 92, 60, "R<tspan class=\"sub\" dy=\"4\">θ</tspan>", "stu shared");
    el("text", { x: 286, y: 194, "class": "tiny", "text-anchor": "middle" }, main, "shared block");
    var arc = arrow(main, "M318 120 C318 92 254 92 254 116", "tr-arr", "loop-arc");
    var loopLbl = el("text", { x: 286, y: 88, "class": "tiny strong", "text-anchor": "middle" }, main, "");
    var wRQ = arrow(main, "M332 150 L362 150", "tr-arr");
    var hkLbl = el("text", { x: 347, y: 143, "class": "tiny", "text-anchor": "middle" }, main, "");
    var Q = box(main, 366, 128, 46, 44, "Q", "stu");
    var wQV = arrow(main, "M412 150 L430 150", "tr-arr");
    var vOut = el("g", { "class": "node round out" }, main);
    el("circle", { cx: 452, cy: 150, r: 20 }, vOut);
    var vOutLbl = el("text", { x: 452, y: 155, "class": "lbl", "text-anchor": "middle" }, vOut, "");
    var bypass = arrow(main, "M181 172 L181 204 L389 204 L389 176", "tr-arr", "dashed");
    var bypassLbl = el("text", { x: 285, y: 218, "class": "tiny", "text-anchor": "middle" }, main, "Q reads h" + sub(0) + " before any loop");
    el("text", { x: 470, y: 114, "class": "tiny muted", "text-anchor": "middle" }, main, "per-loop output");

    /* Depth bar. */
    var depth = el("g", { "class": "depth" }, main);
    var X0 = 70;
    var X1 = 450;
    var DY = 252;
    el("text", { x: 14, y: DY + 4, "class": "tiny" }, depth, "depth s");
    el("line", { x1: X0, y1: DY, x2: X1, y2: DY, "class": "axis" }, depth);
    var seg = el("line", { x1: X0, y1: DY, x2: X0, y2: DY, "class": "seg" }, depth);
    var ticks = el("g", {}, depth);

    /* Loss line. */
    var loss = el("text", { x: 260, y: 292, "class": "tiny strong", "text-anchor": "middle" }, main,
      "loss = λ" + sub(0) + "‖v" + sup(0) + " − vᵀ‖² + mean over k of ‖v⁽ᵏ⁾ − v̂⁽ᵏ⁾‖²");

    /* Velocity panel. */
    el("rect", { x: 1, y: 1, width: 238, height: 238, rx: 10, "class": "panel" }, side);
    el("text", { x: 14, y: 24, "class": "tiny strong" }, side, "Velocity space");
    var vLayer = el("g", {}, side);

    var s = [];
    var pts = [];
    var VT = { x: 196, y: 58 };

    function newSample() {
      var inner;
      do {
        inner = [Math.random(), Math.random(), Math.random()].sort();
      } while (inner[0] < 0.1 || inner[1] - inner[0] < 0.12 || inner[2] - inner[1] < 0.12 || inner[2] > 0.9);
      s = [0].concat(inner, [1]);
      var v = [{ x: 34 + Math.random() * 22, y: 176 + Math.random() * 30 }];
      var tg = [null];
      for (var k = 1; k <= K; k++) {
        var a = (s[k] - s[k - 1]) / (1 - s[k - 1]);
        var prev = v[k - 1];
        var t = { x: prev.x + a * (VT.x - prev.x), y: prev.y + a * (VT.y - prev.y), a: a };
        tg.push(t);
        var jitter = k === K ? 5 : 9;
        v.push({ x: t.x + (Math.random() - 0.5) * 2 * jitter, y: t.y + (Math.random() - 0.5) * 2 * jitter });
      }
      pts = { v: v, t: tg };
      ticks.innerHTML = "";
      for (var j = 0; j <= K; j++) {
        var x = X0 + s[j] * (X1 - X0);
        el("line", { x1: x, y1: DY - 8, x2: x, y2: DY + 8, "class": "tick", "data-k": j }, ticks);
        el("text", { x: x, y: DY + 24, "class": "tiny", "text-anchor": "middle", "data-k": j }, ticks, "s" + sub(j));
      }
    }

    function drawVelocity(step) {
      vLayer.innerHTML = "";
      if (step < 1) {
        hint(vLayer, "Targets appear once the teacher runs");
        return;
      }
      star(vLayer, VT.x, VT.y, 10, "star");
      el("text", { x: VT.x + 13, y: VT.y + 4, "class": "tiny" }, vLayer, "vᵀ");
      if (step < 3) {
        return;
      }
      var v = pts.v;
      var lastK = step >= 8 ? K : Math.max(0, step - 3);
      var isLoss = step === 8;
      el("line", { x1: v[0].x, y1: v[0].y, x2: VT.x, y2: VT.y, "class": isLoss ? "err" : (step === 3 ? "guide on" : "guide") }, vLayer);
      if (step === 3) {
        el("text", { x: (v[0].x + VT.x) / 2 - 22, y: (v[0].y + VT.y) / 2 + 2, "class": "tiny" }, vLayer, "λ" + sub(0));
      }
      el("circle", { cx: v[0].x, cy: v[0].y, r: 5, "class": "dot" }, vLayer);
      el("text", { x: v[0].x - 6, y: v[0].y + 20, "class": "tiny" }, vLayer, "v" + sup(0));
      for (var k = 1; k <= lastK; k++) {
        var t = pts.t[k];
        var current = k === lastK && !isLoss;
        if (current) {
          el("line", { x1: v[k - 1].x, y1: v[k - 1].y, x2: VT.x, y2: VT.y, "class": "guide" }, vLayer);
        }
        if (isLoss) {
          el("line", { x1: v[k].x, y1: v[k].y, x2: t.x, y2: t.y, "class": "err" }, vLayer);
        }
        el("line", { x1: v[k - 1].x, y1: v[k - 1].y, x2: v[k].x, y2: v[k].y, "class": "trail" }, vLayer);
        el("circle", { cx: t.x, cy: t.y, r: 7, "class": "target" + (current ? " on" : "") }, vLayer);
        el("circle", { cx: v[k].x, cy: v[k].y, r: 4.5, "class": "dot" + (current ? " on" : "") }, vLayer);
        if (current) {
          el("text", { x: t.x - 34, y: t.y - 10, "class": "tiny strong" }, vLayer, "v̂" + sup(k));
          el("text", { x: v[k].x + 12, y: v[k].y + 24, "class": "tiny" }, vLayer, "v" + sup(k));
        }
      }
    }

    var CHIPS = ["State", "Teacher", "Depth grid", "Before loop", "Loop 1", "Loop 2", "Loop 3", "Loop 4", "Loss"];

    function steps() {
      var list = [
        "<b>Pick a training state:</b> x<sub>t</sub> is a noisy data state with probability 1 &minus; &rho;, otherwise a rollout state from a sampler that combines the teacher and the current student, regenerated at every training step.",
        "<b>Frozen teacher:</b> the deep non-looped teacher maps x<sub>t</sub> to its velocity v<sup>T</sup>; every block of the student was initialized from a teacher block.",
        "<b>Random depth grid:</b> s<sub>1</sub> &lt; s<sub>2</sub> &lt; s<sub>3</sub> are sorted random draws between 0 and 1, with s<sub>0</sub> = 0 and s<sub>4</sub> = 1, drawn anew for every sample.",
        "<b>Before any loop:</b> P gives h<sub>0</sub>, and Q reads it as v<sup>(0)</sup>, which is regressed directly on v<sup>T</sup> with weight &lambda;<sub>0</sub>."
      ];
      for (var k = 1; k <= K; k++) {
        var txt = "<b>Loop " + k + ":</b> the shared block R<sub>&theta;</sub> takes a relaxed step of size s<sub>" + k + "</sub> &minus; s<sub>" + (k - 1) + "</sub>, and Q gives v<sup>(" + k + ")</sup>, trained toward the target v&#770;<sup>(" + k + ")</sup> a fraction a<sub>" + k + "</sub> of the way from stop-gradient v<sup>(" + (k - 1) + ")</sup> to v<sup>T</sup>";
        txt += k === K ? "; here a<sub>" + k + "</sub> = 1, so the target is v<sup>T</sup> itself." : ".";
        list.push(txt);
      }
      list.push("<b>Loss and update:</b> the per-loop errors (dashed) sum into the loss, and one gradient step updates P, R<sub>&theta;</sub> and Q while the teacher stays frozen.");
      return list.map(function (c, j) { return { chip: CHIPS[j], caption: c }; });
    }

    var all = [srcData, srcRoll, wData, wRoll, lData, lRoll, xt, teacher, wTeach, wVT, vtStar, wDown, P, wPR, h0Lbl, R, arc, loopLbl, wRQ, hkLbl, Q, wQV, vOut, bypass, bypassLbl, depth, loss];

    function render(step) {
      all.forEach(function (n) {
        n.classList.remove("is-on", "pulse");
        n.classList.add("is-dim");
      });
      function on() {
        Array.prototype.forEach.call(arguments, function (n) {
          n.classList.remove("is-dim");
          n.classList.add("is-on");
        });
      }
      function show() {
        Array.prototype.forEach.call(arguments, function (n) {
          n.classList.remove("is-dim");
        });
      }
      bypass.style.visibility = step === 3 ? "visible" : "hidden";
      bypassLbl.style.visibility = step === 3 ? "visible" : "hidden";
      loss.style.visibility = step === 8 ? "visible" : "hidden";
      loopLbl.textContent = "";
      hkLbl.textContent = "";
      vOutLbl.textContent = "v";
      seg.setAttribute("x1", X0);
      seg.setAttribute("x2", X0);
      ticks.querySelectorAll("[data-k]").forEach(function (t) {
        t.classList.remove("is-on");
      });

      if (step === 0) {
        on(srcData, srcRoll, wData, wRoll, lData, lRoll, xt);
      } else if (step === 1) {
        on(xt, wTeach, teacher, wVT, vtStar);
      } else if (step === 2) {
        on(depth);
        show(vtStar);
        ticks.querySelectorAll("[data-k]").forEach(function (t) {
          t.classList.add("is-on");
        });
      } else if (step === 3) {
        on(xt, wDown, P, bypass, bypassLbl, Q, wQV, vOut);
        show(vtStar, depth);
        vOutLbl.textContent = "v" + sup(0);
        ticks.querySelectorAll('[data-k="0"]').forEach(function (t) { t.classList.add("is-on"); });
      } else if (step >= 4 && step <= 7) {
        var k = step - 3;
        on(R, arc, loopLbl, wRQ, hkLbl, Q, wQV, vOut, depth);
        show(P, wPR, h0Lbl, vtStar);
        loopLbl.textContent = "loop " + k + " of " + K;
        hkLbl.textContent = "h" + sub(k);
        vOutLbl.textContent = "v" + sup(k);
        seg.setAttribute("x1", X0 + s[k - 1] * (X1 - X0));
        seg.setAttribute("x2", X0 + s[k] * (X1 - X0));
        ticks.querySelectorAll('[data-k="' + k + '"]').forEach(function (t) { t.classList.add("is-on"); });
      } else {
        on(loss, P, R, Q);
        show(teacher, vtStar, wPR, wRQ, wQV, vOut, depth, arc);
        [P, R, Q].forEach(function (n) { n.classList.add("pulse"); });
      }
      segVisibility(seg);
      drawVelocity(step);
    }

    newSample();
    var player = createPlayer(root, { steps: steps, render: render, onCycle: newSample });
    player.rebuild();
  }

  /* ---------------- Inference animation ---------------- */
  function initInference(root) {
    var main = root.querySelector(".anim-main");
    var side = root.querySelector(".anim-side");
    var N = 4; /* sampling steps in this schematic */
    var LEVELS = [
      { noise: 1, blur: 6 },
      { noise: 0.72, blur: 4 },
      { noise: 0.46, blur: 2.5 },
      { noise: 0.22, blur: 1 },
      { noise: 0, blur: 0 }
    ];
    var state = { K: 4, lg: true };
    var subTimers = [];
    main.setAttribute("viewBox", "0 0 520 300");
    side.setAttribute("viewBox", "0 0 240 240");
    var d = defs(main, "in-arr");
    defs(side, "in-arr-s");
    var f = el("filter", { id: "in-noise", x: "0", y: "0", width: "100%", height: "100%" }, d);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.9", numOctaves: "2", seed: "3" }, f);
    el("feColorMatrix", { type: "saturate", values: "0" }, f);
    var clip = el("clipPath", { id: "in-clip" }, d);
    el("rect", { x: 8, y: 60, width: 124, height: 124, rx: 8 }, clip);

    /* Image tile with noise overlay. */
    var tile = el("g", { "class": "tile", "clip-path": "url(#in-clip)" }, main);
    var img = el("image", { x: 8, y: 60, width: 124, height: 124, preserveAspectRatio: "xMidYMid slice", href: "assets/samples/main-1-4.jpg" }, tile);
    var noise = el("rect", { x: 8, y: 60, width: 124, height: 124, filter: "url(#in-noise)" }, tile);
    el("rect", { x: 8, y: 60, width: 124, height: 124, rx: 8, "class": "tile-frame" }, main);
    el("rect", { x: 78, y: 64, width: 50, height: 14, rx: 3, "class": "chip-bg" }, main);
    el("text", { x: 103, y: 74.5, "class": "micro", "text-anchor": "middle" }, main, "schematic");
    var tileLbl = el("text", { x: 70, y: 202, "class": "tiny", "text-anchor": "middle" }, main, "");
    el("text", { x: 70, y: 50, "class": "tiny muted", "text-anchor": "middle" }, main, "x");

    /* Student. */
    var wIn = arrow(main, "M132 122 L156 122", "in-arr");
    var P = box(main, 160, 100, 46, 44, "P", "stu");
    var wPR = arrow(main, "M206 122 L236 122", "in-arr");
    var R = box(main, 240, 92, 92, 60, "R<tspan class=\"sub\" dy=\"4\">θ</tspan>", "stu shared");
    var arc = arrow(main, "M318 92 C318 64 254 64 254 88", "in-arr", "loop-arc");
    var loopLbl = el("text", { x: 286, y: 58, "class": "tiny strong", "text-anchor": "middle" }, main, "");
    var wRQ = arrow(main, "M332 122 L362 122", "in-arr");
    var hLbl = el("text", { x: 347, y: 115, "class": "tiny", "text-anchor": "middle" }, main, "");
    var Q = box(main, 366, 100, 46, 44, "Q", "stu");
    var wQV = arrow(main, "M412 122 L430 122", "in-arr");
    var vOut = el("g", { "class": "node round out" }, main);
    el("circle", { cx: 452, cy: 122, r: 20 }, vOut);
    el("text", { x: 452, y: 127, "class": "lbl", "text-anchor": "middle" }, vOut, "v");

    /* Weak branch for loop guidance: Q applied to h_m of the same forward. */
    var weakWire = arrow(main, "M286 152 L286 182 L362 182", "in-arr", "dashed");
    var weakLbl = el("text", { x: 294, y: 200, "class": "tiny", "text-anchor": "start" }, main, "");
    var Qw = box(main, 366, 164, 46, 36, "Q", "stu weak");
    var wQW = arrow(main, "M412 182 L430 182", "in-arr", "dashed");
    var vWeak = el("g", { "class": "node round weakout" }, main);
    el("circle", { cx: 456, cy: 182, r: 22 }, vWeak);
    el("text", { x: 456, y: 186, "class": "tiny", "text-anchor": "middle" }, vWeak, "v<tspan class=\"sub\" dy=\"3\">weak</tspan>");

    /* Depth bar with the uniform grid. */
    var depth = el("g", { "class": "depth" }, main);
    var X0 = 170;
    var X1 = 450;
    var DY = 252;
    el("text", { x: 150, y: DY + 4, "class": "tiny", "text-anchor": "end" }, depth, "depth s");
    el("line", { x1: X0, y1: DY, x2: X1, y2: DY, "class": "axis" }, depth);
    var seg = el("line", { x1: X0, y1: DY, x2: X0, y2: DY, "class": "seg" }, depth);
    var ticks = el("g", {}, depth);
    var gridLbl = el("text", { x: (X0 + X1) / 2, y: DY + 30, "class": "tiny", "text-anchor": "middle" }, depth, "");

    /* Velocity panel. */
    el("rect", { x: 1, y: 1, width: 238, height: 238, rx: 10, "class": "panel" }, side);
    el("text", { x: 14, y: 24, "class": "tiny strong" }, side, "Velocity space");
    var vLayer = el("g", {}, side);

    function drawGrid() {
      ticks.innerHTML = "";
      for (var k = 0; k <= state.K; k++) {
        var x = X0 + (k / state.K) * (X1 - X0);
        el("line", { x1: x, y1: DY - 8, x2: x, y2: DY + 8, "class": "tick", "data-k": k }, ticks);
      }
      gridLbl.textContent = "uniform grid s\u2096 = k/K, step 1/K";
    }

    function setLevel(level, instant) {
      var L = LEVELS[level];
      noise.style.transition = instant || REDUCED ? "none" : "opacity 0.8s ease";
      img.style.transition = instant || REDUCED ? "none" : "filter 0.8s ease";
      noise.style.opacity = String(L.noise);
      img.style.filter = L.blur ? "blur(" + L.blur + "px)" : "none";
    }

    function drawVelocity(mode) {
      vLayer.innerHTML = "";
      if (!mode) {
        hint(vLayer, "The velocity appears once Q runs");
        return;
      }
      var O = { x: 46, y: 196 };
      var V = { x: 148, y: 102 };
      var W = { x: 92, y: 120 };
      var LG = { x: V.x + (V.x - W.x), y: V.y + (V.y - W.y) };
      el("circle", { cx: O.x, cy: O.y, r: 3.5, "class": "dot muted-dot" }, vLayer);
      el("text", { x: O.x - 6, y: O.y + 18, "class": "tiny" }, vLayer, "x");
      var useLG = state.lg && state.K > 1 && mode !== "out";
      el("line", { x1: O.x, y1: O.y, x2: V.x, y2: V.y, "class": "vec" + (useLG ? "" : " on"), "marker-end": "url(#in-arr-s" + (useLG ? "" : "-a") + ")" }, vLayer);
      el("text", { x: V.x - 16, y: V.y - 8, "class": "tiny" }, vLayer, "v");
      if (useLG) {
        el("line", { x1: O.x, y1: O.y, x2: W.x, y2: W.y, "class": "vec weakvec", "marker-end": "url(#in-arr-s)" }, vLayer);
        el("text", { x: W.x - 44, y: W.y - 8, "class": "tiny" }, vLayer, "v<tspan class=\"sub\" dy=\"3\">weak</tspan>");
        el("line", { x1: W.x, y1: W.y, x2: LG.x, y2: LG.y, "class": "guide" }, vLayer);
        el("line", { x1: O.x, y1: O.y, x2: LG.x, y2: LG.y, "class": "vec on", "marker-end": "url(#in-arr-s-a)" }, vLayer);
        el("text", { x: LG.x - 10, y: LG.y - 10, "class": "tiny strong" }, vLayer, "v<tspan class=\"sub\" dy=\"3\">lg</tspan>");
      }
    }

    function m() {
      return Math.max(1, Math.floor(state.K / 2));
    }

    function steps() {
      var K = state.K;
      var list = [
        { id: "noise", chip: "Noise", caption: "<b>Start from noise:</b> x at the first noise level t<sub>0</sub> is Gaussian noise." },
        { id: "k", chip: "Choose K", caption: "<b>Choose K at test time:</b> the depth grid is uniform, s<sub>k</sub> = k/K, so every loop is a step of 1/K and every K covers depth 0 to 1." }
      ];
      for (var k = 1; k <= K; k++) {
        list.push({ id: "loop", k: k, chip: "Loop " + k, caption: "<b>Loop " + k + " of " + K + ":</b> the shared block R<sub>&theta;</sub> moves h one step of 1/K along depth." });
      }
      list.push({ id: "out", chip: "Output", caption: "<b>Output:</b> Q reads the last hidden state h<sub>K</sub> and gives the velocity v; with classifier-free guidance, a conditional and an unconditional pass are combined." });
      if (state.lg && K > 1) {
        list.push({ id: "lg", chip: "Loop guidance", caption: "<b>Loop guidance:</b> the output after loop " + m() + " of the same forward, Q(h<sub>" + m() + "</sub>), is the weak prediction, and v<sub>lg</sub> = v + (w<sub>l</sub> &minus; 1)(v &minus; v<sub>weak</sub>) extrapolates away from it, at the cost of one extra application of Q." });
      }
      list.push({ id: "step", chip: "Denoise", caption: "<b>Denoising step:</b> x moves to the next noise level along the " + (state.lg && K > 1 ? "guided " : "") + "velocity." });
      list.push({ id: "repeat", chip: "Repeat", caption: "<b>Repeat:</b> the same forward pass runs at every sampling step, and the image becomes cleaner." });
      list.push({ id: "final", chip: "Final", caption: "<b>Final image:</b> after the last sampling step, x is the generated image." });
      return list;
    }

    var all = [wIn, P, wPR, R, arc, loopLbl, wRQ, hLbl, Q, wQV, vOut, weakWire, weakLbl, Qw, wQW, vWeak, depth];

    function clearSub() {
      subTimers.forEach(window.clearTimeout);
      subTimers = [];
    }

    function render(index, st) {
      clearSub();
      all.forEach(function (n) {
        n.classList.remove("is-on");
        n.classList.add("is-dim");
      });
      function on() {
        Array.prototype.forEach.call(arguments, function (n) {
          n.classList.remove("is-dim");
          n.classList.add("is-on");
        });
      }
      function show() {
        Array.prototype.forEach.call(arguments, function (n) {
          n.classList.remove("is-dim");
        });
      }
      var weakVisible = st.id === "lg";
      [weakWire, weakLbl, Qw, wQW, vWeak].forEach(function (n) {
        n.style.visibility = weakVisible ? "visible" : "hidden";
      });
      loopLbl.textContent = "";
      hLbl.textContent = "";
      seg.setAttribute("x1", X0);
      seg.setAttribute("x2", X0);
      ticks.querySelectorAll(".tick").forEach(function (t) { t.classList.remove("is-on"); });
      var K = state.K;

      if (st.id === "noise") {
        setLevel(0, true);
        tileLbl.textContent = "sampling step 1 of " + N;
        drawVelocity(null);
      } else if (st.id === "k") {
        on(depth);
        ticks.querySelectorAll(".tick").forEach(function (t) { t.classList.add("is-on"); });
        drawVelocity(null);
      } else if (st.id === "loop") {
        on(R, arc, loopLbl, depth);
        show(wIn, P, wPR);
        loopLbl.textContent = "loop " + st.k + " of " + K;
        hLbl.textContent = "";
        seg.setAttribute("x1", X0 + ((st.k - 1) / K) * (X1 - X0));
        seg.setAttribute("x2", X0 + (st.k / K) * (X1 - X0));
        ticks.querySelectorAll('[data-k="' + st.k + '"]').forEach(function (t) { t.classList.add("is-on"); });
        drawVelocity(null);
      } else if (st.id === "out") {
        on(wRQ, hLbl, Q, wQV, vOut);
        show(R, depth);
        hLbl.innerHTML = "h<tspan class=\"sub\" dy=\"3\">K</tspan>";
        seg.setAttribute("x2", X1);
        drawVelocity("out");
      } else if (st.id === "lg") {
        on(weakWire, weakLbl, Qw, wQW, vWeak);
        show(R, Q, wRQ, wQV, vOut, depth);
        weakLbl.innerHTML = "h<tspan class=\"sub\" dy=\"3\">" + m() + "</tspan> (loop " + m() + ")";
        seg.setAttribute("x2", X1);
        drawVelocity("lg");
      } else if (st.id === "step") {
        show(vOut);
        setLevel(1);
        tileLbl.textContent = "sampling step 1 of " + N + " done";
        drawVelocity("step");
      } else if (st.id === "repeat") {
        show(wIn, P, wPR, R, arc, wRQ, Q, wQV, vOut, depth);
        drawVelocity(null);
        setLevel(1, true);
        tileLbl.textContent = "sampling step 2 of " + N;
        [2, 3].forEach(function (lvl, j) {
          subTimers.push(window.setTimeout(function () {
            setLevel(lvl);
            tileLbl.textContent = "sampling step " + (lvl + 1) + " of " + N;
          }, REDUCED ? 0 : 400 + j * 900));
        });
        if (REDUCED) {
          setLevel(3, true);
        }
      } else {
        setLevel(4);
        tileLbl.textContent = "generated image";
        drawVelocity(null);
      }
      segVisibility(seg);
    }

    drawGrid();
    var player = createPlayer(root, { steps: steps, render: render });

    /* K selector and loop guidance toggle; keep the current phase when the step list changes. */
    var kHost = root.querySelector(".anim-k");
    [1, 2, 4, 8].forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.textContent = String(k);
      b.setAttribute("aria-label", "K = " + k);
      b.dataset.k = String(k);
      b.addEventListener("click", function () {
        setK(k);
      });
      kHost.appendChild(b);
    });

    function keepPhase(prev) {
      return function (list) {
        if (!prev) {
          return 0;
        }
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === prev.id && (prev.id !== "loop" || list[i].k === Math.min(prev.k, state.K))) {
            return i;
          }
        }
        return prev.id === "lg" ? list.map(function (x) { return x.id; }).indexOf("step") : 1;
      };
    }

    function syncK() {
      kHost.querySelectorAll("button").forEach(function (b) {
        var on = b.dataset.k === String(state.K);
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
    }

    function setK(k) {
      var prev = player.current();
      state.K = k;
      syncK();
      drawGrid();
      player.rebuild(prev && prev.id === "loop" ? keepPhase(prev) : function () { return 1; });
    }

    kHost.addEventListener("keydown", function (e) {
      var order = [1, 2, 4, 8];
      var i = order.indexOf(state.K);
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        next = order[(i + 1) % order.length];
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        next = order[(i - 1 + order.length) % order.length];
      }
      if (next !== null) {
        e.preventDefault();
        setK(next);
        kHost.querySelector('[data-k="' + next + '"]').focus();
      }
    });

    var lgBtn = root.querySelector(".anim-lg");
    lgBtn.addEventListener("click", function () {
      var prev = player.current();
      state.lg = !state.lg;
      lgBtn.setAttribute("aria-pressed", state.lg ? "true" : "false");
      lgBtn.textContent = "Loop guidance: " + (state.lg ? "on" : "off");
      player.rebuild(keepPhase(prev));
    });

    syncK();
    player.rebuild();
  }

  function init() {
    var t = document.getElementById("anim-train");
    var i = document.getElementById("anim-infer");
    if (t) {
      initTraining(t);
    }
    if (i) {
      initInference(i);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
