"use client";

import React, {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {AnimatePresence, motion} from "framer-motion";
import {ArrowLeft, ArrowRight, X, Images} from "lucide-react";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {getTranslatedWork, translateCategory, Language} from "@/lib/translations";
import {useTranslations} from "@/hooks/useTranslations";
import {IMAGE_BLUR_DATA_URL} from "@/lib/blur-placeholder";

const cardMainSizes = "(max-width: 768px) 320px, 384px";

export interface WorkTranslations {
  title: string;
  description: string;
  category: string;
  city?: string;
}

export interface iPortfolioWork {
  id: string;
  title: string;
  description: string;
  mainImage: string;
  category: string; // Категория работы (например: "Укладка пола", "Покраска" и т.д.)
  projectId?: string; // ID проекта для группировки
  images?: string[]; // Дополнительные фото для детальной галереи
  videos?: string[]; // Видео для галереи проекта
  workDate?: string; // Дата выполнения работы
  city?: string; // Город, где была выполнена работа
  translations?: Record<string, WorkTranslations>;
}

interface iCarouselProps {
  items: React.ReactElement<{
    work: iPortfolioWork;
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
      {canScrollLeft && (
        <button
          onClick={handleScrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            transform: 'translateY(-50%)',
          }}
        >
          <ArrowLeft className="h-8 w-8 md:h-10 md:w-10 text-white" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={handleScrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-50 h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            transform: 'translateY(-50%)',
          }}
        >
          <ArrowRight className="h-8 w-8 md:h-10 md:w-10 text-white" />
        </button>
      )}

      <div
        className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth [scrollbar-width:none] py-5 px-16 md:px-24"
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
        <div className={cn("flex flex-row justify-start gap-4 pl-3", "max-w-7xl mx-auto")}>
          {items.map((item, index) => {
            return (
              <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.1 * index,
                    ease: "easeOut",
                  },
                }}
                key={`card-${index}`}
                className="last:pr-[5%] md:last:pr-[33%]"
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

const PortfolioCard = ({
  work,
  index,
  layout = false,
  onCardClose = () => {},
  backgroundImage = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=3058&auto=format&fit=crop&ixlib=rb-4.1.0",
}: {
  work: iPortfolioWork;
  index: number;
  layout?: boolean;
  onCardClose?: () => void;
  backgroundImage?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentLanguage } = useTranslations();
  const translated = getTranslatedWork(work, currentLanguage);

  const handleExpand = () => {
    return setIsExpanded(true);
  };
  
  const handleCollapse = () => {
    setIsExpanded(false);
    onCardClose();
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCollapse();
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
  }, [isExpanded]);

  useOutsideClick(containerRef, handleCollapse);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 h-screen overflow-hidden z-50">
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className="bg-black/80 backdrop-blur-lg h-full w-full fixed inset-0"
            />
            <motion.div
              initial={{opacity: 0, scale: 0.9}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.9}}
              ref={containerRef}
              layoutId={layout ? `card-${work.id}` : undefined}
              className="max-w-5xl mx-auto bg-gradient-to-b from-gray-900 to-black h-full z-[60] p-4 md:p-10 rounded-3xl relative md:mt-10 border border-gray-800"
            >
              <button
                className="sticky top-4 h-10 w-10 right-0 ml-auto rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition-colors z-50"
                onClick={handleCollapse}
              >
                <X className="h-6 w-6 text-white" />
              </button>
              
              <motion.h2
                layoutId={layout ? `title-${work.id}` : undefined}
                className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 mt-4 mb-2"
              >
                {translated.title}
              </motion.h2>
              
              <motion.p
                layoutId={layout ? `category-${work.id}` : undefined}
                className="text-blue-400 text-lg mb-6"
              >
                {translated.category}
              </motion.p>
              
              <div className="relative w-full h-64 md:h-96 mb-6 rounded-xl overflow-hidden">
                <Image
                  src={work.mainImage}
                  alt={translated.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                  className="object-cover"
                  priority
                />
              </div>
              
              <div className="text-gray-200 text-lg leading-relaxed mb-6">
                {translated.description}
              </div>
              
              {work.workDate && (
                <div className="text-gray-400 text-sm mb-6">
                  Дата выполнения: {work.workDate}
                </div>
              )}
              
              {(work.images && work.images.length > 0) && (
                <Link 
                  href={`/portfolio/${work.projectId || work.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
                  onClick={handleCollapse}
                >
                  <Images className="h-5 w-5" />
                  Просмотреть больше фото
                </Link>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${work.id}` : undefined}
        onClick={handleExpand}
        className=""
        whileHover={{
          scale: 1.02,
          transition: {duration: 0.3, ease: "easeOut"},
        }}
      >
        <div
          className={`rounded-3xl bg-gradient-to-b from-gray-900 to-black h-[500px] md:h-[550px] w-80 md:w-96 overflow-hidden flex flex-col items-center justify-center relative z-10 shadow-lg border border-gray-800 hover:border-blue-500 transition-colors`}
        >
          <div className="absolute opacity-30" style={{inset: "-1px 0 0"}}>
            <div className="absolute inset-0">
              <Image
                className="block w-full h-full object-center object-cover"
                src={backgroundImage || work.mainImage}
                alt="Background layer"
                fill
                sizes={cardMainSizes}
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
                priority={index < 4}
              />
            </div>
          </div>
          
          <div className="relative z-10 w-full h-full flex flex-col">
            <div className="relative w-full h-64 flex-1">
              <Image
                src={work.mainImage}
                alt={translated.title}
                fill
                sizes={cardMainSizes}
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
                priority={index < 4}
                className="object-cover"
              />
            </div>
            
            <div className="p-6 bg-gradient-to-t from-black/90 to-transparent">
              <motion.h3
                layoutId={layout ? `title-${work.id}` : undefined}
                className="text-xl md:text-2xl font-bold text-white mb-2 text-center"
              >
                {translated.title.length > 50
                  ? `${translated.title.slice(0, 50)}...`
                  : translated.title}
              </motion.h3>
              
              <motion.p
                layoutId={layout ? `category-${work.id}` : undefined}
                className="text-blue-400 text-sm md:text-base text-center mb-2"
              >
                {translated.category}
              </motion.p>
              
              {translated.description && (
                <motion.p
                  className="text-gray-300 text-sm text-center line-clamp-2"
                >
                  {translated.description.length > 100
                    ? `${translated.description.slice(0, 100)}...`
                    : translated.description}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </motion.button>
    </>
  );
};

export {Carousel, PortfolioCard};

