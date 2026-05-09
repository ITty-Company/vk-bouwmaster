"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from '@/hooks/useTranslations'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { iPortfolioWork } from '@/components/ui/portfolio-gallery'
import { motion } from 'framer-motion'
import { ShaderAnimation } from '@/components/ui/shader-animation'
import { GradientButton } from '@/components/ui/gradient-button'
import { Carousel, TestimonialCard } from '@/components/ui/retro-testimonial'
import { iTestimonial } from '@/components/ui/retro-testimonial'
import { useRef } from 'react'
import { translateCategory, getTranslatedWork } from '@/lib/translations'
import { IMAGE_BLUR_DATA_URL, PORTFOLIO_CARD_SIZES } from '@/lib/blur-placeholder'
import { commentsListFetchInit } from '@/lib/comments-client'

export default function PortfolioPage() {
  const { t, isInitialized, currentLanguage } = useTranslations()
  const heroRef = useScrollAnimation()
  const galleryRef = useScrollAnimation()
  const testimonialsRef = useScrollAnimation()
  const [works, setWorks] = useState<iPortfolioWork[]>([])
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Array<{id:string;name:string;surname?:string;message:string;createdAt:string;photos?:string[];videos?:string[];rating?:number;city?:string;profileImage?:string;translations?:Record<string, string>}>>([])
  

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const res = await fetch('/api/works')
        if (res.ok) {
          const data = await res.json()
          const worksArray = (Array.isArray(data) ? data : []).filter((w: iPortfolioWork) => 
            w && w.id && w.title && w.mainImage && w.mainImage.trim() !== ''
          )
          console.log('PortfolioPage: Loaded works:', worksArray.length)
          setWorks(worksArray)
        } else {
          setWorks([])
        }
      } catch (error) {
        console.error('PortfolioPage: Error fetching works:', error)
        setWorks([])
      } finally {
        setLoading(false)
      }
    }
    
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/comments', commentsListFetchInit)
        if (res.ok) {
          const list = await res.json()
          setReviews(Array.isArray(list) ? list : [])
        }
      } catch (error) {
        console.error('PortfolioPage: Error fetching reviews:', error)
      }
    }
    
    fetchWorks()
    fetchReviews()
    
    const onFocus = () => {
      fetchWorks()
      fetchReviews()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchWorks()
        fetchReviews()
      }
    }
    
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!isInitialized) {
    return (
      <div className="unified-gradient-bg">
        <section className="text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="unified-gradient-bg">
      <section className="relative overflow-hidden text-white pt-28 pb-28 hero-gradient-bg min-h-[75vh]">
        <div className="absolute inset-0 z-10 opacity-100 pointer-events-none">
          <ShaderAnimation />
        </div>
        <div className="absolute inset-0 gradient-hero opacity-70" />
        <div className="absolute -right-48 -top-48 w-[680px] h-[680px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -left-48 -bottom-48 w-[680px] h-[680px] rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-black z-30 pointer-events-none" />
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[75vh] flex flex-col justify-center text-center py-8">
          <motion.h1
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">{t.portfolio?.hero?.title || 'Моё портфолио'}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-xl md:text-2xl max-w-3xl mx-auto text-blue-100"
          >
            {t.portfolio?.hero?.subtitle || 'Изучите мои завершенные проекты и посмотрите качество моей работы'}
          </motion.p>


        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">{t.portfolio?.whyChoose?.title || 'Почему выбирают меня'}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(t.portfolio?.whyChoose?.features || [
              { icon: '🛠️', title: 'Качество', desc: 'Аккуратно, чисто и с вниманием к деталям. Использую проверенные материалы и технологии.' },
              { icon: '⏱️', title: 'Сроки', desc: 'Работаю по понятному графику. Завершаю вовремя — без сюрпризов и «завтраков».' },
              { icon: '🤝', title: 'Честность', desc: 'Прозрачные сметы и этапы. Вы всегда понимаете, за что платите.' },
              { icon: '💬', title: 'Коммуникация', desc: 'Постоянно на связи, быстро отвечаю и предлагаю решения под ваш запрос.' },
              { icon: '🧼', title: 'Чистота', desc: 'Поддерживаю порядок на объекте, защищаю мебель и покрытие, убираю за собой.' },
              { icon: '🔒', title: 'Гарантия', desc: 'Даю гарантию на выполненные работы и остаюсь на связи после сдачи.' },
            ]).map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.05 * i, duration: 0.5 }}
                className="elegant-card p-6 md:p-8 flex items-start gap-4 group"
              >
                <div className="text-3xl md:text-4xl select-none">
                  <span className="animate-bounce-slow inline-block">{c.icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 universal-title">{c.title}</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 section-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">{t.portfolio?.featured?.title || 'Мои проекты'}</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t.portfolio?.featured?.subtitle || 'Каждый проект демонстрирует мою приверженность качеству, вниманию к деталям и уверенности клиентов'}</p>
          </div>
          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-gray-300 text-xl font-medium mb-2">{t.portfolio?.noWorks?.title || 'Пока нет добавленных работ'}</p>
              <p className="text-gray-500 text-sm">{t.portfolio?.noWorks?.subtitle || 'Добавьте работы через админ-панель'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {works.map((work, i) => {
                const translated = getTranslatedWork(work, currentLanguage)
                return (
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: i * 0.04, duration: 0.5 }}
                  >
                    <Link
                      href={`/portfolio/${work.projectId || work.id}`}
                      className="elegant-card overflow-hidden block group rounded-2xl"
                    >
                      <div className="relative w-full aspect-[9/16]">
                        <Image
                          src={work.mainImage}
                          alt={translated.title}
                          fill
                          sizes={PORTFOLIO_CARD_SIZES}
                          placeholder="blur"
                          blurDataURL={IMAGE_BLUR_DATA_URL}
                          priority={i < 8}
                          quality={75}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-1 line-clamp-1">{translated.title}</h3>
                        <p className="text-blue-400 text-xs md:text-sm">{translated.category}</p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">{t.portfolio?.testimonials?.title || 'Что говорят мои клиенты'}</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t.portfolio?.testimonials?.subtitle || 'Не просто верьте на слово — прочитайте отзывы реальных клиентов'}</p>
          </div>
          {reviews.length === 0 ? (
            <div className="text-center text-gray-400">{t.portfolio?.noReviews || 'Пока нет отзывов'}</div>
          ) : (
            <Carousel
              items={reviews.map((review, idx) => {
                const testimonial: iTestimonial = {
                  id: review.id,
                  name: `${review.name} ${review.surname || ''}`.trim(),
                  designation: new Date(review.createdAt).toLocaleDateString(),
                  description: review.message,
                  profileImage: review.profileImage && review.profileImage.trim() !== '' && review.profileImage !== '/vk-bouwmaster-logo.svg' ? review.profileImage : '',
                  photos: review.photos,
                  videos: review.videos,
                  rating: review.rating,
                  city: review.city,
                  translations: (review as any).translations,
                }
                return (
                  <TestimonialCard
                    key={review.id}
                    testimonial={testimonial}
                    index={idx}
                    backgroundImage="https://images.unsplash.com/photo-1528458965990-428de4b1cb0d?q=80&w=3129&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  />
                )
              })}
            />
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
              {t.portfolio?.cta?.title || 'Готовы Начать Ваш Проект?'}
            </span>
          </h2>
          <p className="text-xl text-blue-100 mb-8">{t.portfolio?.cta?.subtitle || 'Позвольте мне преобразить ваше пространство с тем же качеством и вниманием к деталям'}</p>
          <div className="flex gap-6 flex-col sm:flex-row justify-center">
            <GradientButton asChild>
              <Link href="/contact">
                {t.common?.getQuote || 'Get Free Quote'}
              </Link>
            </GradientButton>
            <GradientButton asChild variant="variant">
              <Link href="/services">
                {t.common?.viewServices || 'View Our Services'}
              </Link>
            </GradientButton>
          </div>
        </div>
      </section>
    </div>
  );
}

