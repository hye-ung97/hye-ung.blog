import {
  defineDocumentType,
  defineNestedType,
  ComputedFields,
  makeSource,
} from 'contentlayer2/source-files'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import readingTime from 'reading-time'
import { slug } from 'github-slugger'
import path from 'path'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkAlert } from 'remark-github-blockquote-alert'
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  remarkImgToJsx,
  extractTocHeadings,
} from 'pliny/mdx-plugins/index.js'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeKatexNoTranslate from 'rehype-katex-notranslate'
import rehypeCitation from 'rehype-citation'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'
import siteMetadata from './data/siteMetadata'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer.js'
import prettier from 'prettier'

const root = process.cwd()
const isProduction = process.env.NODE_ENV === 'production'

// heroicon mini link
const icon = fromHtmlIsomorphic(
  `
  <span class="content-header-link">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
  </svg>
  </span>
`,
  { fragment: true }
)

const computedFields: ComputedFields = {
  readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) },
  slug: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath.replace(/^.+?(\/)/, ''),
  },
  path: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath,
  },
  filePath: {
    type: 'string',
    resolve: (doc) => doc._raw.sourceFilePath,
  },
  toc: { type: 'json', resolve: (doc) => extractTocHeadings(doc.body.raw) },
}

/**
 * Count the occurrences of all tags across blog posts and write to json file
 */
async function createTagCount(allBlogs) {
  const tagCount: Record<string, number> = {}
  allBlogs.forEach((file) => {
    if (file.tags && (!isProduction || file.draft !== true)) {
      file.tags.forEach((tag) => {
        const formattedTag = slug(tag)
        if (formattedTag in tagCount) {
          tagCount[formattedTag] += 1
        } else {
          tagCount[formattedTag] = 1
        }
      })
    }
  })
  const formatted = await prettier.format(JSON.stringify(tagCount, null, 2), { parser: 'json' })
  writeFileSync('./app/tag-data.json', formatted)
}

/**
 * Count the posts in each category and write to json file, keyed by slug with the display name
 */
async function createCategoryCount(allBlogs) {
  const categoryCount: Record<string, { name: string; count: number }> = {}
  allBlogs.forEach((file) => {
    if (file.category && (!isProduction || file.draft !== true)) {
      const formattedCategory = slug(file.category)
      if (formattedCategory in categoryCount) {
        categoryCount[formattedCategory].count += 1
      } else {
        categoryCount[formattedCategory] = { name: file.category, count: 1 }
      }
    }
  })
  const formatted = await prettier.format(JSON.stringify(categoryCount, null, 2), {
    parser: 'json',
  })
  writeFileSync('./app/category-data.json', formatted)
}

// Same rule as pliny's allCoreContent: drafts show up in dev and disappear in production builds
const isVisible = (doc) => !isProduction || doc.draft !== true

function createSearchIndex(allBlogs, allBooks, allBookChapters) {
  if (
    siteMetadata?.search?.provider === 'kbar' &&
    siteMetadata.search.kbarConfig.searchDocumentsPath
  ) {
    // kbar shows each entry's title and date, matches on its summary and opens /<path>. A book has
    // no publish date, so it lists under the day it was started.
    const books = allBooks.filter(isVisible)
    const bookTitles = new Map(books.map((book) => [book.slug, book.title]))
    const bookEntries = books.map((book) => ({
      path: book.path,
      title: book.title,
      summary: book.summary,
      date: book.startedAt,
    }))
    const chapterEntries = allBookChapters
      .filter((chapter) => isVisible(chapter) && bookTitles.has(chapter.bookSlug))
      .map((chapter) => ({
        path: chapter.path,
        title: `${bookTitles.get(chapter.bookSlug)}: ${chapter.title}`,
        summary: chapter.summary,
        date: chapter.date,
      }))
    writeFileSync(
      `public/${path.basename(siteMetadata.search.kbarConfig.searchDocumentsPath)}`,
      JSON.stringify([...allCoreContent(sortPosts(allBlogs)), ...bookEntries, ...chapterEntries])
    )
    console.log('Local search index generated...')
  }
}

/**
 * Contentlayer skips a book or chapter whose frontmatter has the wrong type, and it checks neither
 * enum values nor the entries inside a list, so a typo can quietly drop content. Report what it
 * lets through: a warning in dev, a failed build in production.
 */
function checkBooks(allBooks, allBookChapters) {
  const problems: string[] = []
  const tocNumbers = new Map<string, Set<number>>()
  for (const book of allBooks) {
    if (!['reading', 'finished'].includes(book.status)) {
      problems.push(`${book.filePath}: unknown status '${book.status}'`)
    }
    const numbers = new Set<number>()
    for (const entry of book.parts.flatMap((part) => part.chapters ?? [])) {
      if (!Number.isInteger(entry.chapter) || !entry.title) {
        problems.push(
          `${book.filePath}: each chapter needs an unquoted whole number and a title, got ${JSON.stringify({ chapter: entry.chapter, title: entry.title })}`
        )
      } else if (numbers.has(entry.chapter)) {
        problems.push(`${book.filePath}: chapter ${entry.chapter} is listed twice`)
      }
      numbers.add(entry.chapter)
    }
    tocNumbers.set(book.slug, numbers)
  }

  const written = new Set<string>()
  for (const chapter of allBookChapters.filter(isVisible)) {
    const numbers = tocNumbers.get(chapter.bookSlug)
    if (!numbers) {
      problems.push(
        `${chapter.filePath}: no book '${chapter.bookSlug}' (the file is missing, or contentlayer skipped it: see its warning above)`
      )
      continue
    }
    if (!numbers.has(chapter.chapter)) {
      problems.push(`${chapter.filePath}: chapter ${chapter.chapter} isn't in the book's parts`)
    }
    const key = `${chapter.bookSlug}/${chapter.chapter}`
    if (written.has(key)) {
      problems.push(
        `${chapter.filePath}: another summary already covers chapter ${chapter.chapter}`
      )
    }
    written.add(key)
  }

  if (problems.length === 0) return
  const message = `Book content problems:\n- ${problems.join('\n- ')}`
  if (isProduction) throw new Error(message)
  console.warn(message)
}

