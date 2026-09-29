'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ImageProps } from 'next/image'

// Space left around a zoomed image, the same as the dialog button's p-6.
const ZOOM_MARGIN = 24
// Zoom is offered only when it makes the image at least this much larger. On phones and
// portrait tablets the text column already spans the screen, so zooming would change little.
const MIN_ZOOM_GAIN = 1.2

interface Props {
  children: ReactNode
  width: ImageProps['width']
  height: ImageProps['height']
}

export default function ZoomImage({ children, width, height }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isZoomable, setIsZoomable] = useState(false)
  const [zoomedSrc, setZoomedSrc] = useState('')

  useEffect(() => {
    const image = wrapperRef.current?.querySelector('img')
    if (!image) return

    const handleWindowResize = () => {
      const shown = image.getBoundingClientRect()
      // Fit the screen, but never past the original size, where the image would blur
      const gain = Math.min(
        (window.innerWidth - 2 * ZOOM_MARGIN) / shown.width,
        (window.innerHeight - 2 * ZOOM_MARGIN) / shown.height,
        Number(width) / shown.width
      )
      setIsZoomable(gain >= MIN_ZOOM_GAIN)
    }

    handleWindowResize()
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [width])

  const zoomIn = () => {
    const image = wrapperRef.current?.querySelector('img')
    if (!image) return
    // The inline image has already downloaded the full-size file, so reuse it
    setZoomedSrc(image.currentSrc || image.src)
    dialogRef.current?.showModal()
  }

  const zoomOut = () => dialogRef.current?.close()

  return (
    <div ref={wrapperRef} className="relative">
      {children}
      {isZoomable && (
        <button
          type="button"
          aria-label="Zoom image"
          onClick={zoomIn}
          className="absolute inset-0 cursor-zoom-in"
        />
      )}
      <dialog
        ref={dialogRef}
        aria-label="Zoomed image"
        onClose={() => setZoomedSrc('')}
        onWheel={(event) => {
          // A trackpad pinch arrives as a wheel event with ctrlKey set
          if (!event.ctrlKey) zoomOut()
        }}
        className="not-prose animate-zoom-overlay m-0 h-full max-h-none w-full max-w-none border-0 bg-white/95 p-0 backdrop:bg-transparent motion-reduce:animate-none dark:bg-gray-950/98"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={zoomOut}
          className="group flex h-full w-full cursor-zoom-out items-center justify-center p-6 outline-none"
        >
          {zoomedSrc && (
            // eslint-disable-next-line @next/next/no-img-element -- next/image would request the file again
            <img
              src={zoomedSrc}
              alt=""
              width={width}
              height={height}
              className="animate-zoom-image h-auto max-h-full w-auto max-w-full motion-reduce:animate-none"
            />
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="group-focus-visible:outline-primary-500 hover:text-primary-500 dark:hover:text-primary-400 absolute top-4 right-4 h-8 w-8 cursor-default rounded-sm p-1 text-gray-900 group-focus-visible:outline-2 dark:text-gray-100"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </dialog>
    </div>
  )
}
