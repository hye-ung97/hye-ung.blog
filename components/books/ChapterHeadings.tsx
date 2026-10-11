'use client'

import type { Toc } from 'pliny/mdx-plugins/index.js'
import { TocList, useTocHeadings } from '@/components/TableOfContents'

// The current chapter's headings, nested under it in the book sidebar with the same scroll-spy
// as the Contents list on posts
export default function ChapterHeadings({ toc }: { toc: Toc }) {
  const { headings, activeId } = useTocHeadings(toc)
  if (headings.length === 0) return null
  return <TocList headings={headings} activeId={activeId} className="mt-1 mb-3" />
}
