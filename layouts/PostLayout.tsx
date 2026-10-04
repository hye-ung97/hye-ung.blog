import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import PostDate from '@/components/PostDate'
import SectionContainer from '@/components/SectionContainer'
import Image from '@/components/Image'
import Tag from '@/components/Tag'
import TableOfContents from '@/components/TableOfContents'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import CopyLinkButton from '@/components/CopyLinkButton'

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  shareUrl: string
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
}

export default function PostLayout({
  content,
  authorDetails,
  shareUrl,
  next,
  prev,
  children,
}: LayoutProps) {
  const { path, slug, date, title, tags, toc } = content
  const basePath = path.split('/')[0]

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <header className="pt-6 pb-10">
            <div className="space-y-3 text-center">
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
              <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-2">
                <PostDate date={date} className="min-h-11" />
                <CopyLinkButton key={shareUrl} url={shareUrl} tooltipPlacement="bottom" />
              </div>
            </div>
            <dl className="pt-6">
              <dt className="sr-only">Authors</dt>
              <dd>
                <ul className="flex flex-wrap justify-center gap-4 sm:space-x-12">
                  {authorDetails.map((author) => (
                    <li className="flex items-center space-x-2" key={author.name}>
                      {author.avatar && (
                        <Image
                          src={author.avatar}
                          width={38}
                          height={38}
                          alt="avatar"
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <dl className="text-sm leading-5 font-medium whitespace-nowrap">
                        <dt className="sr-only">Name</dt>
                        <dd className="text-gray-900 dark:text-gray-100">{author.name}</dd>
                        <dt className="sr-only">Twitter</dt>
                        <dd>
                          {author.twitter && (
                            <Link
                              href={author.twitter}
                              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                            >
                              {author.twitter
                                .replace('https://twitter.com/', '@')
                                .replace('https://x.com/', '@')}
                            </Link>
                          )}
                        </dd>
                      </dl>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          </header>
          <div className="pb-8 xl:grid xl:grid-cols-4 xl:gap-x-6">
            <aside className="xl:col-start-4 xl:row-start-1 xl:pt-10">
              <TableOfContents toc={toc} />
            </aside>
            <div className="divide-y divide-gray-200 xl:col-span-3 xl:col-start-1 xl:row-start-1 dark:divide-gray-700">
              <div className="prose dark:prose-invert max-w-none pt-10 pb-8">{children}</div>
              <footer>
                <div className="py-4">
                  <CopyLinkButton key={shareUrl} url={shareUrl} />
                </div>
                <div className="text-sm leading-5 font-medium">
                  {tags && (
                    <div className="py-4">
                      <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                        Tags
                      </h2>
                      <div className="flex flex-wrap">
                        {tags.map((tag) => (
                          <Tag key={tag} text={tag} />
                        ))}
                      </div>
                    </div>
                  )}
                  {(next || prev) && (
                    <div className="flex justify-between gap-4 py-4">
                      {prev && prev.path && (
                        <div>
                          <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                            Previous Article
                          </h2>
                          <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                            <Link href={`/${prev.path}`}>{prev.title}</Link>
                          </div>
                        </div>
                      )}
                      {next && next.path && (
                        <div className="ml-auto text-right">
                          <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                            Next Article
                          </h2>
                          <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                            <Link href={`/${next.path}`}>{next.title}</Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="pt-4 pb-6">
                  <Link
                    href={`/${basePath}`}
                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                    aria-label="Back to the blog"
                  >
                    &larr; Back to the blog
                  </Link>
                </div>
              </footer>
              {siteMetadata.comments && (
                <div
                  className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300"
                  id="comment"
                >
                  <Comments slug={slug} />
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
