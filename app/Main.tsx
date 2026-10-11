import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import type { ShelfBook } from 'lib/books'
import Link from '@/components/Link'
import PostDate from '@/components/PostDate'
import BookCard from '@/components/books/BookCard'
import siteMetadata from '@/data/siteMetadata'

const MAX_DISPLAY = 5

// The shelf is two columns on phones and four from sm up, inside SectionContainer's
// max-w-3xl (720px of content) or, from xl, max-w-5xl.
const BOOK_COVER_SIZES = '(min-width: 1280px) 238px, (min-width: 640px) 162px, 50vw'

const sectionLink = 'text-primary-500 hover:text-primary-600 dark:hover:text-primary-400'

interface Props {
  posts: CoreContent<Blog>[]
  books: ShelfBook[]
}

export default function Home({ posts, books }: Props) {
  return (
    <>
      {/* The header already shows the site name, so the page's h1 is for screen readers and search only. */}
      <h1 className="sr-only">{siteMetadata.headerTitle}</h1>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <section aria-labelledby="recent-posts" className="pt-6 pb-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="recent-posts"
              className="text-2xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100"
            >
              Recent posts
            </h2>
            {posts.length > MAX_DISPLAY && (
              <Link href="/blog" className={`text-sm font-medium ${sectionLink}`}>
                All posts &rarr;
              </Link>
            )}
          </div>
          <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
            {!posts.length && <li className="py-4">No posts found.</li>}
            {posts.slice(0, MAX_DISPLAY).map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </ul>
        </section>
        {books.length > 0 && (
          <section aria-labelledby="books" className="py-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2
                id="books"
                className="text-2xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100"
              >
                Books
              </h2>
              <Link href="/books" className={`text-sm font-medium ${sectionLink}`}>
                책장 &rarr;
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
              {books.map((book) => (
                <li key={book.slug}>
                  <BookCard book={book} headingAs="h3" sizes={BOOK_COVER_SIZES} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}

function PostRow({ post }: { post: CoreContent<Blog> }) {
  const { date, title } = post

  // From sm up the date sits in its own column, sized for the icon plus the longest
  // en-US date ("September 30, 2026", about 9.6rem); on phones it goes above the title.
  return (
    <li className="py-4 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
      <PostDate date={date} className="whitespace-nowrap" />
      <Link
        href={`/blog/${post.slug}`}
        className="hover:text-primary-500 dark:hover:text-primary-400 mt-1 block font-medium text-gray-900 sm:mt-0 dark:text-gray-100"
      >
        {title}
      </Link>
    </li>
  )
}
