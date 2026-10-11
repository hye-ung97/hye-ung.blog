import BookCard from '@/components/books/BookCard'
import BookShelf from '@/components/books/BookShelf'
import { genPageMetadata } from 'app/seo'
import { getBooks, STATUS_LABEL, type BookStatus } from 'lib/books'

const description = '책을 읽으며 정리한 내용을 목차별로 모았습니다.'

export const metadata = genPageMetadata({ title: 'Books', description })

export default function BooksPage() {
  const books = getBooks()
  const statuses = (Object.keys(STATUS_LABEL) as BookStatus[]).filter((status) =>
    books.some((book) => book.status === status)
  )
  const filters = [
    { value: 'all' as const, label: '전체', count: books.length },
    ...statuses.map((status) => ({
      value: status,
      label: STATUS_LABEL[status],
      count: books.filter((book) => book.status === status).length,
    })),
  ]

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Books
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="py-8">
        {books.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">아직 정리한 책이 없어요.</p>
        ) : (
          <BookShelf
            filters={filters}
            books={books.map((book, index) => ({
              slug: book.slug,
              status: book.status,
              card: <BookCard book={book} priority={index < 5} />,
            }))}
          />
        )}
      </div>
    </div>
  )
}
