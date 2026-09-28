import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithSidebar'
import { allBlogs } from 'contentlayer/generated'
import categoryData from 'app/category-data.json'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

const POSTS_PER_PAGE = 5

const categories = categoryData as Record<string, { name: string; count: number }>

export async function generateMetadata(props: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const params = await props.params
  const category = decodeURI(params.category)
  const name = Object.hasOwn(categories, category) ? categories[category].name : category
  return genPageMetadata({
    title: name,
    description: `${siteMetadata.title} ${name} category`,
    alternates: {
      canonical: './',
    },
  })
}

export const generateStaticParams = async () => {
  return Object.keys(categories).map((category) => ({
    category: encodeURI(category),
  }))
}

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const category = decodeURI(params.category)

  // Return 404 for unknown categories
  if (!Object.hasOwn(categories, category)) {
    return notFound()
  }
  const filteredPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) => post.category && slug(post.category) === category))
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
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
