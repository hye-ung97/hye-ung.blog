import Link from '@/components/Link'
import type { ShelfBook } from 'lib/books'
import BookCover from './BookCover'
import BookProgress from './BookProgress'

interface Props {
  book: ShelfBook
  priority?: boolean
}

export default function BookCard({ book, priority = false }: Props) {
  return (
    <Link href={`/${book.path}`} className="group block">
      <BookCover
        title={book.title}
        cover={book.cover}
        sizes="(min-width: 1280px) 186px, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
        priority={priority}
        className="transition-transform motion-safe:group-hover:-translate-y-1"
      />
      <h2 className="group-hover:text-primary-500 dark:group-hover:text-primary-400 mt-3 line-clamp-2 text-sm leading-5 font-bold break-keep text-gray-900 dark:text-gray-100">
        {book.title}
      </h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{book.author}</p>
      <BookProgress
        written={book.written}
        total={book.total}
        status={book.status}
        className="mt-2"
      />
    </Link>
  )
}
