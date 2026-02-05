---
permalink: /
title: "About me"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

I am currently a research assistant at AGI Lab, Westlake University, advised by Prof. [Chi Zhang](https://icoz69.github.io/). I received my Bachelor's degree in Mathematics and Applied Mathematics from the School of Mathematical Sciences, Ocean University of China. During my undergraduate studies, I conducted research under the supervision of Prof. [Xueying Zeng](https://math.ouc.edu.cn/2017/0412/c8925a61424/page.psp) and [Furong Li](https://math.ouc.edu.cn/2020/1101/c8923a305349/page.htm).

My research interests include **Generative Models**, **Trustworthy AI**, and **Post-Training**.

You can find my CV here: [Chenru Wang's Curriculum Vitae](../assets/CV.pdf).

<style>
.news-box {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  max-height: 200px;
  overflow-y: auto;
  background: #fafafa;
}
.news-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.news-item:last-child {
  border-bottom: none;
}
.news-item.pinned {
  background: #fff8e6;
  padding: 8px 10px;
  margin: -8px -10px 8px -10px;
  border-radius: 4px;
  border-bottom: 2px solid #f0c36d;
}
.news-date {
  color: #888;
  font-size: 0.9em;
  margin-right: 10px;
}
.news-tag {
  display: inline-block;
  background: #c41e3a;
  color: white;
  font-size: 0.75em;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 5px;
}
</style>

# News

<div class="news-box">
  <div class="news-item pinned">
    <span class="news-tag">Pinned</span>
    <span class="news-date">[2025]</span> I am applying to Ph.D positions this year (both Spring 2026 and Fall 2026 are available)!
  </div>
  <div class="news-item pinned">
    <span class="news-tag">Pinned</span>
    <span class="news-date">[2025]</span> I am looking for research internship opportunities!
  </div>
  <div class="news-item">
    <span class="news-date">[Jan 2026]</span> One paper accepted to <strong>ICLR 2026</strong>!
  </div>
  <div class="news-item">
    <span class="news-date">[May 2025]</span> One paper accepted to <strong>Medical Engineering & Physics</strong>.
  </div>
  <div class="news-item">
    <span class="news-date">[Nov 2025]</span> Started remote research at Virginia Tech with Prof. Shengwei An.
  </div>
  <div class="news-item">
    <span class="news-date">[Jul 2025]</span> Joined AGI Lab at Westlake University as a research assistant.
  </div>
  <div class="news-item">
    <span class="news-date">[Jun 2025]</span> Graduated from Ocean University of China with Outstanding Graduate honor.
  </div>
</div>


# Selected Publications

<style>
.selected-pub {
  display: flex;
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  background: #fafafa;
}
.selected-pub-image {
  flex: 0 0 150px;
  margin-right: 15px;
}
.selected-pub-image img {
  width: 100%;
  border-radius: 4px;
}
.selected-pub-content {
  flex: 1;
}
.selected-pub-title {
  font-weight: bold;
  margin-bottom: 5px;
}
.selected-pub-authors {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 5px;
}
.selected-pub-venue {
  color: #c41e3a;
  font-weight: bold;
  font-size: 0.9em;
}
.selected-pub-links {
  margin-top: 8px;
}
.selected-pub-links a {
  display: inline-block;
  margin-right: 8px;
  padding: 4px 10px;
  background: #4a86e8;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.85em;
}
.selected-pub-links a:hover {
  background: #3a76d8;
}
.selected-pub-links a.code-link {
  background: #333;
}
@media (max-width: 600px) {
  .selected-pub {
    flex-direction: column;
  }
  .selected-pub-image {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>

<div class="selected-pub">
  <div class="selected-pub-image">
    <img src="/images/pmi_teaser.png" alt="PMI">
  </div>
  <div class="selected-pub-content">
    <div class="selected-pub-title">PMI: Flow-Based Inversion Correction via Proximal Operator</div>
    <div class="selected-pub-authors"><strong>Chenru Wang</strong>, Beier Zhu, Chi Zhang</div>
    <div class="selected-pub-venue">ICLR 2026</div>
    <div class="selected-pub-links">
      <a href="/files/pmi_paper.pdf">Paper</a>
      <a href="https://github.com/WinterCCC/PMI" class="code-link">Code</a>
    </div>
  </div>
</div>

See full publication list [here](/publications/).


# Research Experience
### AGI Lab, Westlake University (Advisor: [Chi Zhang](https://icoz69.github.io/))
- **Research on Reinforcement Learning for Diffusion models and Flow models**
  *Aug. 2025 – Present*

- **Research on Dataset Distillation and Dataset Generation (Co-author)**
  *Jul. 2025 – Present*
  Developed a novel fine-tuning method for dataset distillation and dataset generation.

- **Research on Inversion and Editing Techniques in Generative Models**
  *Apr. 2025 – Aug. 2025*
  Developed a plug-and-play velocity correction framework to improve inversion stability and editing fidelity in flow-based generative models. Achieved state-of-the-art results on PIE-Bench; **first-author paper accepted by ICLR 2026**.

### Ocean University of China (Advisor: [Xueying Zeng](https://math.ouc.edu.cn/2017/0412/c8925a61424/page.psp))
- **Research on Detection of Coronary Artery Stenosis**
  *Jun. 2023 – Apr. 2024*
  Applied deep learning techniques to assist physicians in diagnosing coronary artery disease and reduce diagnostic errors. Proposed the Deformable Dilatable U-structure Module to enhance model generalization. Constructed the 302 dataset to evaluate performance in clinical scenarios.

- **Research on Image Denoising and Enhancement for Coronary Angiography**
  *Nov. 2022 – Sept. 2023*
  Explored denoising and enhancement techniques, proposed a novel hybrid method. Developed a new super-resolution method by integrating deep learning and traditional techniques.




# Skills


- **Programming Languages**: Python (PyTorch, OpenCV, Scikit-learn, etc.), C/C++, MATLAB, R
- **Professional Software**: LaTeX, Lingo, Mathtype, Mathematica, SPSS
- **Languages**: English (IELTS 6.5)


# Award

- The Third Prize Scholarship, Ocean University of China (2023 & 2024)
- Honorable Mention, Mathematical Contest in Modeling (2023 & 2024)
- Outstanding Student, Ocean University of China (2024)
- Outstanding Graduate, Ocean University of China (2025)
