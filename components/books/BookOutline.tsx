import Link from '@/components/Link'
import { chapterNumber, formatShortDate, partHeading, type BookOutline as Outline } from 'lib/books'

// The book's full table of contents on its page. Chapters with a summary link to it; the rest
// stay listed but muted, so the page shows how far the notes have come.
export default function BookOutline({ outline }: { outline: Outline }) {
  return (
    <div className="space-y-8">
      {outline.parts.map((part, index) => {
        const heading = partHeading(part)
        return (
          <div key={index}>
            {heading && <h3 className="text-primary-500 mb-2 text-sm font-bold">{heading}</h3>}
            <ol className="divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-700 dark:border-gray-700">
              {part.entries.map((entry) => (
                <li key={entry.chapter}>
                  {entry.article ? (
                    <Link
                      href={`/${entry.article.path}`}
                      className="group flex items-baseline gap-4 py-3"
                    >
                      <span className="min-w-8 shrink-0 text-sm text-gray-400 tabular-nums dark:text-gray-500">
                        {chapterNumber(entry)}
                      </span>
                      <span className="group-hover:text-primary-500 dark:group-hover:text-primary-400 flex-1 font-medium break-keep text-gray-900 dark:text-gray-100">
                        {entry.title}
                      </span>
                      <time
                        dateTime={entry.article.date}
                        className="shrink-0 text-sm text-gray-500 tabular-nums dark:text-gray-400"
                      >
                        {formatShortDate(entry.article.date)}
                      </time>
                      <span aria-hidden="true" className="text-primary-500">
                        &rarr;
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-baseline gap-4 py-3 text-gray-400 dark:text-gray-500">
                      <span className="min-w-8 shrink-0 text-sm tabular-nums">
                        {chapterNumber(entry)}
                      </span>
                      <span className="flex-1 break-keep">{entry.title}</span>
                      <span className="shrink-0 text-sm">준비 중</span>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )
      })}
    </div>
  )
}
