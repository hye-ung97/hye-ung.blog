import Image from '@/components/Image'

interface Props {
  title: string
  cover?: string
  // The rendered width, so next/image can pick a file: '48px', '(min-width: 768px) 200px, 112px'
  sizes: string
  priority?: boolean
  className?: string
}

// Covers are cropped to 3:4 so editions of different shapes line up. A book without a cover image
// gets a plain block with its title, which only shows once the block is wide enough to read.
export default function BookCover({
  title,
  cover,
  sizes,
  priority = false,
  className = '',
}: Props) {
  return (
    <div
      className={`@container relative aspect-[3/4] overflow-hidden rounded-sm bg-gray-100 ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10 ${className}`}
    >
      {cover ? (
        <Image src={cover} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="hidden h-full p-3 text-sm leading-snug font-bold break-keep text-gray-600 @min-[6rem]:flex dark:text-gray-300"
        >
          {title}
        </span>
      )}
    </div>
  )
}
