import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { notFound } from 'next/navigation'
import { components } from '@/components/MDXComponents'
import BookCover from '@/components/books/BookCover'
import BookOutline from '@/components/books/BookOutline'
import BookProgress from '@/components/books/BookProgress'
import { genPageMetadata } from 'app/seo'
import {
  STATUS_LABEL,
  buildBookOutline,
  formatMonth,
  getBook,
  getBookParams,
  getChapters,
} from 'lib/books'

type Params = Promise<{ book: string }>

export async function generateMetadata(props: { params: Params }) {
  const params = await props.params
  const book = getBook(decodeURI(params.book))
  if (!book) {
    return
  }
  return genPageMetadata({ title: book.title, description: book.summary, image: book.cover })
}

export const generateStaticParams = async () => getBookParams()

const labelClass = 'text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400'

export default async function BookPage(props: { params: Params }) {
  const params = await props.params
  const book = getBook(decodeURI(params.book))
  if (!book) {
    return notFound()
  }

  const outline = buildBookOutline(book, getChapters(book.slug))
  const credits = [book.author, book.translator && `${book.translator} 옮김`, book.publisher]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="pt-6 pb-8 md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-x-10 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-x-16">
      <div className="flex gap-5 md:block">
        <BookCover
          title={book.title}
          cover={book.cover}
          sizes="(min-width: 1280px) 260px, (min-width: 768px) 200px, 112px"
          priority
          className="w-28 shrink-0 md:w-full"
        />
        <div className="md:mt-6">
          <h1 className="text-2xl leading-8 font-extrabold tracking-tight break-keep text-gray-900 dark:text-gray-100">
            {book.title}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{credits}</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-gray-900 dark:text-gray-100">
            <dt className="text-gray-500 dark:text-gray-400">상태</dt>
            <dd>{STATUS_LABEL[book.status]}</dd>
            <dt className="text-gray-500 dark:text-gray-400">시작</dt>
            <dd>{formatMonth(book.startedAt)}</dd>
            {book.finishedAt && (
              <>
                <dt className="text-gray-500 dark:text-gray-400">완독</dt>
                <dd>{formatMonth(book.finishedAt)}</dd>
              </>
            )}
          </dl>
          <BookProgress written={outline.written} total={outline.total} className="mt-4" />
        </div>
      </div>
      <div className="mt-10 space-y-10 md:mt-0">
        <section>
          <h2 className={`${labelClass} mb-4`}>목차</h2>
          <BookOutline outline={outline} />
        </section>
        {book.body.raw.trim() !== '' && (
          <section>
            <h2 className={labelClass}>소개</h2>
            <div className="prose dark:prose-invert max-w-none">
              <MDXLayoutRenderer code={book.body.code} components={components} />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
