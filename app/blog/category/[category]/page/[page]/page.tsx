import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/layouts/ListLayoutWithSidebar'
import { allBlogs } from 'contentlayer/generated'
import categoryData from 'app/category-data.json'
import { notFound } from 'next/navigation'

const POSTS_PER_PAGE = 5

const categories = categoryData as Record<string, { name: string; count: number }>

export const generateStaticParams = async () => {
  return Object.keys(categories).flatMap((category) => {
    const totalPages = Math.max(1, Math.ceil(categories[category].count / POSTS_PER_PAGE))
    return Array.from({ length: totalPages }, (_, i) => ({
      category: encodeURI(category),
      page: (i + 1).toString(),
    }))
  })
}

export default async function CategoryPage(props: {
  params: Promise<{ category: string; page: string }>
}) {
  const params = await props.params
  const category = decodeURI(params.category)
  const pageNumber = parseInt(params.page)
  const filteredPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) => post.category && slug(post.category) === category))
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)

  // Return 404 for unknown categories, invalid page numbers or empty pages
  if (
    !Object.hasOwn(categories, category) ||
    pageNumber <= 0 ||
    pageNumber > totalPages ||
    isNaN(pageNumber)
  ) {
    return notFound()
  }
  const initialDisplayPosts = filteredPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={categories[category].name}
      sidebar="categories"
    />
  )
}
