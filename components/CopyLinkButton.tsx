'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface Props {
  url: string
  tooltipPlacement?: 'top' | 'bottom'
}

type CopyStatus = 'idle' | 'copying' | 'copied' | 'error'

export default function CopyLinkButton({ url, tooltipPlacement = 'top' }: Props) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const statusId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copying = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  useEffect(() => {
    if (status === 'error') {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [status])

  const copyLink = async () => {
    if (copying.current) return
    copying.current = true
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setStatus('copying')

    try {
      await navigator.clipboard.writeText(url)
      if (!mounted.current) return
      setStatus('copied')
      resetTimer.current = setTimeout(() => setStatus('idle'), 2000)
    } catch {
      if (mounted.current) setStatus('error')
    } finally {
      copying.current = false
    }
  }

  const message =
    status === 'copied'
      ? '글 링크가 복사됐어요.'
      : status === 'error'
        ? '자동 복사가 안 됐어요. 아래 링크를 직접 복사해주세요.'
        : status === 'copying'
          ? '글 링크를 복사하고 있어요.'
          : ''

  return (
    <div className="max-w-full">
      <button
        type="button"
        aria-label="링크 복사"
        aria-busy={status === 'copying'}
        onClick={copyLink}
        disabled={status === 'copying'}
        className="focus-visible:outline-primary-500 group relative inline-flex h-11 w-11 items-center justify-center rounded-full align-middle focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            status === 'copied'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300'
              : 'group-hover:text-primary-600 dark:group-hover:text-primary-400 bg-gray-100 text-gray-500 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
          >
            {status === 'copied' ? (
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.051l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.479-9.816a.75.75 0 0 1 1.051-.143Z"
                clipRule="evenodd"
              />
            ) : (
              <>
                <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
              </>
            )}
          </svg>
        </span>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white transition-opacity dark:bg-gray-100 dark:text-gray-900 ${
            tooltipPlacement === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'
          } ${
            status === 'copied'
              ? 'visible opacity-100'
              : 'invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100'
          }`}
        >
          {status === 'copied' ? '복사됐어요' : status === 'copying' ? '복사 중…' : '링크 복사'}
        </span>
      </button>
      <p
        id={statusId}
        role="status"
        aria-atomic="true"
        className={status === 'error' ? 'mt-3 text-sm text-gray-600 dark:text-gray-300' : 'sr-only'}
      >
        {message}
      </p>
      {status === 'error' && (
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={url}
          aria-label="직접 복사할 글 링크"
          aria-describedby={statusId}
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
          className="focus:border-primary-500 focus:ring-primary-500 mt-2 min-h-11 w-full max-w-lg rounded-lg border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
        />
      )}
    </div>
  )
}
