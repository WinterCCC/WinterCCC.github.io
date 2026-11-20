/* Step lists of the two method diagrams, shared by the page player (anim.js) and the promo video timeline.
   Step i of a list belongs to <g data-step="i"> of its SVG (built by dooop_build/v2/build_diagrams.py).
   title: short label (progress buttons, video caption); caption: the full sentence under the figure. */
window.DOOOP_ANIM = {
  train: {
    src: "assets/figures/train-build.svg",
    summary: "<b>Training pipeline:</b> the looped student learns from noisy data states and rollout states, and the output after every round is regressed to its per-round target.",
    steps: [
      { title: "Start from a frozen teacher",
        caption: "<b>Teacher:</b> training starts from a frozen, pretrained, non-looped diffusion transformer with <i>L</i> blocks." },
      { title: "Input blocks <i>P</i>",
        caption: "<b>Input blocks <i>P</i>:</b> the looped student copies its input blocks from the teacher." },
      { title: "Shared looped blocks <i>R</i><sub>&theta;</sub>",
        caption: "<b>Looped blocks <i>R</i><sub>&theta;</sub>:</b> the middle of the teacher becomes a small set of shared blocks that run again and again." },
      { title: "Output blocks <i>Q</i>",
        caption: "<b>Output blocks <i>Q</i>:</b> the output blocks and the output layer close the student. Every student block is initialized from a teacher block." },
      { title: "Noisy data states",
        caption: "<b>Noisy data states:</b> <i>x<sub>t</sub></i> is built from real data <i>x</i><sub>1</sub> and noise <i>x</i><sub>0</sub>." },
      { title: "Teacher and student as samplers",
        caption: "<b>Samplers:</b> the frozen teacher and the current student, used without gradient, drive a sampler." },
      { title: "Rollout states",
        caption: "<b>Rollout states:</b> sampling with <i>v</i><sub>roll</sub> gives the states the student meets when it generates images." },
      { title: "Mix into one batch",
        caption: "<b>Batch:</b> a fraction 1 &minus; &rho; of each batch comes from data states and a fraction &rho; from rollout states." },
      { title: "The batch enters the student",
        caption: "<b>Student input:</b> the batch gives the noisy input <i>x<sub>t</sub></i> of the student forward pass." },
      { title: "<i>P</i> maps <i>x<sub>t</sub></i> to <i>h</i><sub>0</sub>",
        caption: "<b>Depth 0:</b> the input blocks <i>P</i> map <i>x<sub>t</sub></i> to the hidden state <i>h</i><sub>0</sub> at depth <i>s</i><sub>0</sub> = 0." },
      { title: "Output before round 1",
        caption: "<b>Before round 1:</b> <i>Q</i> reads <i>h</i><sub>0</sub> out as <i>v</i><sub>&theta;</sub><sup>(0)</sup>, which is regressed to the frozen teacher's <i>v</i><sup>T</sup> with weight &lambda;<sub>0</sub>." },
      { title: "Round 1",
        caption: "<b>Round 1:</b> <i>R</i><sub>&theta;</sub> moves <i>h</i><sub>0</sub> by the depth step &Delta;<i>s</i><sub>1</sub>, and the bypass keeps 1 &minus; &Delta;<i>s</i><sub>1</sub> of it, which gives <i>h</i><sub>1</sub>." },
      { title: "Per-round target",
        caption: "<b>Per-round target:</b> the target of <i>v</i><sub>&theta;</sub><sup>(1)</sup> mixes the previous output, without gradient, and the teacher <i>v</i><sup>T</sup> with weights 1 &minus; <i>a</i><sub>1</sub> and <i>a</i><sub>1</sub>." },
      { title: "Round 2, same blocks",
        caption: "<b>Round 2:</b> the same shared blocks run again, and <i>v</i><sub>&theta;</sub><sup>(2)</sup> gets its own target." },
      { title: "Last round <i>K</i> reaches the teacher",
        caption: "<b>Round <i>K</i>:</b> the last round reaches depth <i>s<sub>K</sub></i> = 1, and its target is the teacher <i>v</i><sup>T</sup> itself." },
      { title: "Legend",
        caption: "<b>Legend:</b> solid arrows are the forward pass, dashed arrows carry no gradient, gray arrows come from the frozen teacher, and red lines are loss terms." }
    ]
  },
  infer: {
    src: "assets/figures/infer-build.svg",
    summary: "<b>Loop guidance:</b> one forward pass gives a strong and a weak prediction, and the sampler step extrapolates from the weak one past the strong one.",
    steps: [
      { title: "Input to <i>P</i>",
        caption: "<b>Input:</b> at one sampling step, <i>x<sub>t</sub></i>, <i>t</i> and the prompt <i>c</i> enter the input blocks <i>P</i>." },
      { title: "Rounds 1 to <i>k</i>",
        caption: "<b>Rounds 1 to <i>k</i>:</b> the shared blocks <i>R</i><sub>&theta;</sub> run <i>k</i> rounds along the depth axis." },
      { title: "Weak prediction after round <i>k</i>",
        caption: "<b>Weak prediction:</b> after round <i>k</i>, one extra application of <i>Q</i> gives <i>v</i><sub>&theta;</sub><sup>(<i>k</i>)</sup> inside the same forward pass." },
      { title: "Strong prediction after round <i>K</i>",
        caption: "<b>Strong prediction:</b> the forward pass continues to round <i>K</i>, and <i>Q</i> gives <i>v</i><sub>&theta;</sub><sup>(<i>K</i>)</sup>." },
      { title: "The weak prediction",
        caption: "<b>Weak model:</b> <i>v</i><sub>&theta;</sub><sup>(<i>k</i>)</sup> serves as <i>v</i><sub>weak</sub>." },
      { title: "Alternative: a separate <i>k</i>-loop pass",
        caption: "<b>Alternative:</b> a separate forward pass with <i>k</i> loops on its own depth grid <i>s<sub>j</sub></i> = <i>j</i>/<i>k</i> can give <i>v</i><sub>weak</sub> instead." },
      { title: "Loop guidance",
        caption: "<b>Loop guidance:</b> <i>v</i><sub>lg</sub> extrapolates from <i>v</i><sub>weak</sub> past the strong prediction <i>v</i><sub>&theta;</sub><sup>(<i>K</i>)</sup>." },
      { title: "Sampler step",
        caption: "<b>Sampler step:</b> the sampler moves <i>x<sub>t</sub></i> to the next noise level with <i>v</i><sub>lg</sub>." },
      { title: "Guidance scale <i>w</i><sub>l</sub>",
        caption: "<b>Guidance scale:</b> <i>w</i><sub>l</sub> &gt; 1 applies loop guidance, and <i>w</i><sub>l</sub> = 1 recovers plain sampling." }
    ]
  }
};
