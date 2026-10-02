import { allCoreContent, sortPosts, type CoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, type Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Archive', description: 'All posts by date' })

// contentlayer stores dates in UTC, so group and label them in KST
const TIME_ZONE = 'Asia/Seoul'
const isoDate = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })
const monthName = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'long' })
const dayLabel = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
})

type Post = CoreContent<Blog>

// Posts come in newest first, so insertion order keeps years and months descending
function groupByYearAndMonth(posts: Post[]) {
  const years = new Map<string, Map<string, Post[]>>()
  for (const post of posts) {
    const [year, month] = isoDate.format(new Date(post.date)).split('-')
    const months = years.get(year) ?? new Map<string, Post[]>()
    months.set(month, [...(months.get(month) ?? []), post])
    years.set(year, months)
  }
  return years
}

export default function ArchivePage() {
  const posts = allCoreContent(sortPosts(allBlogs))
  const years = groupByYearAndMonth(posts)

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Archive
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </p>
      </div>
      <div className="space-y-10 py-8">
        {!posts.length && 'No posts found.'}
        {Array.from(years, ([year, months]) => (
          <section key={year}>
            <h2 className="text-2xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {year}
            </h2>
            {Array.from(months, ([month, monthPosts]) => (
              <div key={month} className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {monthName.format(new Date(monthPosts[0].date))}{' '}
                  <span className="font-normal text-gray-400 dark:text-gray-500">
                    ({monthPosts.length})
                  </span>
                </h3>
                <ul className="mt-2">
                  {monthPosts.map((post) => (
                    <li key={post.path} className="flex gap-4 py-1.5">
                      <time
                        dateTime={post.date}
                        className="w-14 shrink-0 text-gray-500 tabular-nums dark:text-gray-400"
                      >
                        {dayLabel.format(new Date(post.date))}
                      </time>
                      <Link
                        href={`/${post.path}`}
                        className="hover:text-primary-500 dark:hover:text-primary-400 font-medium text-gray-900 dark:text-gray-100"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
