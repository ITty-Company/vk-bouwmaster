"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from '@/hooks/useTranslations'
import { GradientButton } from '@/components/ui/gradient-button'
import { Star, MessageSquare, Camera, Video, MapPin, User, CheckCircle2, Heart } from 'lucide-react'

type Comment = { id: string; projectId: string; name: string; surname?: string; message: string; createdAt: string; photos?: string[]; videos?: string[]; rating?: number; city?: string; profileImage?: string; translations?: Record<string, string> }

const StarRating = ({ rating, onRatingChange, readOnly = false }: { rating: number; onRatingChange?: (rating: number) => void; readOnly?: boolean }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onRatingChange && onRatingChange(star)}
          disabled={readOnly}
          className={`text-2xl transition-transform ${!readOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
            star <= rating ? 'text-yellow-400' : 'text-gray-500'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const { t, currentLanguage } = useTranslations()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', surname: '', message: '', rating: 5, city: '', profileImage: '' })
  const [formPhotos, setFormPhotos] = useState<string[]>([])
  const [formVideos, setFormVideos] = useState<string[]>([])

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json()
      return data.success ? data.url : null
    } catch {
      return null
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setUploading(true)
    const files = Array.from(e.target.files)
    const uploadPromises = files.map(file => handleFileUpload(file))
    const urls = (await Promise.all(uploadPromises)).filter(Boolean) as string[]
    setFormPhotos([...formPhotos, ...urls])
    setUploading(false)
    e.target.value = ''
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setUploading(true)
    const files = Array.from(e.target.files)
    const uploadPromises = files.map(file => handleFileUpload(file))
    const urls = (await Promise.all(uploadPromises)).filter(Boolean) as string[]
    setFormVideos([...formVideos, ...urls])
    setUploading(false)
    e.target.value = ''
  }

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)
    const file = e.target.files[0]
    if (file.type.startsWith('image/')) {
      const url = await handleFileUpload(file)
      if (url) {
        setForm({ ...form, profileImage: url })
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/comments')
        if (res.ok) setComments(await res.json())
      } catch {}
    })()
  }, [])

  // Прокрутка в начало страницы при показе страницы благодарности
  useEffect(() => {
    if (showThankYou) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [showThankYou])



  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const reviewsText = t.reviews || ({} as any)
    if (!form.name.trim() || !form.message.trim()) {
      setError(reviewsText.form?.fillRequiredFields || 'Please fill in name and message')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          projectId: 'general', // Используем 'general' как значение по умолчанию
          photos: formPhotos.length > 0 ? formPhotos : undefined,
          videos: formVideos.length > 0 ? formVideos : undefined,
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Сразу очищаем все поля формы после успешной отправки
        setForm({ name: '', surname: '', message: '', rating: 5, city: '', profileImage: '' })
        setFormPhotos([])
        setFormVideos([])
        setError(null)
        
        // Обновляем список отзывов в фоне (но новый отзыв появится только после подтверждения администратором)
        fetch('/api/comments')
          .then(res => res.json())
          .then(list => setComments(list))
          .catch(() => {}) // Игнорируем ошибки при обновлении списка
        
        // Прокручиваем в начало страницы и показываем страницу благодарности
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setShowThankYou(true)
        setSending(false)
      } else {
        const reviewsText = t.reviews || ({} as any)
        setError(data.error || reviewsText.form?.errorSubmitting || 'Error submitting review. Please try again.')
        setSending(false)
      }
    } catch (error) {
      console.error('Ошибка при отправке отзыва:', error)
      const reviewsText = t.reviews || ({} as any)
      setError(reviewsText.form?.errorConnection || 'Error submitting review. Please check your internet connection and try again.')
      setSending(false)
    }
  }

  // Получаем актуальные переводы каждый раз при рендере
  // Используем currentLanguage как зависимость для принудительного обновления
  const reviewsText = (t.reviews || {
    hero: { badge: 'Your opinion matters to us', title: 'Customer Reviews', subtitle: 'Share your experience working with us. Your reviews help other clients make decisions.' },
    form: {
      title: 'Leave a review',
      namePlaceholder: 'Name',
      surnamePlaceholder: 'Surname (optional)',
      profileImageLabel: 'Profile photo',
      profileImageOptional: '(optional)',
      addProfileImage: 'Add profile photo',
      changePhoto: 'Change photo',
      deletePhoto: 'Delete photo',
      cityLabel: 'City',
      cityOptional: '(optional)',
      cityPlaceholder: 'In which city was the order placed?',
      ratingLabel: 'Rating',
      ratingRequired: '(required)',
      reviewLabel: 'Your review',
      reviewPlaceholder: 'Tell us about your experience...',
      charactersLeft: 'Characters left:',
      goodReview: 'Good review!',
      addPhotosLabel: 'Add photos',
      addPhotosOptional: '(optional)',
      selectPhotos: '📷 Select photos',
      photosUploaded: 'Photos uploaded:',
      addVideosLabel: 'Add videos',
      addVideosOptional: '(optional)',
      selectVideos: '🎥 Select videos',
      videosUploaded: 'Videos uploaded:',
      deleteVideo: 'Delete video',
      submitting: 'Submitting…',
      submitButton: 'Submit review',
      reviewWillAppear: 'Review will appear after administrator approval'
    },
    list: {
      title: 'All reviews',
      review: 'review',
      reviews2: 'reviews',
      reviews5: 'reviews',
      noReviews: 'No reviews yet. Be the first!',
      photosAndVideos: 'Photos and videos from review',
      viewAllMedia: 'View all photos and videos →'
    }
  }) as typeof t.reviews

  // Если показывается страница благодарности
  if (showThankYou) {
    // Используем переводы, если они доступны, иначе fallback на EN
    const thankYouText = t.thankYou || {
      title: 'Thank you for your review!',
      message1: 'I am very happy that you shared your experience!',
      message2: 'I always strive to be better for you. Your review will help me become even better.',
      backToReviews: 'Back to reviews'
    }

    return (
      <div className="unified-gradient-bg fixed inset-0 z-50 text-white flex items-center justify-center overflow-auto" style={{ minHeight: '100vh', width: '100vw' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40 w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-8"
            >
              <CheckCircle2 className="h-12 w-12 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 animate-gradient bg-[length:200%_auto]">
                {thankYouText.title}
              </span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center justify-center mb-8"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
              >
                <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 border-2 border-blue-700/40 rounded-2xl p-8 md:p-12 mb-8"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="text-gray-200 text-xl md:text-2xl mb-4 leading-relaxed"
              >
                {thankYouText.message1}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="text-gray-300 text-lg md:text-xl leading-relaxed"
              >
                {thankYouText.message2}
              </motion.p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <GradientButton
                onClick={() => {
                  setShowThankYou(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="text-lg px-8 py-4"
              >
                {thankYouText.backToReviews}
              </GradientButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="unified-gradient-bg min-h-screen text-white pt-32 sm:pt-40 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-3 mb-4 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-full"
          >
            <MessageSquare className="h-5 w-5 text-blue-300" />
            <span className="text-blue-200 text-sm font-medium">{reviewsText.hero?.badge || 'Your opinion matters to us'}</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 animate-gradient bg-[length:200%_auto]">
              {reviewsText.hero?.title || 'Customer Reviews'}
            </span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {reviewsText.hero?.subtitle || 'Share your experience working with us. Your reviews help other clients make decisions.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <motion.form 
            onSubmit={submitComment} 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 border-2 border-blue-700/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl shadow-blue-900/20 backdrop-blur-sm order-2 lg:order-1 hover:border-blue-600/60 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {reviewsText.form?.title || 'Leave a review'}
              </h2>
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-200 text-sm mb-4"
              >
                {error}
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className="bg-black/70 text-white border border-gray-700 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                  placeholder={reviewsText.form?.namePlaceholder || 'Name'}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
                <input
                  className="bg-black/70 text-white border border-gray-700 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                  placeholder={reviewsText.form?.surnamePlaceholder || 'Surname (optional)'}
                  value={form.surname}
                  onChange={e => setForm(f => ({ ...f, surname: e.target.value }))}
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-sm font-medium mb-2 text-white flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" />
                <span>{reviewsText.form?.profileImageLabel || 'Profile photo'} <span className="text-gray-400 text-xs">{reviewsText.form?.profileImageOptional || '(optional)'}</span></span>
              </label>
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  disabled={uploading}
                  id="profile-image-upload"
                  className="hidden"
                />
                <GradientButton
                  type="button"
                  onClick={() => document.getElementById('profile-image-upload')?.click()}
                  disabled={uploading}
                  className="text-sm"
                >
                  {uploading ? (t.common?.loading || 'Loading...') : form.profileImage ? (reviewsText.form?.changePhoto || 'Change photo') : (reviewsText.form?.addProfileImage || 'Add profile photo')}
                </GradientButton>
              </div>
              <div className="relative inline-block mb-1 mt-3">
                {form.profileImage && form.profileImage !== '/vk-bouwmaster-logo.svg' && form.profileImage.trim() !== '' ? (
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-700">
                      <Image src={form.profileImage} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, profileImage: '' })}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-200 hover:scale-110 z-10 border-2 border-gray-900"
                      title={reviewsText.form?.deletePhoto || 'Delete photo'}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-700 bg-black flex items-center justify-center">
                    <span className="text-[8px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 text-center leading-tight px-2 uppercase tracking-tight">
                      VK BOUWMASTER
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium mb-2 text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>{reviewsText.form?.cityLabel || 'City'} <span className="text-gray-400 text-xs">{reviewsText.form?.cityOptional || '(optional)'}</span></span>
              </label>
              <input
                className="bg-black/70 text-white border border-gray-700 rounded-lg px-4 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                placeholder={reviewsText.form?.cityPlaceholder || 'In which city was the order placed?'}
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <label className="block text-sm font-medium mb-3 text-white flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span>{reviewsText.form?.ratingLabel || 'Rating'} <span className="text-gray-400 text-xs">{reviewsText.form?.ratingRequired || '(required)'}</span></span>
              </label>
              <div className="p-4 bg-black/40 rounded-lg border border-gray-700/50">
                <StarRating rating={form.rating} onRatingChange={(rating) => setForm(f => ({ ...f, rating }))} />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2 text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <span>{reviewsText.form?.reviewLabel || 'Your review'}</span>
              </label>
              <textarea
                className="bg-black/70 text-white border border-gray-700 rounded-lg px-4 py-3 w-full min-h-[150px] text-base resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                placeholder={reviewsText.form?.reviewPlaceholder || 'Tell us about your experience...'}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                maxLength={2000}
                required
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">{reviewsText.form?.charactersLeft || 'Characters left:'} {2000 - form.message.length}</p>
                {form.message.length > 100 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-green-400 flex items-center gap-1"
                  >
                    ✓ {reviewsText.form?.goodReview || 'Good review!'}
                  </motion.p>
                )}
              </div>
            </motion.div>
            
            {/* Photo Upload */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-blue-900/20 border border-blue-700/30 rounded-xl p-4 hover:border-blue-600/50 transition-all"
            >
              <label className="block text-sm font-medium mb-3 text-white flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-400" />
                <span>{reviewsText.form?.addPhotosLabel || 'Add photos'} <span className="text-gray-400 text-xs">{reviewsText.form?.addPhotosOptional || '(optional)'}</span></span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  id="photo-upload-reviews"
                  className="hidden"
                />
                <GradientButton
                  type="button"
                  onClick={() => document.getElementById('photo-upload-reviews')?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (t.common?.loading || 'Loading...') : (reviewsText.form?.selectPhotos || '📷 Select photos')}
                </GradientButton>
              </div>
              {formPhotos.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">{reviewsText.form?.photosUploaded || 'Photos uploaded:'} {formPhotos.length}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {formPhotos.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group">
                        <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormPhotos(formPhotos.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          title={reviewsText.form?.deletePhoto || 'Delete photo'}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Video Upload */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-cyan-900/20 via-blue-900/20 to-cyan-900/20 border border-cyan-700/30 rounded-xl p-4 hover:border-cyan-600/50 transition-all"
            >
              <label className="block text-sm font-medium mb-3 text-white flex items-center gap-2">
                <Video className="h-4 w-4 text-cyan-400" />
                <span>{reviewsText.form?.addVideosLabel || 'Add videos'} <span className="text-gray-400 text-xs">{reviewsText.form?.addVideosOptional || '(optional)'}</span></span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  disabled={uploading}
                  id="video-upload-reviews"
                  className="hidden"
                />
                <GradientButton
                  type="button"
                  variant="variant"
                  onClick={() => document.getElementById('video-upload-reviews')?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (t.common?.loading || 'Loading...') : (reviewsText.form?.selectVideos || '🎥 Select videos')}
                </GradientButton>
              </div>
              {formVideos.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">{reviewsText.form?.videosUploaded || 'Videos uploaded:'} {formVideos.length}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formVideos.map((url, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-700 group">
                        <video src={url} controls className="w-full aspect-video bg-black" />
                        <button
                          type="button"
                          onClick={() => setFormVideos(formVideos.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          title={reviewsText.form?.deleteVideo || 'Delete video'}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-blue-900/20 border border-blue-700/30 rounded-xl p-4"
            >
              <GradientButton
                type="submit"
                disabled={sending || uploading}
                className="w-full text-base py-3"
              >
                {sending || uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {reviewsText.form?.submitting || 'Submitting…'}
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {reviewsText.form?.submitButton || 'Submit review'}
                  </span>
                )}
              </GradientButton>
              <p className="text-xs text-gray-400 mt-3 text-center flex items-center justify-center gap-1">
                <span>✓</span>
                <span>{reviewsText.form?.reviewWillAppear || 'Review will appear after administrator approval'}</span>
              </p>
            </motion.div>
          </motion.form>

          {/* List of all reviews */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                  {reviewsText.list?.title || 'All reviews'}
                </span>
              </h2>
              <div className="px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-full">
                <span className="text-blue-200 text-sm font-medium">
                  {comments.length} {comments.length === 1 
                    ? (reviewsText.list?.review || 'review')
                    : comments.length < 5 
                      ? (reviewsText.list?.reviews2 || 'reviews')
                      : (reviewsText.list?.reviews5 || 'reviews')
                  }
                </span>
              </div>
            </div>
            {comments.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-gray-400 text-center py-12 bg-gray-900/40 border border-gray-800 rounded-xl"
              >
                {reviewsText.list?.noReviews || 'No reviews yet. Be the first!'}
              </motion.div>
            ) : (
              <div className="space-y-8">
                {comments.map((c, index) => {
                  const allMedia = [
                    ...(c.photos?.map((url) => ({ url, type: 'image' as const })) || []),
                    ...(c.videos?.map((url) => ({ url, type: 'video' as const })) || []),
                  ]
                  
                  return (
                    <motion.div 
                      key={c.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 border-2 border-blue-700/40 rounded-2xl p-6 shadow-2xl shadow-blue-900/20 backdrop-blur-sm hover:border-blue-600/60 transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        if (c.id) {
                          router.push(`/reviews/${c.id}`)
                        }
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-black/60 border-2 border-blue-500/30 flex items-center justify-center">
                          {c.profileImage && c.profileImage !== '/vk-bouwmaster-logo.svg' && c.profileImage.trim() !== '' ? (
                            <Image src={c.profileImage} alt={c.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-2 bg-black">
                              <span className="text-[8px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 text-center leading-tight px-1 uppercase tracking-tight">
                                VK BOUWMASTER
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                              {c.name} {c.surname || ''}
                            </span>
                          </h3>
                          <div className="text-gray-400 text-sm mb-2">
                            {new Date(c.createdAt).toLocaleDateString(
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
                            {c.city && <span className="ml-2">• {c.city}</span>}
                          </div>
                          {c.rating && (
                            <div className="mb-3">
                              <StarRating rating={c.rating} readOnly />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message */}
                      <div className="mb-4">
                        <p className="text-white text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                          {c.translations && c.translations[currentLanguage] 
                                ? c.translations[currentLanguage] 
                            : c.message}
                        </p>
                      </div>

                      {/* Photos and Videos */}
                      {allMedia.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                              {reviewsText.list?.photosAndVideos || 'Photos and videos from review'} ({allMedia.length})
                            </span>
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {allMedia.map((media, idx) => (
                              <Link 
                                key={idx}
                                href={`/reviews/${c.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-800 cursor-pointer group relative"
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
                                  <>
                                    <Image
                                      src={media.url}
                                      alt={`Media ${idx + 1}`}
                                      fill
                                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </>
                                )}
                              </Link>
                            ))}
                          </div>
                          <Link 
                            href={`/reviews/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                          >
                            <span>{reviewsText.list?.viewAllMedia || 'View all photos and videos →'}</span>
                          </Link>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-800/50"></div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}


