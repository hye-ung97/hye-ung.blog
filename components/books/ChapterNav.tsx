import { ReactNode } from 'react'
import Link from '@/components/Link'
import { chapterNumber, partHeading, type BookOutline } from 'lib/books'

interface Props {
  outline: BookOutline
  current: number
  // Shown under the current chapter: its headings, in the desktop sidebar
  headings?: ReactNode
}

// The book's table of contents beside a chapter, with the chapter being read highlighted
export default function ChapterNav({ outline, current, headings }: Props) {
  return (
    <div className="space-y-5 text-sm">
      {outline.parts.map((part, index) => {
        const heading = partHeading(part)
        return (
          <div key={index}>
            {heading && (
              <p className="mb-1 px-2 text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                {heading}
              </p>
            )}
            <ol>
              {part.entries.map((entry) => {
                const isCurrent = entry.chapter === current
                const label = (
                  <>
                    <span className="min-w-6 shrink-0 tabular-nums">{chapterNumber(entry)}</span>
                    <span className="break-keep">{entry.title}</span>
                  </>
                )
                return (
                  <li key={entry.chapter}>
                    {entry.article ? (
                      <Link
                        href={`/${entry.article.path}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={`flex gap-2 rounded-md px-2 py-1.5 ${
                          isCurrent
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300 font-medium'
                            : 'hover:text-primary-500 dark:hover:text-primary-400 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="flex gap-2 px-2 py-1.5 text-gray-400 dark:text-gray-500">
                        {label}
                        <span className="sr-only">(준비 중)</span>
                      </span>
                    )}
                    {isCurrent && headings}
                  </li>
                )
              })}
            </ol>
          </div>
        )
      })}
    </div>
  )
}
