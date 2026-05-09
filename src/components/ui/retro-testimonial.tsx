"use client";

import React, {useEffect, useRef, useState} from "react";

import Image, { ImageProps } from "next/image";
import {AnimatePresence, motion, PanInfo, useAnimation} from "framer-motion";
import {Quote, X, ChevronLeft, ChevronRight, ImageIcon, VideoIcon, Star} from "lucide-react";

import {cn} from "@/lib/utils";
import {GradientButton} from "@/components/ui/gradient-button";
import {Footer} from "@/components/layout/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from '@/hooks/useTranslations';
import { getCommentDisplayMessage } from '@/lib/comment-display';

export interface iTestimonial {
  id?: string; // ID отзыва для навигации
  name: string;
  designation: string;
  description: string;
  profileImage: string;
  photos?: string[];
  videos?: string[];
  rating?: number;
  city?: string;
  translations?: Record<string, string>; // Переводы сообщения на разные языки
}

const StarRating = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-600 text-gray-600'
          }`}
          style={{ width: size === 'sm' ? '14px' : size === 'md' ? '16px' : '20px', height: size === 'sm' ? '14px' : size === 'md' ? '16px' : '20px' }}
        />
      ))}
    </div>
  );
};

interface iCarouselProps {
  items: React.ReactElement<{
    testimonial: iTestimonial;
    index: number;
    layout?: boolean;
    onCardClose: () => void;
  }>[];
  initialScroll?: number;
}

const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  onOutsideClick: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      onOutsideClick();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
};

const Carousel = ({items, initialScroll = 0}: iCarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [autoScrollDirection, setAutoScrollDirection] = React.useState<'right' | 'left'>('right');
  const autoScrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const userScrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = React.useRef(false);
  const lastScrollLeftRef = React.useRef(0);
  const isUserInteractingRef = React.useRef(false);
  const autoScrollCheckRef = React.useRef(false);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const {scrollLeft, scrollWidth, clientWidth} = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
      
      if (isUserInteractingRef.current && Math.abs(scrollLeft - lastScrollLeftRef.current) > 5 && !autoScrollCheckRef.current) {
        isUserScrollingRef.current = true;
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }
        if (userScrollTimeoutRef.current) {
          clearTimeout(userScrollTimeoutRef.current);
        }
        userScrollTimeoutRef.current = setTimeout(() => {
          isUserScrollingRef.current = false;
          startAutoScroll();
        }, 8000);
      }
      lastScrollLeftRef.current = scrollLeft;
      autoScrollCheckRef.current = false;
    }
  };

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({left: -300, behavior: "smooth"});
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({left: 300, behavior: "smooth"});
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384;
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  const isMobile = () => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  };

  const startAutoScroll = React.useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    if (items.length <= 1) return;

    autoScrollIntervalRef.current = setInterval(() => {
      if (carouselRef.current && !isUserScrollingRef.current && items.length > 1) {
        const {scrollLeft, scrollWidth, clientWidth} = carouselRef.current;
        const cardWidth = isMobile() ? 230 : 384;
        const gap = isMobile() ? 16 : 32;
        const scrollStep = cardWidth + gap;

        setAutoScrollDirection(currentDirection => {
          if (currentDirection === 'right') {
            if (scrollLeft < scrollWidth - clientWidth - 10) {
              autoScrollCheckRef.current = true;
              carouselRef.current?.scrollBy({left: scrollStep, behavior: "smooth"});
              return 'right';
            } else {
              return 'left';
            }
          } else {
            if (scrollLeft > 10) {
              autoScrollCheckRef.current = true;
              carouselRef.current?.scrollBy({left: -scrollStep, behavior: "smooth"});
              return 'left';
            } else {
              return 'right';
            }
          }
        });
      }
    }, 5000); // 5 секунд
  }, [items.length]);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
      lastScrollLeftRef.current = initialScroll;
    }
  }, [initialScroll]);

  useEffect(() => {
    const id = requestAnimationFrame(() => checkScrollability())
    return () => cancelAnimationFrame(id)
  }, [items.length])

  useEffect(() => {
    if (items.length > 1) {
      startAutoScroll();
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
        userScrollTimeoutRef.current = null;
      }
    };
  }, [items.length, startAutoScroll]);

  return (
    <div className="relative w-full mt-10">
      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Vorige recensies"
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-sm transition-opacity hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Volgende recensies"
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-sm transition-opacity hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <div
        className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth [scrollbar-width:none] py-5 md:px-12"
        ref={carouselRef}
        onScroll={checkScrollability}
        onMouseDown={() => {
          isUserInteractingRef.current = true;
        }}
        onMouseUp={() => {
          setTimeout(() => {
            isUserInteractingRef.current = false;
          }, 100);
        }}
        onTouchStart={() => {
          isUserInteractingRef.current = true;
        }}
        onTouchEnd={() => {
          setTimeout(() => {
            isUserInteractingRef.current = false;
          }, 100);
        }}
      >
        <div
          className={cn(
            "absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l",
          )}
        />
        <div
          className={cn(
            "flex flex-row justify-start gap-4 pl-3",
            "max-w-5xl mx-auto",
          )}
        >
          {items.map((item, index) => {
            return (
              <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                    duration: 0.5,
                    delay: 0.2 * index,
                    ease: "easeOut",
                }}
                key={`card-${index}`}
                className="last:pr-[5%] md:last:pr-[33%] rounded-3xl"
              >
                {React.cloneElement(item, {
                  onCardClose: () => {
                    return handleCardClose(index);
                  },
                })}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TestimonialCard = ({
  testimonial,
  index,
  layout = false,
  onCardClose = () => {},
  backgroundImage = "https://images.unsplash.com/photo-1686806372726-388d03ff49c8?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
}: {
  testimonial: iTestimonial;
  index: number;
  layout?: boolean;
  onCardClose?: () => void;
  backgroundImage?: string;
}) => {
  const { currentLanguage } = useTranslations();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getTranslatedDescription = () =>
    getCommentDisplayMessage(
      { message: testimonial.description, translations: testimonial.translations },
      currentLanguage
    );
  const [showPhotos, setShowPhotos] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [photoDirection, setPhotoDirection] = useState(0);
  const [videoDirection, setVideoDirection] = useState(0);
  const [canScrollPhotosLeft, setCanScrollPhotosLeft] = useState(false);
  const [canScrollPhotosRight, setCanScrollPhotosRight] = useState(false);
  const [canScrollVideosLeft, setCanScrollVideosLeft] = useState(false);
  const [canScrollVideosRight, setCanScrollVideosRight] = useState(false);
  const photosScrollRef = useRef<HTMLDivElement>(null);
  const videosScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const photoViewerRef = useRef<HTMLDivElement>(null);
  const videoViewerRef = useRef<HTMLDivElement>(null);
  const photoDragX = useRef(0);
  const videoDragX = useRef(0);

  const handleExpand = () => {
    if (testimonial.id) {
      router.push(`/reviews/${testimonial.id}`);
    } else {
      setIsExpanded(true);
    }
  };
  const handleCollapse = () => {
    setIsExpanded(false);
    setShowPhotos(false);
    setShowVideos(false);
    setSelectedPhotoIndex(null);
    setSelectedVideoIndex(null);
    setTimeout(() => {
    onCardClose();
    }, 100);
  };

  const handlePhotoDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    photoDragX.current = info.offset.x;
  };

  const handlePhotoDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (selectedPhotoIndex !== null && testimonial.photos) {
      if (info.offset.x > threshold && selectedPhotoIndex > 0) {
        setPhotoDirection(-1);
        setSelectedPhotoIndex(selectedPhotoIndex - 1);
      } else if (info.offset.x < -threshold && selectedPhotoIndex < testimonial.photos.length - 1) {
        setPhotoDirection(1);
        setSelectedPhotoIndex(selectedPhotoIndex + 1);
      }
    }
    photoDragX.current = 0;
  };

  const handleVideoDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    videoDragX.current = info.offset.x;
  };

  const handleVideoDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (selectedVideoIndex !== null && testimonial.videos) {
      if (info.offset.x > threshold && selectedVideoIndex > 0) {
        setVideoDirection(-1);
        setSelectedVideoIndex(selectedVideoIndex - 1);
      } else if (info.offset.x < -threshold && selectedVideoIndex < testimonial.videos.length - 1) {
        setVideoDirection(1);
        setSelectedVideoIndex(selectedVideoIndex + 1);
      }
    }
    videoDragX.current = 0;
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedPhotoIndex !== null) {
          setSelectedPhotoIndex(null);
        } else if (selectedVideoIndex !== null) {
          setSelectedVideoIndex(null);
        } else if (showPhotos) {
          setShowPhotos(false);
        } else if (showVideos) {
          setShowVideos(false);
        } else {
          handleCollapse();
        }
      }
    };

    if (isExpanded) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo({top: scrollY, behavior: "instant"});
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      return window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isExpanded, selectedPhotoIndex, selectedVideoIndex, showPhotos, showVideos]);

  useOutsideClick(containerRef, handleCollapse);

  const checkPhotosScrollability = () => {
    if (photosScrollRef.current && testimonial.photos && testimonial.photos.length > 0) {
      const {scrollLeft, scrollWidth, clientWidth} = photosScrollRef.current;
      setCanScrollPhotosLeft(scrollLeft > 0);
      setCanScrollPhotosRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const checkVideosScrollability = () => {
    if (videosScrollRef.current && testimonial.videos && testimonial.videos.length > 0) {
      const {scrollLeft, scrollWidth, clientWidth} = videosScrollRef.current;
      setCanScrollVideosLeft(scrollLeft > 0);
      setCanScrollVideosRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handlePhotosScrollLeft = () => {
    if (photosScrollRef.current) {
      photosScrollRef.current.scrollBy({left: -350, behavior: "smooth"});
    }
  };

  const handlePhotosScrollRight = () => {
    if (photosScrollRef.current) {
      photosScrollRef.current.scrollBy({left: 350, behavior: "smooth"});
    }
  };

  const handleVideosScrollLeft = () => {
    if (videosScrollRef.current) {
      videosScrollRef.current.scrollBy({left: -450, behavior: "smooth"});
    }
  };

  const handleVideosScrollRight = () => {
    if (videosScrollRef.current) {
      videosScrollRef.current.scrollBy({left: 450, behavior: "smooth"});
    }
  };

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        checkPhotosScrollability();
        checkVideosScrollability();
      }, 100);
    }
  }, [isExpanded, testimonial.photos, testimonial.videos]);

  useEffect(() => {
    if (!isExpanded || !panelRef.current) return;
    
    const panel = panelRef.current;
    
    const fixVariables = () => {
      if (panel) {
        panel.style.setProperty('--pos-x', '50%');
        panel.style.setProperty('--pos-y', '50%');
        panel.style.setProperty('--spread-x', '100%');
        panel.style.setProperty('--spread-y', '100%');
        
        const currentStyle = panel.getAttribute('style') || '';
        if (!currentStyle.includes('--pos-x')) {
          panel.setAttribute('style', 
            currentStyle + 
            '; --pos-x: 50% !important; --pos-y: 50% !important; --spread-x: 100% !important; --spread-y: 100% !important;'
          );
        }
      }
    };
    
    fixVariables();
    
    let rafId: number;
    const keepFixed = () => {
      fixVariables();
      rafId = requestAnimationFrame(keepFixed);
    };
    rafId = requestAnimationFrame(keepFixed);
    
    const handleMouseEvent = (e: Event) => {
      e.stopPropagation();
      fixVariables();
    };
    panel.addEventListener('mouseenter', handleMouseEvent, true);
    panel.addEventListener('mouseleave', handleMouseEvent, true);
    panel.addEventListener('mousemove', handleMouseEvent, true);
    
    panel.classList.add('no-hover-effects');
    
    return () => {
      cancelAnimationFrame(rafId);
      panel.removeEventListener('mouseenter', handleMouseEvent, true);
      panel.removeEventListener('mouseleave', handleMouseEvent, true);
      panel.removeEventListener('mousemove', handleMouseEvent, true);
      panel.classList.remove('no-hover-effects');
    };
  }, [isExpanded]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showPhotos && selectedPhotoIndex !== null && testimonial.photos) {
        if (e.key === 'ArrowLeft' && selectedPhotoIndex > 0) {
          setPhotoDirection(-1);
          setSelectedPhotoIndex(selectedPhotoIndex - 1);
        }
        if (e.key === 'ArrowRight' && selectedPhotoIndex < testimonial.photos.length - 1) {
          setPhotoDirection(1);
          setSelectedPhotoIndex(selectedPhotoIndex + 1);
        }
      }
      if (showVideos && selectedVideoIndex !== null && testimonial.videos) {
        if (e.key === 'ArrowLeft' && selectedVideoIndex > 0) {
          setVideoDirection(-1);
          setSelectedVideoIndex(selectedVideoIndex - 1);
        }
        if (e.key === 'ArrowRight' && selectedVideoIndex < testimonial.videos.length - 1) {
          setVideoDirection(1);
          setSelectedVideoIndex(selectedVideoIndex + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPhotos, showVideos, selectedPhotoIndex, selectedVideoIndex, testimonial.photos, testimonial.videos]);

  return (
    <>
      {isExpanded && !showPhotos && !showVideos && (
        <div
          className="fixed top-20 sm:top-24 bottom-0 left-0 right-0 w-screen bg-black z-40 overflow-y-auto hide-scrollbar"
          style={{
            position: 'fixed',
            top: '80px',
            bottom: '0',
            left: '0',
            right: '0',
            width: '100vw',
            height: 'calc(100vh - 80px)',
            minHeight: 'calc(100vh - 80px)',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            transform: 'none',
            willChange: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            pointerEvents: 'auto',
            touchAction: 'pan-y'
          } as React.CSSProperties}
        >
          <div 
            className="min-h-full flex flex-col"
            style={{
              minHeight: '100%',
              width: '100%',
              boxSizing: 'border-box',
              paddingBottom: '2rem'
            }}
          >
            <div 
              ref={containerRef} 
              className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8 relative"
              style={{
                width: '100%',
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '2rem',
                paddingTop: '5rem',
                paddingBottom: '4rem',
                boxSizing: 'border-box',
                flex: '1 1 auto',
                transform: 'none',
                willChange: 'auto',
                position: 'relative',
                minHeight: 'calc(100vh - 80px)'
              }}
              onMouseEnter={() => {}}
              onMouseLeave={() => {}}
            >
              {!showPhotos && !showVideos && (
                <button
                  className="absolute top-8 right-4 h-10 w-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors z-20"
                  style={{
                    position: 'absolute',
                    top: '2.5rem',
                    right: '1rem',
                    width: '40px',
                    height: '40px',
                    minWidth: '40px',
                    maxWidth: '40px',
                    minHeight: '40px',
                    maxHeight: '40px',
                    flexShrink: 0
                  }}
                  onClick={handleCollapse}
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              )}
              
              {showPhotos && selectedPhotoIndex !== null && testimonial.photos ? (
                <div
                  ref={panelRef}
                  className={`gradient-button ${index % 2 === 0 ? '' : 'gradient-button-variant'} p-6 md:p-10 rounded-3xl relative`}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    position: 'relative',
                    minHeight: 'calc(100vh - 200px)',
                    display: 'flex',
                    flexDirection: 'column',
                    '--pos-x': '50%',
                    '--pos-y': '50%',
                    '--spread-x': '100%',
                    '--spread-y': '100%',
                    '--border-angle': index % 2 === 0 ? '200deg' : '200deg',
                  } as React.CSSProperties}
                >
                  <div className="w-full mb-4 relative">
                    <div className="flex gap-2 mb-4">
                      {testimonial.photos.map((_, idx) => (
                        <div
                          key={idx}
                          className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
                          style={{
                            backgroundColor: idx === selectedPhotoIndex ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)'
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowPhotos(false);
                        setSelectedPhotoIndex(null);
                      }}
                      className="absolute w-12 h-12 rounded-full flex items-center justify-center transition-all z-50 shadow-xl border-2 border-white/40"
                      style={{
                        position: 'absolute',
                        top: '4rem',
                        right: '1rem',
                        zIndex: 50,
                        minWidth: '48px',
                        minHeight: '48px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(14, 165, 233, 0.9) 50%, rgba(6, 182, 212, 0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(14, 165, 233, 1) 50%, rgba(6, 182, 212, 1) 100%)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(14, 165, 233, 0.9) 50%, rgba(6, 182, 212, 0.9) 100%)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <X className="h-6 w-6 text-white stroke-2" style={{ strokeWidth: '2.5px' }} />
                    </button>
                  </div>

                  <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ minHeight: '500px' }}>
                    {selectedPhotoIndex > 0 && (
                      <button
                        onClick={() => {
                          setPhotoDirection(-1);
                          setSelectedPhotoIndex(selectedPhotoIndex - 1);
                        }}
                        className="absolute left-4 z-30 w-12 h-12 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors border-2 border-white/40"
                      >
                        <ChevronLeft className="h-6 w-6 text-white" />
                      </button>
                    )}
                    
                    {testimonial.photos && selectedPhotoIndex < testimonial.photos.length - 1 && (
                      <button
                        onClick={() => {
                          setPhotoDirection(1);
                          setSelectedPhotoIndex(selectedPhotoIndex + 1);
                        }}
                        className="absolute right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors border-2 border-white/40"
                      >
                        <ChevronRight className="h-6 w-6 text-white" />
                      </button>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedPhotoIndex}
                        initial={{
                          x: photoDirection > 0 ? 1000 : -1000,
                          opacity: 0,
                          scale: 0.8
                        }}
                        animate={{
                          x: 0,
                          opacity: 1,
                          scale: 1
                        }}
                        exit={{
                          x: photoDirection > 0 ? -1000 : 1000,
                          opacity: 0,
                          scale: 0.8
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDrag={handlePhotoDrag}
                        onDragEnd={handlePhotoDragEnd}
                        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const width = rect.width;
                          if (clickX < width / 3 && selectedPhotoIndex > 0) {
                            setPhotoDirection(-1);
                            setSelectedPhotoIndex(selectedPhotoIndex - 1);
                          } else if (clickX > (width * 2) / 3 && testimonial.photos && selectedPhotoIndex < testimonial.photos.length - 1) {
                            setPhotoDirection(1);
                            setSelectedPhotoIndex(selectedPhotoIndex + 1);
                          }
                        }}
                      >
                        <Image
                          src={testimonial.photos[selectedPhotoIndex]}
                          alt={`Photo ${selectedPhotoIndex + 1}`}
                          fill
                          className="object-contain"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>

                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/60 px-4 py-2 rounded-lg">
                      <p className="text-white text-center text-sm">
                        {selectedPhotoIndex + 1} / {testimonial.photos.length}
                      </p>
                    </div>
                  </div>
                </div>
              ) : showVideos && selectedVideoIndex !== null && testimonial.videos ? (
                <div
                  ref={panelRef}
                  className={`gradient-button ${index % 2 === 0 ? '' : 'gradient-button-variant'} p-6 md:p-10 rounded-3xl relative`}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    position: 'relative',
                    minHeight: 'calc(100vh - 200px)',
                    display: 'flex',
                    flexDirection: 'column',
                    '--pos-x': '50%',
                    '--pos-y': '50%',
                    '--spread-x': '100%',
                    '--spread-y': '100%',
                    '--border-angle': index % 2 === 0 ? '200deg' : '200deg',
                  } as React.CSSProperties}
                >
                  <div className="w-full mb-4 relative">
                    <div className="flex gap-2 mb-4">
                      {testimonial.videos.map((_, idx) => (
                        <div
                          key={idx}
                          className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
                          style={{
                            backgroundColor: idx === selectedVideoIndex ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)'
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowVideos(false);
                        setSelectedVideoIndex(null);
                      }}
                      className="absolute w-12 h-12 rounded-full flex items-center justify-center transition-all z-50 shadow-xl border-2 border-white/40"
                      style={{
                        position: 'absolute',
                        top: '4rem',
                        right: '1rem',
                        zIndex: 50,
                        minWidth: '48px',
                        minHeight: '48px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(14, 165, 233, 0.9) 50%, rgba(6, 182, 212, 0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(14, 165, 233, 1) 50%, rgba(6, 182, 212, 1) 100%)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(14, 165, 233, 0.9) 50%, rgba(6, 182, 212, 0.9) 100%)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <X className="h-6 w-6 text-white stroke-2" style={{ strokeWidth: '2.5px' }} />
                    </button>
                  </div>

                  <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ minHeight: '500px' }}>
                    {selectedVideoIndex > 0 && (
                      <button
                        onClick={() => {
                          setVideoDirection(-1);
                          setSelectedVideoIndex(selectedVideoIndex - 1);
                        }}
                        className="absolute left-4 z-30 w-12 h-12 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors border-2 border-white/40"
                      >
                        <ChevronLeft className="h-6 w-6 text-white" />
                      </button>
                    )}
                    
                    {testimonial.videos && selectedVideoIndex < testimonial.videos.length - 1 && (
                      <button
                        onClick={() => {
                          setVideoDirection(1);
                          setSelectedVideoIndex(selectedVideoIndex + 1);
                        }}
                        className="absolute right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors border-2 border-white/40"
                      >
                        <ChevronRight className="h-6 w-6 text-white" />
                      </button>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedVideoIndex}
                        initial={{
                          x: videoDirection > 0 ? 1000 : -1000,
                          opacity: 0,
                          scale: 0.8
                        }}
                        animate={{
                          x: 0,
                          opacity: 1,
                          scale: 1
                        }}
                        exit={{
                          x: videoDirection > 0 ? -1000 : 1000,
                          opacity: 0,
                          scale: 0.8
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDrag={handleVideoDrag}
                        onDragEnd={handleVideoDragEnd}
                        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const width = rect.width;
                          if (clickX < width / 3 && selectedVideoIndex > 0) {
                            setVideoDirection(-1);
                            setSelectedVideoIndex(selectedVideoIndex - 1);
                          } else if (clickX > (width * 2) / 3 && testimonial.videos && selectedVideoIndex < testimonial.videos.length - 1) {
                            setVideoDirection(1);
                            setSelectedVideoIndex(selectedVideoIndex + 1);
                          }
                        }}
                      >
                        <video
                          key={selectedVideoIndex}
                          src={testimonial.videos[selectedVideoIndex]}
                          controls
                          autoPlay
                          className="max-w-full max-h-full object-contain"
                          style={{ maxHeight: '70vh' }}
                          playsInline
                          onClick={(e) => e.stopPropagation()}
                        />
                      </motion.div>
                    </AnimatePresence>

                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/60 px-4 py-2 rounded-lg">
                      <p className="text-white text-center text-sm">
                        {selectedVideoIndex + 1} / {testimonial.videos.length}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={panelRef}
                  className={`gradient-button ${index % 2 === 0 ? '' : 'gradient-button-variant'} p-5 md:p-6 rounded-2xl relative`}
                  style={{
                    width: '100%',
                    maxWidth: '700px',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                    position: 'relative',
                    pointerEvents: 'auto',
                    transform: 'none',
                    willChange: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'auto',
                    minHeight: '320px',
                    overflow: 'hidden',
                    '--pos-x': '50%',
                    '--pos-y': '50%',
                    '--spread-x': '100%',
                    '--spread-y': '100%',
                    '--border-angle': index % 2 === 0 ? '200deg' : '200deg',
                  } as React.CSSProperties}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                >
                  <div className="mb-3 pb-3 border-b border-white/10">
                    <p
                      className="text-xl md:text-2xl font-bold text-white mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9),0_1px_4px_rgba(0,0,0,0.8)]"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        marginTop: '0',
                        marginBottom: '0.5rem',
                        minHeight: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        flexShrink: 0,
                        lineHeight: '1.3'
                      }}
                    >
                      {testimonial.name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {testimonial.designation && (
                        <p
                          className="text-white/80 text-sm drop-shadow-[0_2px_6px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.8)]"
                          style={{
                            minHeight: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0
                          }}
                        >
                          {testimonial.designation}
                        </p>
                      )}
                      {testimonial.city && (
                        <>
                          <span className="text-white/50">•</span>
                          <p
                            className="text-white/70 text-sm drop-shadow-[0_2px_6px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.8)]"
                            style={{
                              minHeight: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              flexShrink: 0
                            }}
                          >
                            {testimonial.city}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {testimonial.rating && (
                    <div 
                      className="mb-3"
                      style={{
                        minHeight: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        flexShrink: 0
                      }}
                    >
                      <StarRating rating={testimonial.rating} size="md" />
                    </div>
                  )}

                  <div 
                    className="text-white text-sm md:text-base leading-relaxed flex-1"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.75rem',
                      minHeight: '140px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      flexShrink: 0
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Quote className="h-4 w-4 text-white/60 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1 flex-shrink-0" />
                      <div className="whitespace-pre-wrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.9),0_1px_4px_rgba(0,0,0,0.8)] text-left leading-relaxed">
                        {getTranslatedDescription()}
                      </div>
                    </div>
                  </div>

                  <div 
                    className="pt-3 border-t border-white/10"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      paddingTop: '0.75rem',
                      marginTop: 'auto',
                      minHeight: testimonial.id && ((testimonial.photos && testimonial.photos.length > 0) || (testimonial.videos && testimonial.videos.length > 0)) ? '44px' : '0',
                      height: testimonial.id && ((testimonial.photos && testimonial.photos.length > 0) || (testimonial.videos && testimonial.videos.length > 0)) ? 'auto' : '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      position: 'relative',
                      overflow: 'hidden',
                      willChange: 'auto',
                      transform: 'none',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    {testimonial.id && ((testimonial.photos && testimonial.photos.length > 0) || (testimonial.videos && testimonial.videos.length > 0)) ? (
                      <Link 
                        href={`/reviews/${testimonial.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer z-50 relative"
                        style={{
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (testimonial.id) {
                            window.location.href = `/reviews/${testimonial.id}`;
                          }
                        }}
                      >
                        <ImageIcon className="h-4 w-4" style={{ flexShrink: 0, width: '16px', height: '16px' }} />
                        <span>
                          {testimonial.photos && testimonial.photos.length > 0 && testimonial.videos && testimonial.videos.length > 0 
                            ? `Посмотреть фото и видео (${testimonial.photos.length + testimonial.videos.length})`
                            : testimonial.photos && testimonial.photos.length > 0
                            ? `Посмотреть фото (${testimonial.photos.length})`
                            : `Посмотреть видео (${testimonial.videos?.length || 0})`
                          }
                        </span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ width: '100%', marginTop: 'auto' }}>
              <Footer />
            </div>
          </div>
        </div>
      )}

      <motion.div
        layoutId={layout ? `card-${testimonial.name}` : undefined}
        onClick={handleExpand}
        className="!transform-none cursor-pointer"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.1,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{ transform: 'translateY(0) scale(1)', transformOrigin: 'center' }}
      >
        <div
          className={`${index % 2 === 0 ? "rotate-0" : "-rotate-0"} rounded-3xl gradient-button ${index % 2 === 0 ? '' : 'gradient-button-variant'} h-auto min-h-[500px] md:min-h-[550px] w-80 md:w-96 overflow-hidden flex flex-col relative z-10 shadow-lg cursor-pointer transition-shadow duration-300 hover:shadow-xl`}
          style={{ transform: 'scale(1)', width: '320px', maxWidth: '320px', minWidth: '320px' }}
        >
          <div className="flex-1 flex flex-col items-center justify-start p-6 pt-8 pb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
            >
              <ProfileImage 
                src={testimonial.profileImage} 
                alt={testimonial.name} 
                useLogo={!testimonial.profileImage || testimonial.profileImage === '/vk-bouwmaster-logo.svg' || testimonial.profileImage.trim() === ''} 
              />
            </motion.div>
          <motion.p
            layoutId={layout ? `category-${testimonial.name}` : undefined}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
              className="text-white text-xl md:text-2xl font-bold text-center mt-6 px-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9),0_1px_4px_rgba(0,0,0,0.8)]"
          >
              {testimonial.name}
          </motion.p>
          <motion.p
            layoutId={layout ? `category-${testimonial.name}` : undefined}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.35, duration: 0.4 }}
              className="text-white/90 text-sm md:text-base text-center mt-2 mb-2 px-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.8)]"
            >
              {testimonial.designation}
              {testimonial.city && <span className="ml-1 text-white/70">• {testimonial.city}</span>}
            </motion.p>
            {testimonial.rating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.37, duration: 0.4 }}
                className="flex justify-center mb-3 px-3"
              >
                <StarRating rating={testimonial.rating} size="sm" />
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.4, duration: 0.4 }}
              className="flex-1 flex flex-col justify-start w-full"
            >
              <motion.p
                layoutId={layout ? `title-${testimonial.name}` : undefined}
                className="text-white text-base md:text-lg font-normal text-center [text-wrap:balance] mt-4 px-4 flex-1 min-h-[80px] max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.9),0_1px_4px_rgba(0,0,0,0.8)] leading-relaxed"
              >
                {getTranslatedDescription()}
              </motion.p>
              {testimonial.id && ((testimonial.photos && testimonial.photos.length > 0) || (testimonial.videos && testimonial.videos.length > 0)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.4 }}
                  className="flex gap-2 justify-center mt-3 px-4 flex-wrap"
                >
                  <Link
                    href={`/reviews/${testimonial.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (testimonial.id) {
                        window.location.href = `/reviews/${testimonial.id}`;
                      }
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm rounded-lg transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-semibold cursor-pointer z-50 relative"
                  >
                    {testimonial.photos && testimonial.photos.length > 0 && testimonial.videos && testimonial.videos.length > 0 
                      ? `📷🎥 Фото и видео (${testimonial.photos.length + testimonial.videos.length})`
                      : testimonial.photos && testimonial.photos.length > 0
                      ? `📷 Фото (${testimonial.photos.length})`
                      : `🎥 Видео (${testimonial.videos?.length || 0})`
                    }
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const ProfileImage = ({src, alt, useLogo, ...rest}: ImageProps & { useLogo?: boolean }) => {
  const [isLoading, setLoading] = useState(true);

  const shouldShowLogo = useLogo || !src || src === '/vk-bouwmaster-logo.svg' || (typeof src === 'string' && src.trim() === '');

  if (shouldShowLogo) {
    return (
      <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] overflow-hidden rounded-[1000px] border-[2px] border-solid border-black/40 aspect-[1/1] flex-none relative bg-black flex items-center justify-center p-1.5 md:p-2 shadow-lg">
        <span className="text-[7px] md:text-[8px] font-extrabold text-transparent bg-clip-text tiffany-gradient-text text-center leading-[1.2] px-0.5 uppercase tracking-tight">
          VK BOUWMASTER
        </span>
      </div>
    );
  }

  return (
    <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] opacity-80 overflow-hidden rounded-[1000px] border-[2px] border-solid border-[rgba(59,59,59,0.6)] aspect-[1/1] flex-none saturate-[0.2] sepia-[0.46] relative">
      <Image
        className={cn(
          "transition duration-300 absolute top-0 inset-0 rounded-inherit object-cover z-50",
          isLoading ? "blur-sm" : "blur-0",
        )}
        onLoad={() => {
          return setLoading(false);
        }}
        src={src}
        width={70}
        height={70}
        loading="lazy"
        decoding="async"
        blurDataURL={typeof src === "string" ? src : undefined}
        alt={alt || "Profile image"}
        {...rest}
      />
    </div>
  );
};

export {Carousel, TestimonialCard, ProfileImage};


