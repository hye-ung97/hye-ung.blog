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

## Writing book summaries

- A book is `data/books/<book>.mdx`, served at `/books/<book>`; its body is an optional introduction. A chapter summary is `data/books/<book>/<NN-ascii-slug>.mdx` (e.g. `05-replication.mdx`), served at `/books/<book>/<NN-ascii-slug>`. The folder name must match the book's file name, and a book folder never gets an `index.mdx`.
- Book pages and summaries appear under Books, in the sitemap and in search, but not in the blog list, tags, categories, RSS or the home page.
- Images, the cover included, go in `public/static/images/books/<book>/`. The image rules for posts apply.

### Book frontmatter

- `title`, `author`, `startedAt` and `parts` are required. `translator`, `publisher`, `cover`, `status` (`'reading'` or `'finished'`), `finishedAt`, `summary` (a one-line review) and `draft` are optional.
- `parts` is the book's whole table of contents, unwritten chapters included: the book page lists those as "준비 중".

  ```yaml
  parts:
    - label: '2부'
      title: '분산 데이터'
      chapters:
        - { chapter: 5, title: '복제' }
  ```

  A book without parts has one entry with only `chapters`. A chapter's `label` replaces its printed number, for entries like '서문' or '부록 A'.

### Chapter frontmatter

- Use `title`, `chapter` (the number in the book's `parts` it summarizes), `date`, `summary` (one sentence on what it covers, in the body's speech level) and `draft: false`.
- Numbers and booleans stay unquoted (`chapter: 5`, `draft: false`). Contentlayer drops a summary whose `chapter` is `'5'` with only a warning, and a quoted number in `parts` drops the whole book. `checkBooks` in `contentlayer.config.ts` catches the rest (an unknown status, a duplicate number, a summary whose number isn't in `parts`): a warning in dev, a failed production build.
- Commit a new book as `Add book: <English title>` and a summary as `Add book summary: <English book title> ch. <N> <English chapter title>` (e.g. `Add book summary: DDIA ch. 5 Replication`).
