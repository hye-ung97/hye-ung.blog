import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { getBooks } from 'lib/books'
import Main from './Main'

// One row of the home shelf at sm and up. getBooks() puts books being read first,
// then the most recently finished, so this also covers the no-reading-book case.
const HOME_BOOKS = 4

export default async function Page() {
  const sortedPosts = sortPosts(allBlogs)
  const posts = allCoreContent(sortedPosts)
  const books = getBooks().slice(0, HOME_BOOKS)
  return <Main posts={posts} books={books} />
}
