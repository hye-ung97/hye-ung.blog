import 'css/prism.css'
import 'katex/dist/katex.css'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { coreContent } from 'pliny/utils/contentlayer'
import { components } from '@/components/MDXComponents'
import siteMetadata from '@/data/siteMetadata'
import BookChapterLayout from '@/layouts/BookChapterLayout'
import {
  buildBookOutline,
  chapterLabel,
  chapterNumber,
  findInOutline,
  getAdjacentChapters,
  getBook,
  getChapter,
  getChapterParams,
  getChapters,
  type BookOutline,
  type ChapterMeta,
} from 'lib/books'

type Params = Promise<{ book: string; chapter: string }>

async function findChapter(params: Params) {
  const { book: bookSlug, chapter: chapterSlug } = await params
  const book = getBook(decodeURI(bookSlug))
  const chapter = book && getChapter(book.slug, decodeURI(chapterSlug))
  return { book, chapter }
}

export async function generateMetadata(props: { params: Params }): Promise<Metadata | undefined> {
  const { book, chapter } = await findChapter(props.params)
  if (!book || !chapter) {
    return
  }

  const title = `${chapter.title} | ${book.title}`
  let imageList = [book.cover || siteMetadata.socialBanner]
  if (chapter.images) {
    imageList = typeof chapter.images === 'string' ? [chapter.images] : chapter.images
  }
  const ogImages = imageList.map((img) => {
    return {
      url: img && img.includes('http') ? img : siteMetadata.siteUrl + img,
    }
  })

  return {
    title,
    description: chapter.summary,
    openGraph: {
      title,
      description: chapter.summary,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: new Date(chapter.date).toISOString(),
      modifiedTime: new Date(chapter.lastmod || chapter.date).toISOString(),
      url: './',
      images: ogImages,
      authors: [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: chapter.summary,
      images: imageList,
    },
  }
}

export const generateStaticParams = async () => getChapterParams()

export default async function ChapterPage(props: { params: Params }) {
  const { book, chapter } = await findChapter(props.params)
  if (!book || !chapter) {
    return notFound()
  }

  const chapters = getChapters(book.slug)
  const outline = buildBookOutline(book, chapters)
  const { part, entry } = findInOutline(outline, chapter.chapter)
  const { prev, next } = getAdjacentChapters(chapters, chapter.chapter)
  const sharePath = [process.env.BASE_PATH || '', chapter.path]
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
  const shareUrl = new URL(`/${sharePath}/`, siteMetadata.siteUrl).href

  return (
    <BookChapterLayout
      book={{ title: book.title, path: book.path, cover: book.cover }}
      outline={outline}
      content={coreContent(chapter)}
      label={chapterLabel(entry ?? chapter, part)}
      prev={toNeighbour(outline, prev)}
      next={toNeighbour(outline, next)}
      shareUrl={shareUrl}
    >
      <MDXLayoutRenderer code={chapter.body.code} components={components} toc={chapter.toc} />
    </BookChapterLayout>
  )
}

// The prev/next cards name a chapter the way the book's table of contents does: '03 저장소와 검색'
function toNeighbour(outline: BookOutline, article?: ChapterMeta) {
  if (!article) return undefined
  const { entry } = findInOutline(outline, article.chapter)
  return {
    path: article.path,
    label: `${chapterNumber(entry ?? article)} ${entry?.title ?? article.title}`,
  }
}
