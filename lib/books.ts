// Data access for the Books section. Server only: client components may import types from here,
// never values, or the whole content index ends up in the browser bundle.
import { allBooks, allBookChapters } from 'contentlayer/generated'
import type { Book, BookChapter } from 'contentlayer/generated'
import { coreContent, type CoreContent } from 'pliny/utils/contentlayer'

export type BookStatus = Book['status']
export type ChapterMeta = CoreContent<BookChapter>

// A line of the book's table of contents, with its summary when one is published
export interface OutlineEntry {
  chapter: number
  title: string
  label?: string
  article?: ChapterMeta
}

export interface OutlinePart {
  label?: string
  title?: string
  entries: OutlineEntry[]
}

export interface BookOutline {
  parts: OutlinePart[]
  written: number
  total: number
}

export interface ShelfBook extends CoreContent<Book> {
  written: number
  total: number
  // The newest summary's date, or startedAt before the first one
  lastActivity: string
}

export const STATUS_LABEL: Record<BookStatus, string> = {
  reading: '읽는 중',
  finished: '완독',
}

const isProduction = process.env.NODE_ENV === 'production'

// Same rule as pliny's allCoreContent: drafts show up in dev and disappear in production builds
export function isVisible(doc: { draft?: boolean }) {
  return !isProduction || doc.draft !== true
}

export function getBook(slug: string): Book | undefined {
  return allBooks.find((book) => book.slug === slug && isVisible(book))
}

// Published summaries in chapter order. A draft book takes its chapters down with it.
export function getChapters(bookSlug: string): ChapterMeta[] {
  if (!getBook(bookSlug)) return []
  return allBookChapters
    .filter((chapter) => chapter.bookSlug === bookSlug && isVisible(chapter))
    .map((chapter) => coreContent(chapter))
    .sort((a, b) => a.chapter - b.chapter)
}

export function getChapter(bookSlug: string, chapterSlug: string): BookChapter | undefined {
  if (!getBook(bookSlug)) return undefined
  return allBookChapters.find(
    (chapter) => chapter.slug === `${bookSlug}/${chapterSlug}` && isVisible(chapter)
  )
}

export function getBooks(): ShelfBook[] {
  return allBooks
    .filter(isVisible)
    .map((book) => {
      const chapters = getChapters(book.slug)
      const { written, total } = buildBookOutline(book, chapters)
      const lastActivity = chapters.reduce(
        (latest, chapter) => (chapter.date > latest ? chapter.date : latest),
        book.startedAt
      )
      return { ...coreContent(book), written, total, lastActivity }
    })
    .sort(compareBooks)
}

export function getBookParams() {
  return allBooks.filter(isVisible).map((book) => ({ book: book.slug }))
}

export function getChapterParams() {
  return allBooks.filter(isVisible).flatMap((book) =>
    getChapters(book.slug).map((chapter) => ({
      book: book.slug,
      chapter: chapter.slug.split('/')[1],
    }))
  )
}

// The book's full table of contents, with each published summary attached to its line
export function buildBookOutline(book: Pick<Book, 'parts'>, chapters: ChapterMeta[]): BookOutline {
  const articles = new Map(chapters.map((chapter) => [chapter.chapter, chapter]))
  const parts = book.parts.map((part) => ({
    label: part.label,
    title: part.title,
    entries: part.chapters.map((entry) => ({
      chapter: entry.chapter,
      title: entry.title,
      label: entry.label,
      article: articles.get(entry.chapter),
    })),
  }))
  const entries = parts.flatMap((part) => part.entries)
  return {
    parts,
    written: entries.filter((entry) => entry.article).length,
    total: entries.length,
  }
}

export function findInOutline(
  outline: BookOutline,
  chapter: number
): { part?: OutlinePart; entry?: OutlineEntry } {
  for (const part of outline.parts) {
    const entry = part.entries.find((e) => e.chapter === chapter)
    if (entry) return { part, entry }
  }
  return {}
}

// Books being read come before finished ones. A Record makes a new status fail to compile until
// it gets a place here.
const SHELF_ORDER: Record<BookStatus, number> = { reading: 0, finished: 1 }

// The date a book sorts by within its group: when it was last summarized while being read, and
// when it was finished after that
const shelfDate = (book: ShelfBook) =>
  Date.parse(
    book.status === 'finished' ? (book.finishedAt ?? book.lastActivity) : book.lastActivity
  )

// Orders the shelf on /books: newest first within each status, then by title so the order never
// depends on file names
export function compareBooks(a: ShelfBook, b: ShelfBook): number {
  return (
    SHELF_ORDER[a.status] - SHELF_ORDER[b.status] ||
    shelfDate(b) - shelfDate(a) ||
    a.title.localeCompare(b.title, 'ko')
  )
}

/**
 * Picks the prev/next cards on a chapter page. `chapters` is what getChapters returned for the
 * book: published summaries only, in chapter order, so unwritten chapters are skipped
 * (with summaries for 3, 5 and 7, chapter 5 gets 3 and 7).
 *
 * It takes the nearest numbers below and above rather than the neighbours at index ±1, so a
 * chapter missing from the list still gets cards instead of wrong ones.
 */
export function getAdjacentChapters(
  chapters: ChapterMeta[],
  current: number
): { prev?: ChapterMeta; next?: ChapterMeta } {
  return {
    prev: chapters.findLast((chapter) => chapter.chapter < current),
    next: chapters.find((chapter) => chapter.chapter > current),
  }
}

const pad = (chapter: number) => String(chapter).padStart(2, '0')

// '05', or the entry's own label such as '서문'
export function chapterNumber(entry: { chapter: number; label?: string }) {
  return entry.label ?? pad(entry.chapter)
}

// Labels such as '부록 A' are wider than a two-digit number, so a book that has them gets a wider
// number column and its titles stay aligned
export function hasLabels(outline: BookOutline) {
  return outline.parts.some((part) => part.entries.some((entry) => entry.label))
}

// '2부 · 분산 데이터'
export function partHeading(part: OutlinePart) {
  return [part.label, part.title].filter(Boolean).join(' · ') || undefined
}

// 'Chapter 05 · 2부 분산 데이터'
export function chapterLabel(entry: { chapter: number; label?: string }, part?: OutlinePart) {
  const name = entry.label ?? `Chapter ${pad(entry.chapter)}`
  const partName = part && [part.label, part.title].filter(Boolean).join(' ')
  return partName ? `${name} · ${partName}` : name
}

// contentlayer stores dates in UTC, so label them in KST like the archive page does
const TIME_ZONE = 'Asia/Seoul'
const shortDate = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
})
const monthYear = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  year: 'numeric',
})

// 'Sep 16'
export const formatShortDate = (date: string) => shortDate.format(new Date(date))
// 'Aug 2026'
export const formatMonth = (date: string) => monthYear.format(new Date(date))
