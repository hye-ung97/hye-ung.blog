import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import type { MDXComponents } from 'mdx/types'
import type { ImageProps } from 'next/image'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import ZoomImage from './ZoomImage'

export const components: MDXComponents = {
  // Image stays a server component so it keeps adding BASE_PATH, which the client can't read
  Image: ({ alt, width, height, ...rest }: ImageProps) => (
    <ZoomImage width={width} height={height}>
      <Image alt={alt} width={width} height={height} {...rest} />
    </ZoomImage>
  ),
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
}
