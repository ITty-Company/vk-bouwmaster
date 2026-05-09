"use client"

import { useEffect, useState } from 'react'
import { Carousel, PortfolioCard } from '@/components/ui/portfolio-gallery'
import { iPortfolioWork } from '@/components/ui/portfolio-gallery'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useTranslations } from '@/hooks/useTranslations'

export function PortfolioGallerySection() {
  const { t } = useTranslations()
  const [works, setWorks] = useState<iPortfolioWork[]>([])
  const [loading, setLoading] = useState(true)
  const sectionRef = useScrollAnimation()
  const demoWorks: iPortfolioWork[] = [
    { id: 'demo-1', title: 'Пример проекта 1', description: 'Демо карточка', mainImage: '/window.svg', category: 'Демо', images: ['/file.svg'], workDate: '2025-01-01' },
    { id: 'demo-2', title: 'Пример проекта 2', description: 'Демо карточка', mainImage: '/globe.svg', category: 'Демо', images: ['/vercel.svg'], workDate: '2025-01-01' },
    { id: 'demo-3', title: 'Пример проекта 3', description: 'Демо карточка', mainImage: '/next.svg', category: 'Демо', images: ['/file.svg'], workDate: '2025-01-01' },
    { id: 'demo-4', title: 'Пример проекта 4', description: 'Демо карточка', mainImage: '/vk-bouwmaster-logo.svg', category: 'Демо', images: ['/window.svg'], workDate: '2025-01-01' },
    { id: 'demo-5', title: 'Пример проекта 5', description: 'Демо карточка', mainImage: '/file.svg', category: 'Демо', images: ['/globe.svg'], workDate: '2025-01-01' },
    { id: 'demo-6', title: 'Пример проекта 6', description: 'Демо карточка', mainImage: '/vercel.svg', category: 'Демо', images: ['/next.svg'], workDate: '2025-01-01' },
  ]

  useEffect(() => {
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

  const fetchWorks = async () => {
    try {
      const response = await fetch('/api/works')
      if (response.ok) {
        const data = await response.json()
        const worksArray = (Array.isArray(data) ? data : []) || []
        console.log('PortfolioGallerySection: Loaded works:', worksArray.length, worksArray)
        setWorks(worksArray)
      } else {
        console.error('Failed to fetch works:', response.status)
        setWorks([])
      }
    } catch (error) {
      console.error('Error fetching works:', error)
      setWorks([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-black py-20 min-h-[400px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl leading-tight font-bold section-title">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                {t.home.works.title}
              </span>
            </h2>
            <p className="text-base md:text-xl elegant-text max-w-3xl mx-auto mt-4 text-gray-300">
              {t.home.works.description}
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </section>
    )
  }

  const validWorks = works.filter(work => 
    work && 
    work.id && 
    work.title && 
    work.mainImage && 
    work.mainImage.trim() !== ''
  )
  
  const displayWorks = validWorks.length > 0 ? validWorks : demoWorks
  console.log('PortfolioGallerySection: Total works from API:', works.length, 'Valid works:', validWorks.length, 'Displaying:', displayWorks.length)
  
  const cards = displayWorks.map((work, index) => (
    <PortfolioCard
      key={work.id}
      work={work}
      index={index}
      backgroundImage={work.mainImage}
    />
  ))

  return (
    <section ref={sectionRef} className="bg-black scroll-fade-in py-20 min-h-[400px]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl leading-tight font-bold section-title">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
              {t.home.works.title}
            </span>
          </h2>
          <p className="text-base md:text-xl elegant-text max-w-3xl mx-auto mt-4 text-gray-300">
            {t.home.works.description} {validWorks.length > 0 && `(${validWorks.length} ${validWorks.length === 1 ? t.home.works.work : validWorks.length < 5 ? t.home.works.works2 : t.home.works.works5})`}
          </p>
        </div>

        {displayWorks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>{t.portfolio?.noWorks?.title || 'No works found'}</p>
          </div>
        )}
      </div>
    </section>
  )
}

