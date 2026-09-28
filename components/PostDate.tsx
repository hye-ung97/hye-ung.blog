import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'

interface Props {
  date: string
  className?: string
}

export default function PostDate({ date, className = '' }: Props) {
  return (
    <dl className={`flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      <dt>
        <span className="sr-only">Published on</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 14 16"
          fill="currentColor"
          aria-hidden="true"
          className="h-3.5 w-3"
        >
          <path
            fillRule="evenodd"
            d="M1.5 2A1.5 1.5 0 0 0 0 3.5v11A1.5 1.5 0 0 0 1.5 16h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 12.5 2h-11Zm0 3v9.5h11V5h-11Z"
          />
          <path d="M3 0h2v3H3V0Zm6 0h2v3H9V0ZM3 7h2v2H3V7Zm3 0h2v2H6V7Zm3 0h2v2H9V7ZM3 10h2v2H3v-2Zm3 0h2v2H6v-2Zm3 0h2v2H9v-2Z" />
        </svg>
      </dt>
      <dd>
        <time dateTime={date} suppressHydrationWarning>
          {formatDate(date, siteMetadata.locale)}
        </time>
      </dd>
    </dl>
  )
}
