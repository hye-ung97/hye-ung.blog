import { STATUS_LABEL, type BookStatus } from 'lib/books'

interface Props {
  written: number
  total: number
  // Prefixes the count on the shelf: '읽는 중 · 5/12장 정리'
  status?: BookStatus
  className?: string
}

export default function BookProgress({ written, total, status, className = '' }: Props) {
  const text = [status && STATUS_LABEL[status], total > 0 && `${written}/${total}장 정리`]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={className}>
      {total > 0 && (
        <div
          aria-hidden="true"
          className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        >
          {/* Tailwind can't generate a class for a width computed at runtime */}
          <div
            className="bg-primary-500 h-full rounded-full"
            style={{ width: `${Math.round((written / total) * 100)}%` }}
          />
        </div>
      )}
      {text && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  )
}
