"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from '@/hooks/useTranslations'

type Comment = {
  id: string
  projectId: string
  name: string
  surname?: string
  message: string
  createdAt: string
  photos?: string[]
  videos?: string[]
  rating?: number
  city?: string
  profileImage?: string
  translations?: Record<string, string>
}

const StarRating = ({ rating, readOnly = false }: { rating: number; readOnly?: boolean }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-2xl ${
            star <= rating ? 'text-yellow-400' : 'text-gray-500'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function ReviewMediaPage() {
  const params = useParams()
  const router = useRouter()
  const { t, currentLanguage } = useTranslations()
  const reviewId = params?.reviewId as string
  const [review, setReview] = useState<Comment | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    fetchReview()
  }, [reviewId])

  const fetchReview = async () => {
    try {
      setLoading(true)
      // Пытаемся сначала получить все отзывы (включая неодобренные) для детального просмотра
      const response = await fetch('/api/comments?includeUnapproved=1')
      if (response.ok) {
        const data = await response.json()
        const foundReview = data.find((c: Comment) => c.id === reviewId)
        if (foundReview) {
          setReview(foundReview)
        } else {
          // Если не нашли, попробуем без includeUnapproved
          const response2 = await fetch('/api/comments')
          if (response2.ok) {
            const data2 = await response2.json()
            const foundReview2 = data2.find((c: Comment) => c.id === reviewId)
            if (foundReview2) {
              setReview(foundReview2)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching review:', error)
    } finally {
      setLoading(false)
    }
  }

  const allMedia = review
    ? [
        ...(review.photos?.map((url) => ({ url, type: 'image' as const })) || []),
        ...(review.videos?.map((url) => ({ url, type: 'video' as const })) || []),
      ]
    : []

  const handleMediaClick = (index: number) => {
    setSelectedMediaIndex(index)
  }

  const handleCloseModal = () => {
    setSelectedMediaIndex(null)
  }

  const handlePrevMedia = () => {
    if (selectedMediaIndex !== null && selectedMediaIndex > 0) {
      setDirection(-1)
      setSelectedMediaIndex(selectedMediaIndex - 1)
    }
  }

  const handleNextMedia = () => {
    if (selectedMediaIndex !== null && selectedMediaIndex < allMedia.length - 1) {
      setDirection(1)
      setSelectedMediaIndex(selectedMediaIndex + 1)
    }
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedMediaIndex !== null) {
        if (e.key === 'Escape') handleCloseModal()
        if (e.key === 'ArrowLeft') handlePrevMedia()
        if (e.key === 'ArrowRight') handleNextMedia()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedMediaIndex, allMedia.length])

  if (loading) {
    return (
      <div className="unified-gradient-bg min-h-screen flex items-center justify-center pt-24">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="unified-gradient-bg min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t.reviews?.detail?.backToReviews || 'Back to reviews'}</span>
          </Link>
          <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-300 text-xl font-medium mb-2">{t.reviews?.detail?.reviewNotFound || 'Review not found'}</p>
            <p className="text-gray-500 text-sm">{(t.reviews?.detail?.reviewNotFoundSubtitle || 'Review with ID {reviewId} does not exist').replace('{reviewId}', reviewId)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (allMedia.length === 0) {
    return (
      <div className="unified-gradient-bg min-h-screen pt-16 sm:pt-20 pb-8" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>{t.reviews?.detail?.backToReviews || 'Back to reviews'}</span>
          </Link>
          
          {/* Информация об отзыве */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 sm:mb-8 md:mb-12"
          >
            <div className="mb-3 sm:mb-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 px-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 animate-gradient bg-[length:200%_auto]">
                  {review.name} {review.surname || ''}
                </span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base px-2">
                {new Date(review.createdAt).toLocaleDateString(
                  currentLanguage === 'RU' ? 'ru-RU' : 
                  currentLanguage === 'UA' ? 'uk-UA' :
                  currentLanguage === 'NL' ? 'nl-NL' :
                  currentLanguage === 'DE' ? 'de-DE' :
                  currentLanguage === 'FR' ? 'fr-FR' :
                  currentLanguage === 'ES' ? 'es-ES' :
                  currentLanguage === 'IT' ? 'it-IT' :
                  currentLanguage === 'PT' ? 'pt-PT' :
                  currentLanguage === 'PL' ? 'pl-PL' :
                  currentLanguage === 'CZ' ? 'cs-CZ' :
                  currentLanguage === 'HU' ? 'hu-HU' :
                  currentLanguage === 'RO' ? 'ro-RO' :
                  currentLanguage === 'BG' ? 'bg-BG' :
                  currentLanguage === 'HR' ? 'hr-HR' :
                  currentLanguage === 'SK' ? 'sk-SK' :
                  currentLanguage === 'SL' ? 'sl-SI' :
                  currentLanguage === 'ET' ? 'et-EE' :
                  currentLanguage === 'LV' ? 'lv-LV' :
                  currentLanguage === 'LT' ? 'lt-LT' :
                  currentLanguage === 'FI' ? 'fi-FI' :
                  currentLanguage === 'SV' ? 'sv-SE' :
                  currentLanguage === 'DA' ? 'da-DK' :
                  currentLanguage === 'NO' ? 'no-NO' :
                  currentLanguage === 'GR' ? 'el-GR' :
                  'en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {review.city && <span className="ml-2">• {review.city}</span>}
              </p>
            </div>
            {review.rating && (
              <div className="flex justify-center mb-3 sm:mb-4">
                <StarRating rating={review.rating} readOnly />
              </div>
            )}
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 border-2 border-blue-700/40 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-blue-900/20 backdrop-blur-sm">
              <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
                {review.translations && review.translations[currentLanguage] 
                  ? review.translations[currentLanguage] 
                  : review.message}
              </p>
          </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="unified-gradient-bg min-h-screen pt-16 sm:pt-20 pb-8" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        {/* Навигация назад */}
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 sm:mb-6 md:mb-8 transition-colors group text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-1 transition-transform" />
          <span>{t.reviews?.detail?.backToReviews || 'Back to reviews'}</span>
        </Link>

        {/* Информация об отзыве */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8 md:mb-12"
        >
          <div className="mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 px-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 animate-gradient bg-[length:200%_auto]">
                {review.name} {review.surname || ''}
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base px-2">
              {new Date(review.createdAt).toLocaleDateString(
                currentLanguage === 'RU' ? 'ru-RU' : 
                currentLanguage === 'UA' ? 'uk-UA' :
                currentLanguage === 'NL' ? 'nl-NL' :
                currentLanguage === 'DE' ? 'de-DE' :
                currentLanguage === 'FR' ? 'fr-FR' :
                currentLanguage === 'ES' ? 'es-ES' :
                currentLanguage === 'IT' ? 'it-IT' :
                currentLanguage === 'PT' ? 'pt-PT' :
                currentLanguage === 'PL' ? 'pl-PL' :
                currentLanguage === 'CZ' ? 'cs-CZ' :
                currentLanguage === 'HU' ? 'hu-HU' :
                currentLanguage === 'RO' ? 'ro-RO' :
                currentLanguage === 'BG' ? 'bg-BG' :
                currentLanguage === 'HR' ? 'hr-HR' :
                currentLanguage === 'SK' ? 'sk-SK' :
                currentLanguage === 'SL' ? 'sl-SI' :
                currentLanguage === 'ET' ? 'et-EE' :
                currentLanguage === 'LV' ? 'lv-LV' :
                currentLanguage === 'LT' ? 'lt-LT' :
                currentLanguage === 'FI' ? 'fi-FI' :
                currentLanguage === 'SV' ? 'sv-SE' :
                currentLanguage === 'DA' ? 'da-DK' :
                currentLanguage === 'NO' ? 'no-NO' :
                currentLanguage === 'GR' ? 'el-GR' :
                'en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {review.city && <span className="ml-2">• {review.city}</span>}
            </p>
          </div>
          {review.rating && (
            <div className="flex justify-center mb-3 sm:mb-4">
              <StarRating rating={review.rating} readOnly />
            </div>
          )}
          <div className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 border-2 border-blue-700/40 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-blue-900/20 backdrop-blur-sm">
            <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
            {review.translations && review.translations[currentLanguage] 
              ? review.translations[currentLanguage] 
              : review.message}
          </p>
          </div>
        </motion.div>

        {/* Заголовок галереи */}
        {allMedia.length > 0 && (
          <>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 md:mb-8 text-center mt-6 sm:mt-8"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
            {t.reviews?.detail?.photosAndVideos || t.reviews?.list?.photosAndVideos || 'Photos and videos from review'}
          </span>
        </motion.h2>

        {/* Галерея */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          {allMedia.map((media, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-800 cursor-pointer group relative"
              onClick={() => handleMediaClick(idx)}
            >
              {media.type === 'video' ? (
                <>
                  <video
                    src={media.url}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    playsInline
                    muted
                  />
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                    📹
                  </div>
                </>
              ) : (
                <Image
                  src={media.url}
                  alt={`Media ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
          </>
        )}
      </div>

      {/* Модальное окно для просмотра медиа */}
      <AnimatePresence>
        {selectedMediaIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {selectedMediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevMedia()
                }}
                className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
            )}

            {selectedMediaIndex < allMedia.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNextMedia()
                }}
                className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMediaIndex !== null && selectedMediaIndex < allMedia.length && (
                <>
                  {allMedia[selectedMediaIndex].type === 'video' ? (
                    <video
                      src={allMedia[selectedMediaIndex].url}
                      className="max-w-full max-h-full object-contain"
                      controls
                      autoPlay
                    />
                  ) : (
                    <Image
                      src={allMedia[selectedMediaIndex].url}
                      alt={`Media ${selectedMediaIndex + 1}`}
                      width={1200}
                      height={800}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 px-4 py-2 rounded-lg">
                    <p className="text-white text-center">
                      {selectedMediaIndex + 1} / {allMedia.length}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

