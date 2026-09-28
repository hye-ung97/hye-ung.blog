'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Toc } from 'pliny/mdx-plugins/index.js'

// A heading becomes the current section once its top scrolls above this line. It sits below
// the 2rem scroll margin on .content-header, so a heading picked from the list is current on arrival.
const ACTIVE_OFFSET = 96

function useActiveHeading(ids: string[]) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((heading): heading is HTMLElement => heading !== null)

    const handleWindowScroll = () => {
      let current = ''
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > ACTIVE_OFFSET) break
        current = heading.id
      }
      setActiveId(current)
    }

    handleWindowScroll()
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleWindowScroll)
  }, [ids])

  return activeId
}

interface Props {
  toc: Toc
}

export default function TableOfContents({ toc }: Props) {
  const headings = useMemo(
    () => toc.filter((heading) => heading.depth === 2 || heading.depth === 3),
    [toc]
  )
  const ids = useMemo(() => headings.map((heading) => heading.url.slice(1)), [headings])
  const activeId = useActiveHeading(ids)

  if (headings.length === 0) {
    return null
  }

  const list = (
    <ul className="border-l border-gray-200 text-sm dark:border-gray-700">
      {headings.map((heading) => {
        const isActive = heading.url === `#${activeId}`
        return (
          <li key={heading.url}>
            <a
              href={heading.url}
              aria-current={isActive ? 'location' : undefined}
              className={`-ml-px block border-l-2 py-1 ${heading.depth === 3 ? 'pl-7' : 'pl-4'} ${
                isActive
                  ? 'border-primary-500 text-primary-500'
                  : 'hover:text-primary-500 dark:hover:text-primary-400 border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              {heading.value}
            </a>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <details className="group border-b border-gray-200 xl:hidden dark:border-gray-700">
        <summary className="cursor-pointer list-none py-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Contents
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
        <div className="pb-4">{list}</div>
      </details>
      <nav
        aria-label="Table of contents"
        className="sticky top-8 hidden max-h-[calc(100vh-4rem)] overflow-y-auto xl:block"
      >
        <h2 className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Contents
        </h2>
        <div className="mt-3">{list}</div>
      </nav>
    </>
  )
}
