'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { slug } from 'github-slugger'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import PostDate from '@/components/PostDate'
import Tag from '@/components/Tag'
import categoryData from 'app/category-data.json'
import tagData from 'app/tag-data.json'

interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
  sidebar: 'categories' | 'tags'
}
interface SidebarItem {
  href: string
  label: string
  count: number
  ariaLabel: string
}

function getSidebarItems(sidebar: ListLayoutProps['sidebar']): SidebarItem[] {
  if (sidebar === 'tags') {
    const tagCounts = tagData as Record<string, number>
    return Object.keys(tagCounts)
      .sort((a, b) => tagCounts[b] - tagCounts[a])
      .map((t) => ({
        href: `/tags/${slug(t)}`,
        label: t,
        count: tagCounts[t],
        ariaLabel: `View posts tagged ${t}`,
      }))
  }
  const categories = categoryData as Record<string, { name: string; count: number }>
  return Object.keys(categories)
    .sort((a, b) => categories[b].count - categories[a].count)
    .map((c) => ({
      href: `/blog/category/${c}`,
      label: categories[c].name,
      count: categories[c].count,
      ariaLabel: `View posts in ${categories[c].name}`,
    }))
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/page\/\d+\/?$/, '') // Remove any trailing /page
    .replace(/\/$/, '') // Remove trailing slash
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pt-6 pb-8 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
          </Link>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithSidebar({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
  sidebar,
}: ListLayoutProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const currentPath = decodeURI(pathname)
    .replace(/\/page\/\d+\/?$/, '') // Remove any trailing /page
    .replace(/\/$/, '') // Remove trailing slash
  const sidebarItems = getSidebarItems(sidebar)

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  return (
    <>
      <div className="flex flex-col pt-6 xl:grid xl:grid-cols-[280px_minmax(0,1fr)] xl:grid-rows-[auto_1fr] xl:gap-x-24">
        <div className="pb-6 xl:col-start-2 xl:row-start-1">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {title}
          </h1>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="list-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 xl:hidden dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {sidebar === 'tags' ? 'Tags' : 'Categories'}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="h-4 w-4"
            >
              {menuOpen ? (
                <path
                  fillRule="evenodd"
                  d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>
        <div
          id="list-sidebar"
          className={`${menuOpen ? 'flex' : 'hidden'} mb-4 max-h-screen flex-wrap overflow-auto rounded-sm bg-gray-50 pt-5 shadow-md xl:col-start-1 xl:row-span-2 xl:row-start-1 xl:mb-0 xl:flex xl:self-start dark:bg-gray-900/70 dark:shadow-gray-800/40`}
        >
          <div className="px-6 py-4">
            {currentPath === '/blog' ? (
              <span aria-current="page" className="text-primary-500 font-bold uppercase">
                All Posts
              </span>
            ) : (
              <Link
                href={`/blog`}
                onClick={() => setMenuOpen(false)}
                className="hover:text-primary-500 dark:hover:text-primary-500 font-bold text-gray-700 uppercase dark:text-gray-300"
              >
                All Posts
              </Link>
            )}
            <ul>
              {sidebarItems.map(({ href, label, count, ariaLabel }) => {
                return (
                  <li key={href} className="my-3">
                    {currentPath === href ? (
                      <span
                        aria-current="page"
                        className="text-primary-500 px-3 py-2 text-sm font-bold uppercase"
                      >
                        {`${label} (${count})`}
                      </span>
                    ) : (
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="hover:text-primary-500 dark:hover:text-primary-500 px-3 py-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-300"
                        aria-label={ariaLabel}
                      >
                        {`${label} (${count})`}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <div className="xl:col-start-2 xl:row-start-2">
          <ul>
            {displayPosts.map((post) => {
              const { path, date, title, summary, tags } = post
              return (
                <li key={path} className="py-5">
                  <article className="space-y-3">
                    <div>
                      <h2 className="text-2xl leading-8 font-bold tracking-tight">
                        <Link href={`/${path}`} className="text-gray-900 dark:text-gray-100">
                          {title}
                        </Link>
                      </h2>
                      <div className="flex flex-wrap">
                        {tags?.map((tag) => (
                          <Tag key={tag} text={tag} />
                        ))}
                      </div>
                      <PostDate date={date} className="mt-2" />
                    </div>
                    <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                      {summary}
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
          {pagination && pagination.totalPages > 1 && (
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
          )}
        </div>
      </div>
    </>
  )
}
