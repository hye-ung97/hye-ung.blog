'use client'

import { ReactNode, useState } from 'react'
import type { BookStatus } from 'lib/books'

type Filter = BookStatus | 'all'

interface Props {
  filters: { value: Filter; label: string; count: number }[]
  // Cards come rendered from the server, where covers can still read BASE_PATH
  books: { slug: string; status: BookStatus; card: ReactNode }[]
}

export default function BookShelf({ filters, books }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const shown = filter === 'all' ? books : books.filter((book) => book.status === filter)

  return (
    <>
      {/* 'all' plus at least two statuses: with one status the chips would filter nothing */}
      {filters.length > 2 && (
        <div role="group" aria-label="읽기 상태" className="mb-8 flex flex-wrap gap-2">
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300'
                  : 'hover:text-primary-500 dark:hover:text-primary-400 text-gray-500 ring-1 ring-gray-200 ring-inset dark:text-gray-400 dark:ring-gray-700'
              }`}
            >
              {label} {count}
            </button>
          ))}
        </div>
      )}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {shown.map((book) => (
          <li key={book.slug}>{book.card}</li>
        ))}
      </ul>
    </>
  )
}
