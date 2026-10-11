import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'
import { getBooks, getChapters } from 'lib/books'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl

  const blogRoutes = allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/${post.path}`,
      lastModified: post.lastmod || post.date,
    }))

  const bookRoutes = getBooks().flatMap((book) => [
    { url: `${siteUrl}/${book.path}`, lastModified: book.lastActivity },
    ...getChapters(book.slug).map((chapter) => ({
      url: `${siteUrl}/${chapter.path}`,
      lastModified: chapter.lastmod || chapter.date,
    })),
  ])

  const routes = ['', 'blog', 'books', 'tags', 'archive'].map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogRoutes, ...bookRoutes]
}