// Read the generated JSON instead of importData(): it goes through import(), which Node
// caches for the life of the dev server, so posts added after startup were missed.
function readGenerated(typeName: string) {
  const indexPath = path.join(root, '.contentlayer', 'generated', typeName, '_index.json')
  return existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : []
}

export const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: 'blog/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, default: [] },
    category: { type: 'string' },
    lastmod: { type: 'date' },
    draft: { type: 'boolean' },
    summary: { type: 'string' },
    images: { type: 'json' },
    authors: { type: 'list', of: { type: 'string' } },
    layout: { type: 'string' },
    bibliography: { type: 'string' },
    canonicalUrl: { type: 'string' },
  },
  computedFields: {
    ...computedFields,
    structuredData: {
      type: 'json',
      resolve: (doc) => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: doc.title,
        datePublished: doc.date,
        dateModified: doc.lastmod || doc.date,
        description: doc.summary,
        image: doc.images ? doc.images[0] : siteMetadata.socialBanner,
        url: `${siteMetadata.siteUrl}/${doc._raw.flattenedPath}`,
      }),
    },
  },
}))

export const Authors = defineDocumentType(() => ({
  name: 'Authors',
  filePathPattern: 'authors/**/*.mdx',
  contentType: 'mdx',
  fields: {
    name: { type: 'string', required: true },
    avatar: { type: 'string' },
    occupation: { type: 'string' },
    company: { type: 'string' },
    email: { type: 'string' },
    twitter: { type: 'string' },
    bluesky: { type: 'string' },
    linkedin: { type: 'string' },
    github: { type: 'string' },
    layout: { type: 'string' },
  },
  computedFields,
}))

// One line of a book's table of contents. `chapter` orders the entries and links a summary to its
// line; `label` replaces the printed number for entries like '서문' or '부록 A'.
const BookTocEntry = defineNestedType(() => ({
  name: 'BookTocEntry',
  fields: {
    chapter: { type: 'number', required: true },
    title: { type: 'string', required: true },
    label: { type: 'string' },
  },
}))

// A part such as label '2부', title '분산 데이터'. Books without parts use one part with neither.
const BookPart = defineNestedType(() => ({
  name: 'BookPart',
  fields: {
    label: { type: 'string' },
    title: { type: 'string' },
    chapters: { type: 'list', of: BookTocEntry, required: true },
  },
}))

// data/books/<book>.mdx, served at /books/<book>. The body is an optional introduction.
export const Book = defineDocumentType(() => ({
  name: 'Book',
  filePathPattern: 'books/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    author: { type: 'string', required: true },
    translator: { type: 'string' },
    publisher: { type: 'string' },
    cover: { type: 'string' },
    status: { type: 'enum', options: ['reading', 'finished'], default: 'reading' },
    startedAt: { type: 'date', required: true },
    finishedAt: { type: 'date' },
    summary: { type: 'string' },
    draft: { type: 'boolean' },
    // Named parts, not toc: the shared computed `toc` holds the body's headings
    parts: { type: 'list', of: BookPart, required: true },
  },
  computedFields,
}))

// data/books/<book>/<NN-slug>.mdx, served at /books/<book>/<NN-slug>
export const BookChapter = defineDocumentType(() => ({
  name: 'BookChapter',
  filePathPattern: 'books/*/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    chapter: { type: 'number', required: true },
    date: { type: 'date', required: true },
    lastmod: { type: 'date' },
    summary: { type: 'string' },
    images: { type: 'json' },
    draft: { type: 'boolean' },
  },
  computedFields: {
    ...computedFields,
    bookSlug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.split('/')[1],
    },
  },
}))

export default makeSource({
  contentDirPath: 'data',
  documentTypes: [Blog, Authors, Book, BookChapter],
  mdx: {
    cwd: process.cwd(),
    remarkPlugins: [
      remarkExtractFrontmatter,
      remarkGfm,
      remarkCodeTitles,
      remarkMath,
      remarkImgToJsx,
      remarkAlert,
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          headingProperties: {
            className: ['content-header'],
          },
          content: icon,
        },
      ],
      rehypeKatex,
      rehypeKatexNoTranslate,
      [rehypeCitation, { path: path.join(root, 'data') }],
      [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
      rehypePresetMinify,
    ],
  },
  onSuccess: async () => {
    const allBlogs = readGenerated('Blog')
    const allBooks = readGenerated('Book')
    const allBookChapters = readGenerated('BookChapter')
    await createTagCount(allBlogs)
    await createCategoryCount(allBlogs)
    createSearchIndex(allBlogs, allBooks, allBookChapters)
    checkBooks(allBooks, allBookChapters)
  },
})
