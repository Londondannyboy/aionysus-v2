'use client'

import { useState, useRef, useEffect } from 'react'

interface LazyYouTubeProps {
  videoId: string
  title: string
  className?: string
}

export function LazyYouTube({ videoId, title, className = '' }: LazyYouTubeProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleClick = () => {
    setIsLoaded(true)
  }

  const thumbnailUrl = `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`
  const thumbnailFallback = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-gray-900 ${className}`}
    >
      {isLoaded ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      ) : (
        <button
          onClick={handleClick}
          className="absolute inset-0 w-full h-full cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Play video: ${title}`}
        >
          {isInView && (
            <picture>
              <source srcSet={thumbnailUrl} type="image/webp" />
              <img
                src={thumbnailFallback}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </picture>
          )}

          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-700 group-hover:scale-110 transition-all">
              <svg className="w-7 h-7 md:w-8 md:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm md:text-base font-medium line-clamp-2">{title}</p>
          </div>
        </button>
      )}
    </div>
  )
}
