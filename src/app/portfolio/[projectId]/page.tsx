"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { AnimatePresence, motion } from 'framer-motion'
import { iPortfolioWork } from '@/components/ui/portfolio-gallery'
import { GradientButton } from '@/components/ui/gradient-button'
import { useTranslations } from '@/hooks/useTranslations'
import { getCommentDisplayMessage } from '@/lib/comment-display'
import { translateCategory, getTranslatedWork } from '@/lib/translations'
import { GALLERY_GRID_SIZES, IMAGE_BLUR_DATA_URL } from '@/lib/blur-placeholder'
import { commentsListFetchInit } from '@/lib/comments-client'
import { subscribeCommentsRefresh } from '@/lib/comments-sync'
import { UploadFallbackImage } from '@/components/ui/upload-fallback-image'
type Comment = { id: string; projectId: string; name: string; surname?: string; message: string; createdAt: string; photos?: string[]; videos?: string[]; rating?: number; city?: string; profileImage?: string; translations?: Record<string, string> }

export default function PortfolioDetailPage() {
  const { t, currentLanguage } = useTranslations()
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string
  const [projectWorks, setProjectWorks] = useState<iPortfolioWork[]>([])
  const [allWorks, setAllWorks] = useState<iPortfolioWork[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'project' | 'all'>('project')
  const [comments, setComments] = useState<Comment[]>([])
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', surname: '', message: '', rating: 5, city: '', profileImage: '' })
  const [formPhotos, setFormPhotos] = useState<string[]>([])
  const sectionRef = useScrollAnimation()
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

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
    fetchWorks()
    fetchComments()

    const unsubSync = subscribeCommentsRefresh(() => {
      fetchWorks()
      fetchComments()
    })

    const onFocus = () => {
      fetchWorks()
      fetchComments()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchWorks()
        fetchComments()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    const poll = setInterval(fetchComments, 15_000)

    return () => {
      unsubSync()
      clearInterval(poll)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [projectId, currentLanguage]) // Добавляем currentLanguage, чтобы обновлять при смене языка

  const fetchWorks = async () => {
    try {
      const response = await fetch('/api/works')
      if (response.ok) {
        const data = await response.json()
        setAllWorks(data)
        
        if (projectId) {
          const project = data.filter((work: iPortfolioWork) => 
            work.projectId === projectId || work.id === projectId
          )
          
          if (project.length > 0) {
            const foundProjectId = project[0].projectId
            if (foundProjectId) {
              const allProjectWorks = data.filter((work: iPortfolioWork) => 
                work.projectId === foundProjectId
              )
              setProjectWorks(allProjectWorks)
            } else {
              setProjectWorks(project)
            }
            setViewMode('project')
          } else {
            setProjectWorks([])
            setViewMode('project')
          }
        } else {
          const grouped = groupByProject(data)
          setProjectWorks(grouped)
          setViewMode('all')
        }
      }
    } catch (error) {
      console.error('Error fetching works:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupByProject = (works: iPortfolioWork[]) => {
    const groups: Record<string, iPortfolioWork[]> = {}
    works.forEach(work => {
      const key = work.projectId || 'un grouped'
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(work)
    })
    return Object.values(groups).flat()
  }

  const getAllMedia = () => {
    const media: Array<{ url: string; title: string; workId: string }> = []
    const source = viewMode === 'project' ? projectWorks : allWorks

    source.forEach(work => {
      const translated = getTranslatedWork(work, currentLanguage)
      if (work.images && Array.isArray(work.images) && work.images.length > 0) {
        work.images.forEach(img => {
          if (img) {
            media.push({
              url: img,
              title: translated.title,
              workId: work.id,
            })
          }
        })
      }
    })

    return media
  }

  const allMedia = getAllMedia()
  
  const projectInfo = projectWorks.length > 0 ? (() => {
    const firstWork = projectWorks[0]
    const translated = getTranslatedWork(firstWork, currentLanguage)
    return {
      ...firstWork,
      title: translated.title,
      description: projectWorks.length > 1 
        ? projectWorks.map(w => {
            const t = getTranslatedWork(w, currentLanguage)
            return t.description
          }).filter(Boolean).join('\n\n')
        : translated.description,
      category: translated.category,
      city: translated.city
    }
  })() : null

  async function fetchComments() {
    try {
      if (!projectId) return
      const res = await fetch(`/api/comments?projectId=${encodeURIComponent(projectId)}`, commentsListFetchInit)
      if (res.ok) setComments(await res.json())
    } catch {}
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId || !form.name.trim() || !form.message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: form.name,
          surname: form.surname,
          message: form.message,
          photos: formPhotos.length > 0 ? formPhotos : undefined,
          rating: form.rating,
          city: form.city || undefined,
          profileImage: form.profileImage || undefined,
        }),
      })
      if (res.ok) {
        setForm({ name: '', surname: '', message: '', rating: 5, city: '', profileImage: '' })
        setFormPhotos([])
        await fetchComments()
      }
    } finally {
      setSending(false)
    }
  }

  const handleMediaClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseModal = () => {
    setSelectedImageIndex(null)
  }

  const handlePrevMedia = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + allMedia.length) % allMedia.length)
    }
  }

  const handleNextMedia = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % allMedia.length)
    }
  }


  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImageIndex !== null) {
        if (e.key === 'Escape') handleCloseModal()
        if (e.key === 'ArrowLeft') handlePrevMedia()
        if (e.key === 'ArrowRight') handleNextMedia()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImageIndex, allMedia.length])

  if (loading) {
    return (
      <div className="unified-gradient-bg min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (viewMode === 'project' && projectWorks.length === 0) {
    return (
      <div className="unified-gradient-bg min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            href="/portfolio" 
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t.portfolio?.detail?.backToProjects || 'Back to projects'}</span>
          </Link>
          <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-300 text-xl font-medium mb-2">{t.portfolio?.detail?.projectNotFound || 'Project not found'}</p>
            <p className="text-gray-500 text-sm">{(t.portfolio?.detail?.projectNotFoundSubtitle || 'Project with ID {projectId} does not exist or has been deleted').replace('{projectId}', projectId)}</p>
          </div>
        </div>
      </div>
    )
  }

  const groupedByProject: Record<string, iPortfolioWork[]> = {}
  if (viewMode === 'all') {
    allWorks.forEach(work => {
      const key = work.projectId || (t.portfolio?.detail?.noProject || 'Without project')
      if (!groupedByProject[key]) {
        groupedByProject[key] = []
      }
      groupedByProject[key].push(work)
    })
  }

  return (
    <div className="unified-gradient-bg">
      <section className="text-white py-12 pt-28 sm:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link 
              href="/portfolio" 
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-all duration-300 hover:gap-3 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span>{t.portfolio?.detail?.backToProjects || 'Back to projects'}</span>
            </Link>
          </motion.div>
          {viewMode === 'project' && projectInfo && (
            <div className="mb-16">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-block mb-6"
                >
                  <span className="px-6 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-semibold uppercase tracking-wider backdrop-blur-sm">
                    {t.portfolio?.detail?.oneOfWork || '✨ One of our works'}
                  </span>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold mb-4 leading-tight line-clamp-2"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 via-cyan-300 to-blue-200 animate-gradient bg-[length:200%_auto]">
                    {projectInfo.title || (t.portfolio?.detail?.project || 'Project')}
                  </span>
                </motion.h1>

                {projectInfo.category && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="mb-8"
                  >
                    <span className="inline-block px-5 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-purple-300 text-lg font-medium">
                      {translateCategory(projectInfo.category, currentLanguage)}
                    </span>
                  </motion.div>
                )}

                {projectInfo.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="max-w-3xl mx-auto mb-8"
                  >
                    <div
                      className={`text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed ${
                        isDescriptionExpanded ? 'whitespace-pre-wrap' : 'line-clamp-5'
                      }`}
                    >
                      {isDescriptionExpanded ? projectInfo.description : projectInfo.description.replace(/\n+/g, ' ')}
                    </div>
                    {projectInfo.description.trim().length > 220 && (
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setIsDescriptionExpanded(v => !v)}
                          className="text-blue-300 hover:text-blue-200 text-sm font-semibold underline underline-offset-4"
                        >
                          {isDescriptionExpanded ? 'Свернуть' : 'Показать полностью'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-8"
                >
                  {projectInfo.workDate && (
                    <motion.div 
                      className="flex items-center gap-3 group"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9, duration: 0.4 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/20">
                        <svg className="w-6 h-6 text-purple-400 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{t.portfolio?.detail?.date || 'Date'}</p>
                        <p className="text-lg font-bold text-white">
                          {new Date(projectInfo.workDate).toLocaleDateString(currentLanguage === 'RU' ? 'ru-RU' : currentLanguage === 'UA' ? 'uk-UA' : 'en-US', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {projectInfo.city && (
                    <motion.div 
                      className="flex items-center gap-3 group"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.0, duration: 0.4 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-green-500/20">
                        <svg className="w-6 h-6 text-green-400 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{t.portfolio?.detail?.city || 'City'}</p>
                        <p className="text-lg font-bold text-white">{projectInfo.city}</p>
                      </div>
                    </motion.div>
                  )}

                  <motion.div 
                    className="flex items-center gap-3 group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-yellow-500/20">
                      <svg className="w-6 h-6 text-yellow-400 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{t.portfolio?.detail?.photos || 'Photos'}</p>
                      <motion.p 
                        className="text-2xl font-bold text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                      >
                        {projectWorks.reduce((total, work) => total + (work.images?.length || 0), 0)}
                      </motion.p>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {viewMode === 'project' && (
        <section className="bg-black py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                {t.portfolio?.detail?.allPhotosAndVideos || 'All photos from the project'}
              </span>
            </h2>
            {allMedia.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allMedia.map((media, idx) => (
                  <motion.div
                    key={`grid-${media.workId}-${idx}`}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-800 cursor-pointer group relative"
                    onClick={() => handleMediaClick(idx)}
                  >
                    <UploadFallbackImage
                      src={media.url}
                      alt={media.title}
                      fill
                      sizes={GALLERY_GRID_SIZES}
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      placeholder="blur"
                      blurDataURL={IMAGE_BLUR_DATA_URL}
                      priority={idx < 10}
                      quality={75}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-300 text-xl font-medium mb-2">{t.portfolio?.detail?.noMedia || 'No photos yet'}</p>
                <p className="text-gray-500 text-sm">{t.portfolio?.detail?.noMediaSubtitle || 'Add photos in the admin panel'}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {viewMode === 'all' && (
        <section ref={sectionRef} className="bg-black scroll-fade-in py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              {Object.entries(groupedByProject).map(([projectKey, works], projectIdx) => (
                <motion.div
                  key={projectKey}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: projectIdx * 0.1 }}
                  className="elegant-card p-8"
                >
                  <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                    {projectKey}
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {works.map((work, workIdx) => {
                      const translated = getTranslatedWork(work, currentLanguage)
                      return (
                        <div key={work.id} className="space-y-4">
                          <h3 className="text-xl font-bold text-white">{translated.title}</h3>
                          
                          <div className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform">
                            <UploadFallbackImage
                              src={work.mainImage}
                              alt={translated.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              placeholder="blur"
                              blurDataURL={IMAGE_BLUR_DATA_URL}
                              className="object-cover"
                            />
                          </div>
                          
                          {translated.description && (
                            <p className="text-gray-300 text-sm line-clamp-2">{translated.description}</p>
                          )}
                          
                          {work.images && work.images.length > 0 && (
                            <Link 
                              href={`/portfolio/${work.projectId || work.id}`}
                              className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
                            >
                              {(t.portfolio?.detail?.viewAllPhotos || 'View all photos ({count})').replace('{count}', String(work.images.length + 1))}
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {viewMode === 'project' && (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                {t.portfolio?.detail?.comments || 'Comments'}
              </span>
            </h2>
            {comments.length === 0 ? (
              <p className="text-gray-400 mb-6 text-center">{t.portfolio?.detail?.noComments || 'No comments yet. Be the first!'}</p>
            ) : (
              <div className="space-y-5 mb-10">
                {comments.map(c => (
                  <div key={c.id} className="bg-gray-900/70 border border-gray-800 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-black/60 border border-gray-700 flex items-center justify-center">
                        {c.profileImage && c.profileImage !== '/vk-bouwmaster-logo.svg' && c.profileImage.trim() !== '' ? (
                          <Image src={c.profileImage} alt={c.name} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-1 bg-black">
                            <span className="text-[6px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 text-center leading-tight px-0.5 uppercase tracking-tight">
                              VK BOUWMASTER
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-300">
                          <span className="font-semibold text-white">{c.name} {c.surname ? c.surname : ''}</span>
                          <span className="text-gray-500 ml-2">• {new Date(c.createdAt).toLocaleDateString(currentLanguage === 'RU' ? 'ru-RU' : currentLanguage === 'UA' ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          {c.city && <span className="text-gray-500 ml-2">• {c.city}</span>}
                        </div>
                        {c.rating && (
                          <div className="mt-1">
                            <StarRating rating={c.rating} readOnly />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-white whitespace-pre-wrap mb-2 text-base leading-relaxed">
                      {getCommentDisplayMessage(c, currentLanguage)}
                    </div>
                    {(c.photos && c.photos.length > 0) || (c.videos && c.videos.length > 0) ? (
                      <div className="mt-3">
                        {c.photos && c.photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {c.photos.map((photo, idx) => (
                              <div key={idx} className="relative aspect-square rounded overflow-hidden">
                                <Image src={photo} alt={`Photo ${idx + 1}`} fill sizes="120px" className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                        {c.videos && c.videos.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {c.videos.map((video, idx) => (
                              <video key={idx} src={video} controls className="w-full rounded" />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={submitComment} className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 border-2 border-blue-700/40 rounded-2xl p-6 space-y-5 shadow-2xl shadow-blue-900/20 backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t.reviews?.form?.namePlaceholder || 'Name'}
                  className="bg-black/70 text-white border border-gray-700 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <input
                  value={form.surname}
                  onChange={e => setForm(f => ({ ...f, surname: e.target.value }))}
                  placeholder={t.reviews?.form?.surnamePlaceholder || 'Surname (optional)'}
                  className="bg-black/70 text-white border border-gray-700 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  {t.portfolio?.detail?.profileImageLabel || 'Profile photo'} <span className="text-gray-400 text-xs">({t.portfolio?.detail?.profileImageOptional || 'optional'})</span>
                </label>
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    disabled={uploading}
                    id="profile-image-upload-project"
                    className="hidden"
                  />
                  <GradientButton
                    type="button"
                    onClick={() => document.getElementById('profile-image-upload-project')?.click()}
                    disabled={uploading}
                    className="text-sm"
                  >
                    {uploading ? (t.common?.loading || 'Loading...') : form.profileImage ? (t.portfolio?.detail?.changePhoto || 'Change photo') : (t.portfolio?.detail?.addProfileImage || 'Add profile photo')}
                  </GradientButton>
                </div>
                <div className="relative mb-2">
                  {form.profileImage && form.profileImage !== '/vk-bouwmaster-logo.svg' && form.profileImage.trim() !== '' ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-700">
                      <Image src={form.profileImage} alt="Profile" fill sizes="80px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, profileImage: '' })}
                        className="absolute top-0 right-0 bg-red-600/90 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        title={t.portfolio?.detail?.deletePhoto || 'Delete photo'}
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
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  {t.portfolio?.detail?.cityLabel || 'City'} <span className="text-gray-400 text-xs">({t.portfolio?.detail?.cityOptional || 'optional'})</span>
                </label>
                <input
                  className="bg-black/70 text-white border border-gray-700 rounded-lg px-4 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t.portfolio?.detail?.cityPlaceholder || 'In which city was the order placed?'}
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  {t.portfolio?.detail?.ratingLabel || 'Rating'} <span className="text-gray-400 text-xs">({t.portfolio?.detail?.ratingRequired || 'required'})</span>
                </label>
                <StarRating rating={form.rating} onRatingChange={(rating) => setForm(f => ({ ...f, rating }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  {t.portfolio?.detail?.commentLabel || 'Your comment'}
                </label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={t.portfolio?.detail?.commentPlaceholder || 'Write your comment here...'}
                  className="bg-black/70 text-white border border-gray-700 rounded-lg px-4 py-3 w-full min-h-[150px] text-base resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1">{t.portfolio?.detail?.charactersLeft || 'Characters left:'} {2000 - form.message.length}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                <label className="block text-sm font-medium mb-3 text-white">
                  {t.portfolio?.detail?.addPhotosLabel || '📷 Add photos'} <span className="text-gray-400 text-xs">({t.portfolio?.detail?.addPhotosOptional || 'optional'})</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    id="photo-upload"
                    className="hidden"
                  />
                  <GradientButton
                    type="button"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (t.common?.loading || 'Loading...') : (t.portfolio?.detail?.selectPhotos || '📷 Select photos')}
                  </GradientButton>
                </div>
                {formPhotos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">{t.portfolio?.detail?.photosUploaded || 'Photos uploaded:'} {formPhotos.length}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {formPhotos.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group">
                          <Image src={url} alt={`Photo ${idx + 1}`} fill sizes="96px" className="object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormPhotos(formPhotos.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title={t.portfolio?.detail?.deletePhoto || 'Delete photo'}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                <GradientButton
                  type="submit"
                  disabled={sending || uploading}
                  className="w-full"
                >
                  {sending || uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t.portfolio?.detail?.submitting || 'Submitting…'}
                    </>
                  ) : (
                    t.portfolio?.detail?.submitComment || '📤 Submit comment'
                  )}
                </GradientButton>
                <p className="text-xs text-gray-400 mt-2 text-center">{t.portfolio?.detail?.commentWillAppear || 'Comment will appear after administrator approval.'}</p>
              </div>
            </form>
          </div>
        </section>
      )}

      <AnimatePresence>
        {selectedImageIndex !== null && (
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
            
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevMedia(); }}
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); handleNextMedia(); }}
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedImageIndex !== null && selectedImageIndex < allMedia.length && (
                <>
                  <UploadFallbackImage
                    src={allMedia[selectedImageIndex].url}
                    alt={allMedia[selectedImageIndex].title}
                    width={1920}
                    height={1280}
                    sizes="100vw"
                    priority
                    quality={85}
                    placeholder="blur"
                    blurDataURL={IMAGE_BLUR_DATA_URL}
                    className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 px-4 py-2 rounded-lg">
                    <p className="text-white text-center">
                      {allMedia[selectedImageIndex].title} ({selectedImageIndex + 1} / {allMedia.length})
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

