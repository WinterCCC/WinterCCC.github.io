# Repository Guidelines

## Project Structure & Module Organization

This repository is a Jekyll academic website based on Academic Pages. Site-wide settings and collection defaults live in `_config.yml`; header links are maintained in `_data/navigation.yml`. Standalone pages belong in `_pages/`, while dated content is grouped into `_posts/`, `_publications/`, `_talks/`, `_teaching/`, and `_portfolio/`. Reusable HTML is split between `_layouts/` and `_includes/`. Styles are authored in `_sass/` and `assets/css/`; JavaScript sources are under `assets/js/`. Store site images in `images/` and downloadable PDFs or slides in `files/`. The `markdown_generator/` utilities support bulk publication and talk imports.

## Build, Test, and Development Commands

- `bundle install` installs Ruby and Jekyll dependencies.
- `bundle exec jekyll serve -l -H localhost` serves the site with live reload at `http://localhost:4000`. Restart after changing `_config.yml`.
- `bundle exec jekyll build` performs the production-style static build and catches Liquid, front matter, and configuration errors.
- `npm install` installs JavaScript build dependencies.
- `npm run build:js` regenerates `assets/js/main.min.js` after changes to `_main.js` or plugin sources.
- `docker build -t jekyll-site .` and `docker run -p 4000:4000 --rm -v $(pwd):/usr/src/app jekyll-site` provide a containerized preview.

## Coding Style & Naming Conventions

Use two-space indentation in YAML, HTML, Liquid, JavaScript, and Sass. Keep Markdown front matter valid and follow existing field names. Name dated content `YYYY-MM-DD-short-slug.md`, for example `_publications/2026-03-14-ims3.md`. On the publications page, list accepted or published papers first within each year; place entries labeled `Preprint` or only `arXiv` below them. Use lowercase kebab-case for page and asset names. Edit source Sass and JavaScript rather than generated or vendored files; rebuild `main.min.js` when required. No formatter or linter is configured, so match neighboring files and keep changes focused.

## Testing Guidelines

There is no automated test suite or coverage requirement. Before submitting, run `bundle exec jekyll build`, then preview affected pages locally. Check navigation, internal links, responsive layout, images, and downloadable files. For visual changes, inspect both desktop and mobile widths.

## Commit & Pull Request Guidelines

Recent commits use concise, imperative summaries such as `Update homepage...`, `Fix navigation...`, and `Rename PMI paper...`. Keep each commit limited to one logical change. Pull requests should explain the user-visible result, list validation performed, link relevant issues, and include before/after screenshots for layout or styling changes. Do not commit `_site/`, local caches, or unrelated generated files.
