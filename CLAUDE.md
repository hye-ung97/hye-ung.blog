# CLAUDE.md

## Git

- Commit directly on `main`. This repo has no feature branches or pull requests, so don't create a branch before committing.

## Writing posts

- A post is `data/blog/<slug>.mdx` and is served at `/blog/<slug>`. Its images go in `public/static/images/<slug>/` (a series can share one folder, like `bola/`) and are referenced as `/static/images/<slug>/<name>.png`.
- When moving over a draft (a Markdown export, a Tistory post), keep the text unchanged and convert only the markup. The title and byline go into the frontmatter, not the body.

### Frontmatter

- Use `title`, `date`, `tags`, `category`, `draft: false` and `summary`, with single-quoted values.
- `date` is `'YYYY-MM-DD'`. If another post has the same date, add a KST time (`'2026-09-28T20:00:00+09:00'`) so the newer post comes first: the list sorts by date alone.
- `tags` are about four lowercase English words, like `['security', 'bola', 'owasp', 'api']`.
- `category` reuses one from `app/category-data.json` when one fits, since each new category adds a sidebar entry and its own pages.
- `summary` opens with a concrete question hook ending in "~다면?", then says in one sentence what the post covers, in the same speech level as the body.

### Images

- Use the draft's original images; don't redraw diagrams as SVG. If the export lost an embedded figure (an `[embedded content: …]` placeholder), extract the original from the PDF export of the same draft with `pdfimages -list` and `pdfimages -png`.
- Captions aren't rendered, so the alt text is the figure's only description. Its first sentence is the diagram's title, and the rest walks through the diagram with its own labels in plain "~다" sentences. Drop the export's caption line.

### Before committing

- Run `yarn prettier --check` on the post; the pre-commit hook runs prettier on md, mdx and json files.
- Launch `yarn dev` through a shell (`sh -c 'yarn dev'` in `.claude/launch.json`): the script expands `$PWD`, and without a shell it fails with `Unbound variable "PWD"`. While it runs, contentlayer rewrites `app/tag-data.json` and `app/category-data.json`; commit them with the post.
- The commit message is `Add <nth> post: <English title>` (e.g. `Add fifth post: TDD in the AI era`), with a body that says what changed from the draft.
