"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {Carousel, TestimonialCard} from "@/components/ui/retro-testimonial";
import {iTestimonial} from "@/components/ui/retro-testimonial";
import { useTranslations } from "@/hooks/useTranslations"
import { commentsListFetchInit } from "@/lib/comments-client"
import { subscribeCommentsRefresh } from "@/lib/comments-sync"

type Comment = {
  id: string
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

const RetroTestimonialDemo = () => {
  const { t } = useTranslations()
  const [reviews, setReviews] = useState<Comment[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/comments', commentsListFetchInit)
        if (res.ok) {
          const list = await res.json()
          setReviews(Array.isArray(list) ? list : [])
        }
      } catch {}
    }
    load()
    const unsubSync = subscribeCommentsRefresh(load)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', load)
    window.addEventListener('pageshow', load)
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(load, 15_000)
    return () => {
      unsubSync()
      window.removeEventListener('focus', load)
      window.removeEventListener('pageshow', load)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
  }, [])

  if (reviews.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">Пока нет отзывов</div>
    )
  }

  const cards = reviews
    .filter((review) => review.id)
    .map((review, idx) => {
      const testimonial: iTestimonial = {
        id: review.id!,
        name: `${review.name} ${review.surname || ''}`.trim(),
        designation: new Date(review.createdAt).toLocaleDateString(),
        description: review.message,
        profileImage: review.profileImage || '/vk-bouwmaster-logo.svg',
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
    })

  const allReviewsLabel = t.reviews?.list?.title || "All reviews"

  return (
    <div className="bg-black">
      <div className="max-w-5xl mx-auto px-4">
        <Carousel items={cards} />
        <div className="flex justify-center mt-6 pb-2">
          <Link
            href="/reviews"
            className="text-sm md:text-base font-medium text-cyan-300/90 hover:text-cyan-200 underline underline-offset-4 decoration-cyan-500/50 hover:decoration-cyan-300 transition-colors"
          >
            {allReviewsLabel} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export { RetroTestimonialDemo };


