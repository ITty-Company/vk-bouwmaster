"use client"

import {useEffect, useRef, useState} from 'react'
import { UploadFallbackImage } from '@/components/ui/upload-fallback-image'
import Link from 'next/link'
import {useScrollAnimation} from '@/hooks/useScrollAnimation'
import {useTranslations} from '@/hooks/useTranslations'
import {getTranslatedWork} from '@/lib/translations'
import {IMAGE_BLUR_DATA_URL} from '@/lib/blur-placeholder'

type Work = {
  id: string
  title: string
  mainImage: string
  projectId?: string
}

export function SimpleWorksGridSection() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const sectionRef = useScrollAnimation()
  const trackRef = useRef<HTMLDivElement>(null)
  const { t, currentLanguage } = useTranslations()

  const demo: Work[] = [
    { id: 'demo-1', title: 'Работа 1', mainImage: '/uploads/1761785213606_______________2025-09-12___18.26.15.png' },
    { id: 'demo-2', title: 'Работа 2', mainImage: '/uploads/1761785213618_______________2025-07-02___15.03.47.png' },
    { id: 'demo-3', title: 'Работа 3', mainImage: '/uploads/1761785213627_______________2025-09-07___14.21.14.png' },
    { id: 'demo-4', title: 'Работа 4', mainImage: '/uploads/1761785213638_______________2025-09-07___14.47.47.png' },
    { id: 'demo-5', title: 'Работа 5', mainImage: '/uploads/1761788241650_______________2025-10-28___23.04.29.png' },
    { id: 'demo-6', title: 'Работа 6', mainImage: '/uploads/1761788226080_______________2025-10-29___20.14.36.png' },
  ]

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const res = await fetch('/api/works')
        if (res.ok) {
          const data = await res.json()
          const normalized = (Array.isArray(data) ? data : [])
            .filter((w: any) => w && w.id && w.title && w.mainImage && w.mainImage.trim() !== '')
            .map((w: any) => ({
              id: String(w.id ?? crypto.randomUUID()),
              title: String(w.title ?? 'Работа'),
              mainImage: String(w.mainImage ?? '/next.svg'),
              projectId: w.projectId ? String(w.projectId) : undefined,
            })) as Work[]
          console.log('SimpleWorksGridSection: Loaded works:', normalized.length)
          setWorks(normalized)
        } else {
          setWorks([])
        }
      } catch (error) {
        console.error('SimpleWorksGridSection: Error fetching works:', error)
        setWorks([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchWorks()
    
    const onFocus = () => fetchWorks()
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchWorks()
    }
    
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const validWorks = works.filter(w => 
    w && 
    w.id && 
    w.title && 
    w.mainImage && 
    w.mainImage.trim() !== '' &&
    w.mainImage !== '/next.svg'
  )
  
  const items = validWorks.length > 0 ? validWorks : demo

  return (
    <section ref={sectionRef} className="bg-black scroll-fade-in py-8 sm:py-12">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight font-bold section-title px-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 break-words">{t.home.works.title}</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl elegant-text max-w-3xl mx-auto mt-3 sm:mt-4 text-gray-300 px-4">
            {t.home.works.description}
            {validWorks.length > 0 && (
              <span className="block mt-2 text-blue-400 font-semibold text-sm sm:text-base">
                ({validWorks.length} {validWorks.length === 1 ? t.home.works.work : validWorks.length < 5 ? t.home.works.works2 : t.home.works.works5})
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              aria-label="Прокрутить влево"
              onClick={() => trackRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
              className="hidden sm:flex absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700 text-white shadow-lg"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <div
              ref={trackRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-2 sm:px-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {items.map((w, idx) => {
                const translated = (w as any).translations ? getTranslatedWork(w as any, currentLanguage) : { title: w.title }
                return (
                  <Link
                    key={w.id}
                    href={w.projectId ? `/portfolio/${w.projectId}` : '/portfolio'}
                    className="group relative block overflow-hidden rounded-xl sm:rounded-2xl border border-gray-800 bg-gray-900/40 flex-shrink-0 snap-start min-w-[160px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px]"
                    aria-label={`Открыть галерею проекта: ${translated.title}`}
                  >
                    <div className="relative w-full aspect-[9/16]">
                      <UploadFallbackImage
                        src={w.mainImage}
                        alt={translated.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, (max-width: 1024px) 220px, 240px"
                        placeholder="blur"
                        blurDataURL={IMAGE_BLUR_DATA_URL}
                        priority={idx < 6}
                        quality={75}
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="text-white text-sm sm:text-base font-semibold line-clamp-1 break-words">{translated.title}</div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <button
              type="button"
              aria-label="Прокрутить вправо"
              onClick={() => trackRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
              className="hidden sm:flex absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700 text-white shadow-lg"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}


