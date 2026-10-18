import { ReactNode } from 'react'
import Comments from '@/components/Comments'
import CopyLinkButton from '@/components/CopyLinkButton'
import Link from '@/components/Link'
import PostDate from '@/components/PostDate'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import TableOfContents from '@/components/TableOfContents'
import BookCover from '@/components/books/BookCover'
import BookProgress from '@/components/books/BookProgress'
import ChapterHeadings from '@/components/books/ChapterHeadings'
import ChapterNav from '@/components/books/ChapterNav'
import siteMetadata from '@/data/siteMetadata'
import type { BookOutline, ChapterMeta } from 'lib/books'

interface Neighbour {
  path: string
  label: string
}

interface LayoutProps {
  book: { title: string; path: string; cover?: string }
  outline: BookOutline
  content: ChapterMeta
  // 'Chapter 05 2부 분산 데이터'
  label: string
  prev?: Neighbour
  next?: Neighbour
  shareUrl: string
  children: ReactNode
}

// Keep the article first and the book's table of contents on the right, with extra space
// between them so the chapter's nested headings don't crowd the reading column.
export default function BookChapterLayout({
  book,
  outline,
  content,
  label,
  prev,
  next,
  shareUrl,
  children,
}: LayoutProps) {
  const { slug, date, title, toc, chapter } = content

  return (
    <>
      <ScrollTopAndComment />
      <div className="pt-6 pb-8 xl:grid xl:grid-cols-4 xl:gap-x-12 2xl:gap-x-16">
        <article className="min-w-0 xl:col-span-3 xl:col-start-1 xl:row-start-1">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
            <ol className="flex flex-wrap items-center gap-x-2">
              <li>
                <Link href="/books" className="hover:text-primary-500 dark:hover:text-primary-400">
                  Books
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/${book.path}`}
                  className="hover:text-primary-500 dark:hover:text-primary-400 break-keep"
                >
                  {book.title}
                </Link>
              </li>
            </ol>
          </nav>
          <header className="pt-6 pb-4">
            <p className="text-primary-500 text-sm font-medium">{label}</p>
            <h1 className="mt-2 text-3xl leading-9 font-extrabold tracking-tight break-keep text-gray-900 sm:text-4xl sm:leading-10 dark:text-gray-100">
              {title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 text-sm text-gray-500 dark:text-gray-400">
              <PostDate date={date} />
              <CopyLinkButton key={shareUrl} url={shareUrl} tooltipPlacement="bottom" />
            </div>
          </header>
          <div className="xl:hidden">
            <details className="group border-y border-gray-200 dark:border-gray-700">
              <summary className="cursor-pointer list-none py-4 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                  목차 {outline.written}/{outline.total}장 정리
                  {/* The same plus and minus as the Contents disclosure right below it */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4 group-open:hidden"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="hidden h-4 w-4 group-open:block"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </summary>
              <div className="pb-4">
                <ChapterNav outline={outline} current={chapter} />
              </div>
            </details>
            <TableOfContents toc={toc} />
          </div>
          <div className="prose dark:prose-invert max-w-none pt-8 pb-8">{children}</div>
          <footer className="border-t border-gray-200 dark:border-gray-700">
            <div className="py-4">
              <CopyLinkButton key={shareUrl} url={shareUrl} />
            </div>
            {(prev || next) && (
              <nav aria-label="이전 장과 다음 장" className="grid gap-4 py-4 sm:grid-cols-2">
                {prev && (
                  <Link
                    href={`/${prev.path}`}
                    className="group hover:border-primary-500 dark:hover:border-primary-400 rounded-md border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <span className="text-xs tracking-wide text-gray-500 dark:text-gray-400">
                      &larr; 이전 장
                    </span>
                    <span className="group-hover:text-primary-500 dark:group-hover:text-primary-400 mt-1 block font-medium break-keep text-gray-900 dark:text-gray-100">
                      {prev.label}
                    </span>
                  </Link>
                )}
                {next && (
                  <Link
                    href={`/${next.path}`}
                    className="group hover:border-primary-500 dark:hover:border-primary-400 rounded-md border border-gray-200 p-4 text-right sm:col-start-2 dark:border-gray-700"
                  >
                    <span className="text-xs tracking-wide text-gray-500 dark:text-gray-400">
                      다음 장 &rarr;
                    </span>
                    <span className="group-hover:text-primary-500 dark:group-hover:text-primary-400 mt-1 block font-medium break-keep text-gray-900 dark:text-gray-100">
                      {next.label}
                    </span>
                  </Link>
                )}
              </nav>
            )}
            <div className="pt-4 pb-6">
              <Link
                href={`/${book.path}`}
                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
              >
                &larr; 목차로 돌아가기
              </Link>
            </div>
          </footer>
          {siteMetadata.comments && (
            <div className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300" id="comment">
              <Comments slug={slug} />
            </div>
          )}
        </article>
        <aside className="hidden min-w-0 xl:col-start-4 xl:row-start-1 xl:block">
          <nav
            aria-label="책 목차"
            className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain pr-2 pb-4"
          >
            <Link href={`/${book.path}`} className="group flex items-center gap-3">
              <BookCover
                title={book.title}
                cover={book.cover}
                sizes="48px"
                className="w-12 shrink-0"
              />
              <span className="group-hover:text-primary-500 dark:group-hover:text-primary-400 text-sm leading-snug font-semibold break-keep text-gray-700 dark:text-gray-300">
                {book.title}
              </span>
            </Link>
            <BookProgress written={outline.written} total={outline.total} className="mt-4" />
            <div className="mt-6">
              <ChapterNav
                outline={outline}
                current={chapter}
                headings={<ChapterHeadings toc={toc} />}
              />
            </div>
          </nav>
        </aside>
      </div>
    </>
  )
}
