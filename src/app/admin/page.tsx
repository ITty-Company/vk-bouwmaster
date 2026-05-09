"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { GradientButton } from '@/components/ui/gradient-button';
import { notifyCommentsChanged } from '@/lib/comments-sync';

type TabType = 'blog' | 'team' | 'faq' | 'pricing' | 'contact' | 'works' | 'reviews' | 'messages';

interface PortfolioItem {
  id: string;
  service: string;
  title: string;
  description?: string;
  image: string;
  date?: string;
}

interface BlogPostTranslations {
  title: string;
  excerpt: string;
  content?: string;
  category: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  slug: string;
  content?: string;
  translations?: Record<string, BlogPostTranslations>;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  bio: string;
  specialties: string[];
  experience: string;
}

interface FAQCategory {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

interface PricingData {
  packages: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    features: string[];
    popular: boolean;
  }>;
  services: Array<{
    id: string;
    service: string;
    priceRange: string;
    description: string;
    includes: string[];
  }>;
}

interface ContactData {
  phone: { number1: string; number2: string };
  email: { address1: string; address2: string };
  address: { street: string; city: string };
  hours: { weekdays: string; saturday: string; sunday: string };
  emergency: { phone: string };
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city?: string;
  service?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('works');

  const [portfolioItems, setPortfolioItems] = useState<Record<string, PortfolioItem[]>>({});
  const [selectedService, setSelectedService] = useState('flooring-installation');
  const [portfolioFormData, setPortfolioFormData] = useState({
    title: '',
    description: '',
    image: '',
    service: 'flooring-installation',
  });
  const [dragActive, setDragActive] = useState(false);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [dragActiveBlogImage, setDragActiveBlogImage] = useState(false);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    excerpt: '',
    image: '',
    category: '',
    readTime: '',
    slug: '',
    content: '',
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    position: '',
    image: '',
    bio: '',
    specialties: '',
    experience: '',
  });

  const [faqCategories, setFaqCategories] = useState<FAQCategory[]>([]);

  const [pricingData, setPricingData] = useState<PricingData>({ packages: [], services: [] });

  const [contactData, setContactData] = useState<ContactData>({
    phone: { number1: '', number2: '' },
    email: { address1: '', address2: '' },
    address: { street: '', city: '' },
    hours: { weekdays: '', saturday: '', sunday: '' },
    emergency: { phone: '' }
  });

  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const [uploading, setUploading] = useState(false);
  const [dragActiveReviewPhotos, setDragActiveReviewPhotos] = useState(false);
  const [dragActiveReviewVideos, setDragActiveReviewVideos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [dragActiveWorks, setDragActiveWorks] = useState(false);
  const [dragActiveAdditionalImages, setDragActiveAdditionalImages] = useState(false);

  interface WorkTranslations {
    title: string;
    description: string;
    category: string;
    city?: string;
  }

  interface WorkData {
    id: string;
    title: string;
    description: string;
    mainImage: string;
    category: string;
    projectId?: string;
    images?: string[];
    videos?: string[];
    workDate?: string;
    city?: string;
    translations?: Record<string, WorkTranslations>;
  }
  const [works, setWorks] = useState<WorkData[]>([]);
  const languages = ['RU','UA','EN','NL','DE','FR','ES','IT','PT','PL','CZ','HU','RO','BG','HR','SK','SL','ET','LV','LT','FI','SV','DA','NO','GR'] as const;
  const [worksFormData, setWorksFormData] = useState({
    title: '',
    description: '',
    mainImage: '',
    category: '',
    projectId: '',
    images: [] as string[],
    videos: [] as string[],
    workDate: new Date().toISOString().split('T')[0],
    city: '',
    translations: {} as Record<string, WorkTranslations>,
  });
  const [editingWork, setEditingWork] = useState<WorkData | null>(null);
  const [expandedTranslationLang, setExpandedTranslationLang] = useState<string | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  interface ReviewData {
    id: string;
    projectId: string;
    name: string;
    surname?: string;
    message: string;
    createdAt: string;
    approved: boolean;
    photos?: string[];
    videos?: string[];
    rating?: number;
    city?: string;
    profileImage?: string;
  }
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [editingReview, setEditingReview] = useState<ReviewData | null>(null);
  const [reviewFormData, setReviewFormData] = useState({
    name: '',
    surname: '',
    message: '',
    rating: 5,
    city: '',
    photos: [] as string[],
    videos: [] as string[],
    profileImage: '',
  });
  const [reviewTranslateBusy, setReviewTranslateBusy] = useState(false);

  const StarRating = ({ rating, onRatingChange, readOnly = false }: { rating: number; onRatingChange?: (rating: number) => void; readOnly?: boolean }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onRatingChange && onRatingChange(star)}
            disabled={readOnly}
            className={`text-xl transition-transform ${!readOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-500'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const loadReviews = async () => {
    try {
      const response = await fetch('/api/comments?includeUnapproved=1', { cache: 'no-store' });
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleTranslateAllReviews = async (force: boolean) => {
    if (
      !confirm(
        force
          ? 'Пересобрать переводы на все языки для КАЖДОГО отзыва? Существующие переводы будут заменены. Может занять несколько минут.'
          : 'Дозаполнить только недостающие языки у всех отзывов? (Рекомендуется.)'
      )
    ) {
      return;
    }
    setReviewTranslateBusy(true);
    try {
      const res = await fetch(`/api/comments/translate?force=${force}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message ?? 'Готово');
        loadReviews();
        notifyCommentsChanged();
      } else {
        alert(data.error ?? 'Ошибка перевода');
      }
    } catch {
      alert('Сетевая ошибка');
    } finally {
      setReviewTranslateBusy(false);
    }
  };

  const handleTranslateOneReview = async (id: string) => {
    setReviewTranslateBusy(true);
    try {
      const res = await fetch(
        `/api/comments/translate?commentId=${encodeURIComponent(id)}`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (res.ok) {
        alert('Переводы для отзыва обновлены');
        loadReviews();
        notifyCommentsChanged();
      } else {
        alert(data.error ?? 'Ошибка');
      }
    } catch {
      alert('Сетевая ошибка');
    } finally {
      setReviewTranslateBusy(false);
    }
  };

  /** Disk recovery: show all works from repo seed again (same idea as reviews). */
  const handleResetWorkSeedRemovals = async () => {
    if (
      !confirm(
        'Сбросить пометки «работа из репозитория удалена» на сервере? Нужно, если после деплоя не видны работы из Git. Продолжить?'
      )
    ) {
      return;
    }
    const email = prompt('Email администратора', 'admin@vkbouwmaster.com');
    const password = prompt('Пароль администратора');
    if (!email?.trim() || !password) return;
    setUploading(true);
    try {
      const res = await fetch('/api/works/reset-seed-removals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message ?? 'Готово');
        loadWorks();
        notifyCommentsChanged();
      } else {
        alert(data.error ?? 'Ошибка');
      }
    } catch {
      alert('Сетевая ошибка');
    } finally {
      setUploading(false);
    }
  };

  /** Clears bogus removedSeedIds on disk so seeded reviews from Git show again (Render recovery). */
  const handleResetSeedRemovals = async () => {
    if (
      !confirm(
        'Сбросить на сервере пометки «удалён из репозитория»? Нужно, если после деплоя новые отзывы из Git не видны на сайте (типичная ошибка старого файла на диске). Продолжить?'
      )
    ) {
      return;
    }
    const email = prompt('Email администратора', 'admin@vkbouwmaster.com');
    const password = prompt('Пароль администратора');
    if (!email?.trim() || !password) return;
    setReviewTranslateBusy(true);
    try {
      const res = await fetch('/api/comments/reset-seed-removals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message ?? 'Готово');
        loadReviews();
        notifyCommentsChanged();
      } else {
        alert(data.error ?? 'Ошибка');
      }
    } catch {
      alert('Сетевая ошибка');
    } finally {
      setReviewTranslateBusy(false);
    }
  };

  const handleReviewApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/comments?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      if (response.ok) {
        loadReviews();
        notifyCommentsChanged();
        alert('Отзыв одобрен!');
      }
    } catch {
      alert('Ошибка при одобрении');
    }
  };

  const handleReviewReject = async (id: string) => {
    if (!confirm('Удалить этот отзыв?')) return;
    try {
      const response = await fetch(`/api/comments?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        loadReviews();
        notifyCommentsChanged();
        alert('Отзыв удален!');
      }
    } catch {
      alert('Ошибка при удалении');
    }
  };

  const handleReviewEdit = (review: ReviewData) => {
    setEditingReview(review);
    setReviewFormData({
      name: review.name,
      surname: review.surname || '',
      message: review.message,
      rating: review.rating || 5,
      city: review.city || '',
      photos: review.photos || [],
      videos: review.videos || [],
      profileImage: review.profileImage || '',
    });
  };

  const handleReviewSave = async () => {
    if (!editingReview) return;
    setUploading(true);
    try {
      const dataToSave = {
        name: reviewFormData.name,
        surname: reviewFormData.surname || undefined,
        message: reviewFormData.message,
        rating: reviewFormData.rating,
        city: reviewFormData.city || undefined,
        photos: reviewFormData.photos, // Отправляем массив как есть (может быть пустым)
        videos: reviewFormData.videos, // Отправляем массив как есть (может быть пустым)
        profileImage: reviewFormData.profileImage || undefined,
      };
      
      const response = await fetch(`/api/comments?id=${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataToSave, approved: true }),
      });
      
      if (response.ok) {
        alert('Отзыв обновлен! Изменения сохранены и будут видны на сайте.');
        setEditingReview(null);
        setReviewFormData({
          name: '',
          surname: '',
          message: '',
          rating: 5,
          city: '',
          photos: [],
          videos: [],
          profileImage: '',
        });
        loadReviews();
        notifyCommentsChanged();
      } else {
        const errorData = await response.json();
        alert(`Ошибка при обновлении: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Ошибка при обновлении отзыва');
    } finally {
      setUploading(false);
    }
  };

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(file => handleFileUpload(file));
      const urls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
      if (urls.length > 0) {
        setReviewFormData({ ...reviewFormData, photos: [...reviewFormData.photos, ...urls] });
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleReviewPhotoDrop = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      const uploadPromises = imageFiles.map(file => handleFileUpload(file));
      const urls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
      if (urls.length > 0) {
        setReviewFormData(prev => ({ ...prev, photos: [...prev.photos, ...urls] }));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleReviewVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(file => handleFileUpload(file));
      const urls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
      if (urls.length > 0) {
        setReviewFormData({ ...reviewFormData, videos: [...reviewFormData.videos, ...urls] });
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleReviewVideoDrop = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const videoFiles = files.filter(f => f.type.startsWith('video/'));
      const uploadPromises = videoFiles.map(file => handleFileUpload(file));
      const urls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
      if (urls.length > 0) {
        setReviewFormData(prev => ({ ...prev, videos: [...prev.videos, ...urls] }));
      }
    } finally {
      setUploading(false);
    }
  };

  const loadWorks = async () => {
    try {
      const response = await fetch('/api/works', { cache: 'no-store' });
      const data = await response.json();
      setWorks(data);
    } catch (error) {
      console.error('Error loading works:', error);
    }
  };

  const loadPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      setPortfolioItems(data);
    } catch (error) {
      console.error('Ошибка загрузки портфолио:', error);
    }
  };

  const loadBlog = async () => {
    try {
      const response = await fetch('/api/blog');
      const data = await response.json();
      setBlogPosts(data);
    } catch (error) {
      console.error('Ошибка загрузки блога:', error);
    }
  };

  const loadTeam = async () => {
    try {
      const response = await fetch('/api/team');
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Ошибка загрузки команды:', error);
    }
  };

  const loadFAQ = async () => {
    try {
      const response = await fetch('/api/faq');
      const data = await response.json();
      setFaqCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки FAQ:', error);
    }
  };

  const loadPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      const data = await response.json();
      setPricingData(data);
    } catch (error) {
      console.error('Ошибка загрузки цен:', error);
    }
  };

  const loadContact = async () => {
    try {
      const response = await fetch('/api/contact');
      const data = await response.json();
      setContactData(data);
    } catch (error) {
      console.error('Ошибка загрузки контактов:', error);
    }
  };

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/contact?type=messages');
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'messages') return;
    void loadMessages();
  }, [activeTab, isAuthenticated, loadMessages]);

  const handleMessageMarkRead = async (id: string) => {
    try {
      const response = await fetch(`/api/contact?type=messages&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (response.ok) {
        loadMessages();
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса сообщения:', error);
    }
  };

  const handleMessageDelete = async (id: string) => {
    if (!confirm('Удалить это сообщение?')) return;
    try {
      const response = await fetch(`/api/contact?type=messages&id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        loadMessages();
        alert('Сообщение удалено!');
      }
    } catch (error) {
      console.error('Ошибка при удалении сообщения:', error);
      alert('Ошибка при удалении');
    }
  };

  const loadAllData = useCallback(async () => {
    loadPortfolio();
    loadBlog();
    loadTeam();
    loadFAQ();
    loadPricing();
    loadContact();
    loadWorks();
    loadReviews();
    loadMessages();
  }, []);

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    if (!auth) {
      router.push('/admin/login');
      return;
    }
    setIsAuthenticated(true);
    setLoading(false);
    loadAllData();
  }, [router, loadAllData]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    router.push('/admin/login');
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Начало загрузки файла:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Ответ сервера:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        console.error('Ошибка сервера:', errorData);
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      console.log('Данные ответа:', data);
      
      if (data.success && data.url) {
        console.log('✅ Файл успешно загружен:', {
          url: data.url,
          fileName: data.fileName,
          size: data.size,
          type: data.type
        });
        return data.url;
      } else {
        console.error('Ошибка в ответе:', data);
        throw new Error(data.error || 'Ошибка загрузки: файл не сохранён');
      }
    } catch (error: any) {
      console.error('❌ Ошибка загрузки файла:', error);
      const errorMessage = error.message || 'Ошибка при загрузке файла';
      alert(`❌ Ошибка при загрузке файла: ${errorMessage}\n\nПроверьте консоль браузера (F12) для деталей.`);
      return null;
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setUploading(true);
        const url = await handleFileUpload(file);
        if (url) {
          await handlePortfolioSubmitAuto(url, portfolioFormData.title || 'Без названия');
        }
        setUploading(false);
      } else {
        alert('Пожалуйста, загрузите изображение или видео');
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      const url = await handleFileUpload(file);
      if (url) {
        await handlePortfolioSubmitAuto(url, portfolioFormData.title || 'Без названия');
      }
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePortfolioSubmitAuto = async (imageUrl: string, title: string) => {
    try {
      const itemData = {
        title: title || portfolioFormData.title || 'Без названия',
        description: portfolioFormData.description || '',
        image: imageUrl,
        service: selectedService,
      };
      
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      
      if (response.ok) {
        loadPortfolio();
        setPortfolioFormData({ ...portfolioFormData, image: '' });
      }
    } catch {
      alert('Ошибка при добавлении работы');
    }
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioFormData.image) {
      alert('Пожалуйста, загрузите изображение или видео');
      return;
    }
    setUploading(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...portfolioFormData, service: selectedService }),
      });
      if (response.ok) {
        setPortfolioFormData({ title: '', description: '', image: '', service: selectedService });
        loadPortfolio();
        alert('Работа успешно добавлена!');
      }
    } catch {
      alert('Ошибка при добавлении работы');
    } finally {
      setUploading(false);
    }
  };

  const handlePortfolioDelete = async (service: string, id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту работу?')) return;
    try {
      const response = await fetch(`/api/portfolio?service=${service}&id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        loadPortfolio();
        alert('Работа удалена!');
      }
    } catch {
      alert('Ошибка при удалении');
    }
  };

  const handleBlogImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await handleFileUpload(file);
      if (url) {
        setBlogFormData({ ...blogFormData, image: url });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleBlogImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveBlogImage(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await handleBlogImageUpload(file);
      } else {
        alert('Пожалуйста, загрузите изображение');
      }
    }
  };

  const handleBlogImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleBlogImageUpload(file);
      e.target.value = '';
    }
  };

  const handleBlogEdit = (post: BlogPost) => {
    setEditingBlogPost(post);
    setBlogFormData({
      title: post.title,
      excerpt: post.excerpt,
      image: post.image,
      category: post.category,
      readTime: post.readTime,
      slug: post.slug,
      content: post.content || '',
    });
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogFormData.image) {
      alert('Пожалуйста, загрузите изображение');
      return;
    }
    setUploading(true);
    try {
      const method = editingBlogPost ? 'PUT' : 'POST';
      const postData = editingBlogPost 
        ? { ...editingBlogPost, ...blogFormData, id: editingBlogPost.id }
        : {
            ...blogFormData,
            date: new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
          };
      
      const response = await fetch('/api/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (response.ok) {
        const wasEditing = editingBlogPost;
        setBlogFormData({ title: '', excerpt: '', image: '', category: '', readTime: '', slug: '', content: '' });
        setEditingBlogPost(null);
        loadBlog();
        alert(wasEditing ? 'Статья обновлена!' : 'Статья успешно добавлена!');
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch {
      alert('Ошибка при сохранении статьи');
    } finally {
      setUploading(false);
    }
  };

  const handleBlogDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту статью?')) return;
    try {
      const response = await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadBlog();
        alert('Статья удалена!');
      }
    } catch {
      alert('Ошибка при удалении');
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const specialties = teamFormData.specialties.split(',').map(s => s.trim()).filter(s => s);
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teamFormData, specialties }),
      });
      if (response.ok) {
        setTeamFormData({ name: '', position: '', image: '', bio: '', specialties: '', experience: '' });
        loadTeam();
        alert('Член команды успешно добавлен!');
      }
    } catch {
      alert('Ошибка при добавлении');
    } finally {
      setUploading(false);
    }
  };

  const handleTeamDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого члена команды?')) return;
    try {
      const response = await fetch(`/api/team?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadTeam();
        alert('Удалено!');
      }
    } catch {
      alert('Ошибка при удалении');
    }
  };

  const handleFAQSave = async () => {
    setUploading(true);
    try {
      const response = await fetch('/api/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqCategories),
      });
      if (response.ok) {
        alert('FAQ успешно обновлен!');
      }
    } catch {
      alert('Ошибка при сохранении');
    } finally {
      setUploading(false);
    }
  };

  const handlePricingSave = async () => {
    setUploading(true);
    try {
      const response = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingData),
      });
      if (response.ok) {
        alert('Цены успешно обновлены!');
      }
    } catch {
      alert('Ошибка при сохранении');
    } finally {
      setUploading(false);
    }
  };

  const handleWorkMainImageUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress({ current: 0, total: 1, fileName: file.name });
    try {
      const url = await handleFileUpload(file);
      if (url) {
        setWorksFormData({ ...worksFormData, mainImage: url });
        console.log('✅ Основное фото загружено:', url);
        setUploadProgress({ current: 1, total: 1, fileName: file.name });
        setTimeout(() => setUploadProgress(null), 1000);
      } else {
        alert('❌ Не удалось загрузить основное фото. Проверьте консоль браузера для деталей.');
        setUploadProgress(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки основного фото:', error);
      alert('❌ Ошибка при загрузке основного фото');
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const handleWorkMainImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveWorks(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await handleWorkMainImageUpload(file);
      } else {
        alert('Пожалуйста, загрузите изображение');
      }
    }
  };

  const handleWorkMainImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleWorkMainImageUpload(file);
      e.target.value = '';
    }
  };

  const handleWorkAdditionalImagesUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;
    setUploading(true);
    setUploadProgress({ current: 0, total: totalFiles, fileName: '' });
    
    try {
      const results: Array<{ type: 'image'; url: string }> = [];
      let skipped = 0;
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress({ current: i + 1, total: totalFiles, fileName: file.name });
        
        if (!file.type.startsWith('image/')) {
          skipped++;
          continue;
        }

        const url = await handleFileUpload(file);
        if (url) {
          results.push({ type: 'image', url });
        }
      }
      
      const imageUrls = results.filter(r => r.type === 'image').map(r => r.url);
      
      if (imageUrls.length > 0) {
        const newImages = [...worksFormData.images, ...imageUrls];
        setWorksFormData({ 
          ...worksFormData, 
          images: newImages,
          videos: [] // видео не поддерживаем
        });
        console.log('Добавлены файлы:', { 
          images: imageUrls.length, 
          totalImages: newImages.length,
          isEditing: !!editingWork
        });
        const editMsg = editingWork ? ' (добавлены к существующим)' : '';
        alert(`✅ Загружено: ${imageUrls.length} фото${editMsg}\n\nВсего: ${newImages.length} фото${skipped ? `\nПропущено (не фото): ${skipped}` : ''}`);
      } else {
        alert(`❌ Не удалось загрузить файлы. Пропущено (не фото): ${skipped}`);
      }
    } catch (error) {
      console.error('Ошибка при загрузке дополнительных файлов:', error);
      alert('❌ Ошибка при загрузке файлов');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleWorkAdditionalImagesDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveAdditionalImages(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleWorkAdditionalImagesUpload(e.dataTransfer.files);
    }
  };

  const handleWorkAdditionalImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleWorkAdditionalImagesUpload(e.target.files);
      e.target.value = '';
    }
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const url = editingWork ? `/api/works?id=${editingWork.id}` : '/api/works';
      const method = editingWork ? 'PUT' : 'POST';
      
      const dataToSend = editingWork 
        ? { 
            ...editingWork, 
            ...worksFormData,
            videos: [], // отключаем отправку видео
            translations: undefined
          }
        : {
            ...worksFormData,
            videos: [], // отключаем отправку видео
            translations: undefined
          };
      
      console.log('Отправка работы:', {
        isEditing: !!editingWork,
        workId: editingWork?.id,
        title: dataToSend.title,
        mainImage: dataToSend.mainImage,
        images: dataToSend.images?.length || 0,
        videos: 0,
        category: dataToSend.category,
        imagesList: dataToSend.images,
        videosList: []
      });
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const result = await response.json();
        const work = result.work || result;
        const imagesCount = work.images?.length || 0;
        const videosCount = 0;
        
        if (editingWork) {
          const addedImages = imagesCount - (editingWork.images?.length || 0);
          const addedVideos = 0;
          const removedImages = (editingWork.images?.length || 0) - (worksFormData.images.length - addedImages);
          const removedVideos = 0;
          
          let changeMsg = '';
          if (addedImages > 0 || addedVideos > 0) {
            changeMsg += `\nДобавлено: ${addedImages} фото`;
          }
          if (removedImages > 0 || removedVideos > 0) {
            changeMsg += `\nУдалено: ${removedImages} фото`;
          }
          
          alert(`✅ Работа обновлена!\n\nВсего файлов:\n📷 Фото: ${imagesCount}${changeMsg}\n\nПереводы обновлены автоматически. Работа появится на сайте в течение 5 секунд.`);
        } else {
          alert(`✅ Работа успешно добавлена!\n\nФото: ${imagesCount}\n\nПереводы созданы автоматически на все языки. Работа появится в админ-панели и на сайте (Портфолио, Мои работы) в течение 5 секунд.`);
        }
        
        setWorksFormData({
          title: '',
          description: '',
          mainImage: '',
          category: '',
          projectId: '',
          images: [],
          videos: [],
          workDate: new Date().toISOString().split('T')[0],
          city: '',
          translations: {},
        });
        setEditingWork(null);
        setIsCustomCategory(false);
        loadWorks();
        notifyCommentsChanged();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        const errorMessage = errorData.error || 'Неизвестная ошибка';
        console.error('Error saving work:', errorMessage);
        alert(`Ошибка: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Error saving work:', error);
      alert(`Ошибка при сохранении: ${error.message || 'Проверьте консоль браузера для деталей'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleWorkDelete = async (id: string) => {
    if (!confirm('Удалить эту работу?')) return;
    
    setUploading(true);
    try {
      const response = await fetch(`/api/works?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Работа удалена!');
        loadWorks();
        notifyCommentsChanged();
      }
    } catch {
      alert('Ошибка при удалении');
    } finally {
      setUploading(false);
    }
  };

  const handleWorkEdit = (work: WorkData) => {
    setEditingWork(work);
    const predefinedCategories = ['Укладка пола', 'Покраска', 'Сантехника', 'Крыша', 'Сад', 'Плитка', 'Общие работы'];
    const isCustom = !!(work.category && !predefinedCategories.includes(work.category));
    setIsCustomCategory(isCustom);
    setWorksFormData({
      title: work.title,
      description: work.description,
      mainImage: work.mainImage,
      category: work.category,
      projectId: work.projectId || '',
      images: work.images || [],
      videos: [], // видео не поддерживаем
      workDate: work.workDate || new Date().toISOString().split('T')[0],
      city: work.city || '',
      translations: work.translations || {},
    });
  };

  const handleContactSave = async () => {
    setUploading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      if (response.ok) {
        alert('Контактная информация успешно обновлена!');
      }
    } catch {
      alert('Ошибка при сохранении');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const services = [
    { value: 'flooring-installation', label: 'Укладка Напольных Покрытий' },
    { value: 'painting', label: 'Малярные Услуги' },
    { value: 'plumbing-repairs', label: 'Сантехнические Работы' },
    { value: 'roof-repairs', label: 'Ремонт Крыш' },
    { value: 'garden-design-landscaping', label: 'Дизайн Сада' },
    { value: 'tile-removal-installation', label: 'Укладка Плитки' },
  ];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'works', label: 'Мои проекты' },
    { id: 'reviews', label: 'Отзывы' },
    { id: 'messages', label: 'Сообщения' },
  ];

  return (
    <div className="min-h-screen bg-black text-white w-full">
      <div className="w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 w-full sm:w-auto">
            <Link href="/" className="flex-shrink-0">
              <GradientButton className="px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden xs:inline">На главную</span>
                <span className="xs:hidden">←</span>
              </GradientButton>
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold truncate">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                Панель Администратора
              </span>
            </h1>
          </div>
          <GradientButton onClick={handleLogout} className="px-4 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base whitespace-nowrap flex-shrink-0 w-full sm:w-auto">
            Выйти
          </GradientButton>
        </div>

        <div className="flex gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-700 overflow-x-auto scrollbar-hide -mx-3 sm:-mx-0 px-3 sm:px-0">
          {tabs.map((tab) => (
            <GradientButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? undefined : 'variant'}
              className="px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap flex-shrink-0"
            >
              {tab.label}
            </GradientButton>
          ))}
        </div>

        <div className="mt-4 sm:mt-6 lg:mt-8">
          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,420px)_1fr] gap-4 sm:gap-6 lg:gap-8">
              {editingReview && (
                <div className="elegant-card p-4 sm:p-6 lg:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold elegant-title mb-4 sm:mb-6">Редактировать отзыв</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Имя</label>
                      <input
                        type="text"
                        value={reviewFormData.name}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Фамилия</label>
                      <input
                        type="text"
                        value={reviewFormData.surname}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, surname: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Фото профиля</label>
                      <div className="mb-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return;
                            setUploading(true);
                            try {
                              const file = e.target.files[0];
                              if (file.type.startsWith('image/')) {
                                const url = await handleFileUpload(file);
                                if (url) {
                                  setReviewFormData({ ...reviewFormData, profileImage: url });
                                }
                              }
                            } finally {
                              setUploading(false);
                              e.target.value = '';
                            }
                          }}
                          disabled={uploading}
                          id="review-profile-image-upload"
                          className="hidden"
                        />
                        <GradientButton
                          type="button"
                          onClick={() => document.getElementById('review-profile-image-upload')?.click()}
                          disabled={uploading}
                          className="text-sm mb-2"
                        >
                          {uploading ? 'Загрузка...' : reviewFormData.profileImage ? 'Изменить фото' : 'Добавить фото профиля'}
                        </GradientButton>
                      </div>
                      <div className="relative mb-2">
                        {reviewFormData.profileImage && reviewFormData.profileImage !== '/vk-bouwmaster-logo.svg' && reviewFormData.profileImage.trim() !== '' ? (
                          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-700">
                            <Image src={reviewFormData.profileImage} alt="Profile" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => setReviewFormData({ ...reviewFormData, profileImage: '' })}
                              className="absolute top-0 right-0 bg-red-600/90 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                              title="Удалить фото"
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
                      <label className="block text-sm font-medium mb-2">Город</label>
                      <input
                        type="text"
                        value={reviewFormData.city}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, city: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        placeholder="В каком городе был сделан заказ?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Сообщение</label>
                      <textarea
                        value={reviewFormData.message}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, message: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        rows={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Рейтинг</label>
                      <StarRating rating={reviewFormData.rating} onRatingChange={(rating) => setReviewFormData({ ...reviewFormData, rating })} />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Фото</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragActiveReviewPhotos(true); }}
                        onDragLeave={() => setDragActiveReviewPhotos(false)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragActiveReviewPhotos(false);
                          if (uploading) return;
                          const dropped = Array.from(e.dataTransfer.files || []);
                          await handleReviewPhotoDrop(dropped);
                        }}
                        className={`mb-3 border-2 border-dashed rounded-lg p-4 transition-colors ${
                          dragActiveReviewPhotos ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900/30'
                        } ${uploading ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-600'}`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleReviewPhotoUpload}
                          disabled={uploading}
                          id="review-photo-upload-edit"
                          className="hidden"
                        />
                        <GradientButton
                          type="button"
                          onClick={() => document.getElementById('review-photo-upload-edit')?.click()}
                          disabled={uploading}
                          className="text-sm"
                        >
                          {uploading ? 'Загрузка...' : 'Добавить фото'}
                        </GradientButton>
                        <p className="text-xs text-gray-400 mt-2">
                          Можно перетащить много фото сюда или выбрать файлы кнопкой
                        </p>
                      </div>
                      {reviewFormData.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {reviewFormData.photos.map((photo, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group">
                              <Image
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setReviewFormData({
                                  ...reviewFormData,
                                  photos: reviewFormData.photos.filter((_, i) => i !== idx)
                                })}
                                className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Удалить фото"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Видео</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragActiveReviewVideos(true); }}
                        onDragLeave={() => setDragActiveReviewVideos(false)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragActiveReviewVideos(false);
                          if (uploading) return;
                          const dropped = Array.from(e.dataTransfer.files || []);
                          await handleReviewVideoDrop(dropped);
                        }}
                        className={`mb-3 border-2 border-dashed rounded-lg p-4 transition-colors ${
                          dragActiveReviewVideos ? 'border-purple-500 bg-purple-900/15' : 'border-gray-700 bg-gray-900/30'
                        } ${uploading ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-600'}`}
                      >
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleReviewVideoUpload}
                          disabled={uploading}
                          id="review-video-upload-edit"
                          className="hidden"
                        />
                        <GradientButton
                          type="button"
                          variant="variant"
                          onClick={() => document.getElementById('review-video-upload-edit')?.click()}
                          disabled={uploading}
                          className="text-sm"
                        >
                          {uploading ? 'Загрузка...' : 'Добавить видео'}
                        </GradientButton>
                        <p className="text-xs text-gray-400 mt-2">
                          Можно перетащить много видео сюда или выбрать файлы кнопкой
                        </p>
                      </div>
                      {reviewFormData.videos.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {reviewFormData.videos.map((video, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-700 group">
                              <video src={video} controls className="w-full aspect-video bg-black" />
                              <button
                                type="button"
                                onClick={() => setReviewFormData({
                                  ...reviewFormData,
                                  videos: reviewFormData.videos.filter((_, i) => i !== idx)
                                })}
                                className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Удалить видео"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <GradientButton onClick={handleReviewSave} disabled={uploading} className="flex-1">
                        Сохранить
                      </GradientButton>
                      <GradientButton
                        onClick={() => {
                          setEditingReview(null);
                          setReviewFormData({
                            name: '',
                            surname: '',
                            message: '',
                            rating: 5,
                            city: '',
                            photos: [],
                            videos: [],
                            profileImage: '',
                          });
                        }}
                        variant="variant"
                      >
                        Отмена
                      </GradientButton>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="elegant-card p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold elegant-title shrink-0 break-normal">
                    Отзывы ({reviews.length})
                  </h2>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={reviewTranslateBusy || reviews.length === 0}
                      onClick={() => handleTranslateAllReviews(false)}
                      className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs sm:text-sm whitespace-nowrap"
                    >
                      {reviewTranslateBusy ? '…' : 'Дозаполнить переводы'}
                    </button>
                    <button
                      type="button"
                      disabled={reviewTranslateBusy || reviews.length === 0}
                      onClick={() => handleTranslateAllReviews(true)}
                      className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs sm:text-sm whitespace-nowrap"
                    >
                      Пересобрать все языки
                    </button>
                    <button
                      type="button"
                      disabled={reviewTranslateBusy}
                      onClick={() => void handleResetSeedRemovals()}
                      className="px-3 py-2 rounded-lg bg-amber-800/90 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm whitespace-nowrap"
                      title="Если новые отзывы из репозитория не появились после деплоя"
                    >
                      Показать все сиды с диска
                    </button>
                  </div>
                </div>
                <div className="space-y-4 max-h-[800px] overflow-y-auto">
                  {reviews.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Нет отзывов</p>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className={`bg-gray-900 rounded-lg p-5 border ${
                          review.approved ? 'border-green-600' : 'border-yellow-600'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-base sm:text-lg break-words">
                              {review.name} {review.surname || ''}
                            </div>
                            <div className="text-gray-400 text-xs sm:text-sm break-words">
                              Проект: {review.projectId} • {new Date(review.createdAt).toLocaleDateString()}
                              {review.city && <span> • {review.city}</span>}
                            </div>
                            {review.approved ? (
                              <span className="inline-block mt-1 px-2 py-1 bg-green-600 text-white text-xs rounded">
                                Одобрен
                              </span>
                            ) : (
                              <span className="inline-block mt-1 px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                                Ожидает одобрения
                              </span>
                            )}
                          </div>
                        </div>
                        {review.rating && (
                          <div className="mb-2">
                            <StarRating rating={review.rating} readOnly />
                          </div>
                        )}
                        <div className="text-gray-300 mb-3 sm:mb-4 whitespace-pre-wrap text-sm sm:text-base break-words">{review.message}</div>
                        {(review.photos && review.photos.length > 0) || (review.videos && review.videos.length > 0) ? (
                          <div className="mb-3 sm:mb-4">
                            {review.photos && review.photos.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-2">
                                {review.photos.map((photo, idx) => (
                                  <div key={idx} className="relative aspect-square rounded overflow-hidden">
                                    <Image src={photo} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                            {review.videos && review.videos.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                {review.videos.map((video, idx) => (
                                  <video key={idx} src={video} controls className="w-full rounded" />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                        <div className="flex flex-row flex-nowrap items-stretch gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                          <button
                            type="button"
                            disabled={reviewTranslateBusy}
                            onClick={() => handleTranslateOneReview(review.id)}
                            className="shrink-0 whitespace-nowrap px-2.5 py-1.5 sm:px-4 sm:py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 rounded text-xs sm:text-sm text-white"
                          >
                            Перевести
                          </button>
                          {!review.approved && (
                            <button
                              onClick={() => handleReviewApprove(review.id)}
                              className="shrink-0 whitespace-nowrap px-2.5 py-1.5 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 rounded text-xs sm:text-sm text-white"
                            >
                              Одобрить
                            </button>
                          )}
                          <button
                            onClick={() => handleReviewEdit(review)}
                            className="shrink-0 whitespace-nowrap px-2.5 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs sm:text-sm text-white"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleReviewReject(review.id)}
                            className="shrink-0 whitespace-nowrap px-2.5 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 rounded text-xs sm:text-sm text-white"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'works' && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,420px)_1fr] gap-4 sm:gap-6 lg:gap-8">
              <div className="elegant-card p-4 sm:p-6 lg:p-8">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold elegant-title">
                    {editingWork ? '✏️ Редактировать работу' : '➕ Добавить работу'}
                </h2>
                  {editingWork && (
                    <p className="text-sm text-green-400 mt-2">
                      Режим редактирования: можно изменять все поля, добавлять новые фото или удалять существующие
                    </p>
                  )}
                </div>
                <form onSubmit={handleWorkSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Название работы *</label>
                    <input
                      type="text"
                      value={worksFormData.title}
                      onChange={(e) => setWorksFormData({ ...worksFormData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Описание *</label>
                    <textarea
                      value={worksFormData.description}
                      onChange={(e) => setWorksFormData({ ...worksFormData, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 sm:mb-2">Категория *</label>
                    <select
                      value={isCustomCategory ? 'custom' : (worksFormData.category || '')}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomCategory(true);
                          setWorksFormData({ ...worksFormData, category: '' });
                        } else if (e.target.value !== '') {
                          setIsCustomCategory(false);
                          setWorksFormData({ ...worksFormData, category: e.target.value });
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-900 border border-gray-700 rounded-lg text-white mb-2"
                      required={!isCustomCategory}
                    >
                      <option value="" disabled>Выберите категорию</option>
                      <option value="Укладка пола">Укладка пола</option>
                      <option value="Покраска">Покраска</option>
                      <option value="Сантехника">Сантехника</option>
                      <option value="Крыша">Крыша</option>
                      <option value="Сад">Сад</option>
                      <option value="Плитка">Плитка</option>
                      <option value="Общие работы">Общие работы</option>
                      <option value="custom">✏️ Ввести свою категорию</option>
                    </select>
                    {isCustomCategory && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={worksFormData.category}
                          onChange={(e) => setWorksFormData({ ...worksFormData, category: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-900 border border-gray-700 rounded-lg text-white"
                          placeholder="Введите название категории"
                          required
                          autoFocus
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Введите название категории, которое будет сохранено для этой работы
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Основное фото *
                      {editingWork && worksFormData.mainImage && (
                        <span className="ml-2 text-xs text-green-400">
                          ✏️ Можно заменить на новое
                        </span>
                      )}
                    </label>
                    
                    {uploadProgress && uploadProgress.total === 1 && (
                      <div className="mb-3 p-4 bg-gray-900 rounded-lg border border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white">Загрузка основного фото...</span>
                          <span className="text-sm text-blue-400">
                            {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 truncate">{uploadProgress.fileName}</p>
                      </div>
                    )}
                    
                    {worksFormData.mainImage && (
                      <div className="mb-3 relative w-full h-48 rounded-lg overflow-hidden border border-gray-700 group bg-gray-800">
                        <Image
                          src={worksFormData.mainImage}
                          alt="Предпросмотр"
                          fill
                          className="object-cover"
                          unoptimized={worksFormData.mainImage.startsWith('/uploads/')}
                          onError={(e) => {
                            console.error('Main image load error:', worksFormData.mainImage);
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-red-500 text-sm">Ошибка загрузки изображения<br/>Проверьте путь: ${worksFormData.mainImage}</div>`;
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setWorksFormData({ ...worksFormData, mainImage: '' })}
                          className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    )}
                    <div
                      onDrop={handleWorkMainImageDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragActiveWorks(true); }}
                      onDragLeave={() => setDragActiveWorks(false)}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActiveWorks
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                      } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWorkMainImageSelect}
                        disabled={uploading}
                        className="hidden"
                        id="work-main-image-upload"
                      />
                      <label
                        htmlFor="work-main-image-upload"
                        className={`flex flex-col items-center gap-4 ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="text-white font-medium">
                            {uploading ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span>
                                Загрузка...
                              </span>
                            ) : (
                              'Перетащите фото сюда или нажмите для выбора'
                            )}
                          </p>
                          <p className="text-gray-400 text-sm mt-1">PNG, JPG, GIF до 100MB</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ID проекта (для группировки)</label>
                    <input
                      type="text"
                      value={worksFormData.projectId}
                      onChange={(e) => setWorksFormData({ ...worksFormData, projectId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      placeholder="Оставьте пустым для автосоздания"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Дополнительные фото
                    {(worksFormData.images.length > 0) && (
                        <span className="ml-2 text-blue-400">
                          ({worksFormData.images.length} фото)
                        </span>
                      )}
                      {editingWork && (
                        <span className="ml-2 text-xs text-green-400">
                          ✏️ Редактирование: можно добавлять новые или удалять существующие
                        </span>
                      )}
                    </label>
                    
                    {uploadProgress && (
                      <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white">
                            Загрузка: {uploadProgress.current} из {uploadProgress.total}
                          </span>
                          <span className="text-sm text-blue-400">
                            {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 truncate">{uploadProgress.fileName}</p>
                      </div>
                    )}
                    
                    {(worksFormData.images.length > 0) && (
                      <div className="grid grid-cols-3 gap-3 mb-3 max-h-96 overflow-y-auto p-2">
                        {worksFormData.images.map((img, idx) => (
                          <div key={`img-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group bg-gray-800">
                            <Image
                              src={img}
                              alt={`Фото ${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized={img.startsWith('/uploads/')}
                              onError={(e) => {
                                console.error('Image load error:', img);
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 text-xs">Ошибка загрузки</div>`;
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setWorksFormData({
                                ...worksFormData,
                                images: worksFormData.images.filter((_, i) => i !== idx)
                              })}
                              className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white w-7 h-7 rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Удалить фото"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-white text-xs">
                              📷 {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      onDrop={handleWorkAdditionalImagesDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragActiveAdditionalImages(true); }}
                      onDragLeave={() => setDragActiveAdditionalImages(false)}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActiveAdditionalImages
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                      } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleWorkAdditionalImagesSelect}
                        disabled={uploading}
                        className="hidden"
                        id="work-additional-images-upload"
                      />
                      <label
                        htmlFor="work-additional-images-upload"
                        className={`flex flex-col items-center gap-2 ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {uploading ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span>
                                Загрузка файлов...
                              </span>
                            ) : (
                              'Перетащите фото сюда или нажмите для выбора'
                            )}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {editingWork 
                              ? 'Можно добавить новые фото к существующим или удалить старые'
                              : 'Можно выбрать несколько фото одновременно'
                            }
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Город</label>
                    <input
                      type="text"
                      value={worksFormData.city}
                      onChange={(e) => setWorksFormData({ ...worksFormData, city: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      placeholder="В каком городе была выполнена работа?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Дата выполнения</label>
                    <input
                      type="date"
                      value={worksFormData.workDate}
                      onChange={(e) => setWorksFormData({ ...worksFormData, workDate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  {editingWork && (
                    <GradientButton
                      type="button"
                      onClick={() => {
                        setEditingWork(null);
                        setIsCustomCategory(false);
                        setWorksFormData({
                          title: '',
                          description: '',
                          mainImage: '',
                          category: '',
                          projectId: '',
                          images: [],
                          videos: [],
                          workDate: new Date().toISOString().split('T')[0],
                          city: '',
                          translations: {},
                        });
                      }}
                      className="w-full"
                    >
                      Отменить редактирование
                    </GradientButton>
                  )}
                  <GradientButton type="submit" disabled={uploading} className="w-full">
                    {uploading ? 'Сохранение...' : editingWork ? 'Обновить' : 'Добавить'}
                  </GradientButton>
                </form>
              </div>

              <div className="elegant-card p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold elegant-title shrink-0 break-normal">Работы ({works.length})</h2>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => void handleResetWorkSeedRemovals()}
                    className="px-3 py-2 rounded-lg bg-amber-800/90 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm whitespace-nowrap shrink-0"
                    title="Если работы из репозитория не видны после деплоя"
                  >
                    Показать все сиды работ (Git)
                  </button>
                </div>
                <div className="space-y-3 sm:space-y-4 max-h-[600px] sm:max-h-[800px] overflow-y-auto">
                  {works.length === 0 ? (
                    <p className="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">Нет работ. Добавьте первую работу.</p>
                  ) : (
                    works.map((work) => (
                      <div key={work.id} className="bg-gray-900 p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          {work.mainImage && (
                            <div className="relative w-full sm:w-20 md:w-24 h-40 sm:h-20 md:h-24 flex-shrink-0 rounded overflow-hidden bg-gray-800 border border-gray-700">
                              <Image
                                src={work.mainImage}
                                alt={work.title}
                                fill
                                className="object-cover"
                                unoptimized={work.mainImage.startsWith('/uploads/') || (work.mainImage.startsWith('https://') && work.mainImage.includes('blob.vercel-storage.com'))}
                                onError={(e) => {
                                  console.error('Image load error:', work.mainImage);
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 text-xs">Ошибка</div>`;
                                  }
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <h3 className="text-sm sm:text-base font-semibold text-white mb-1 break-words leading-snug">{work.title}</h3>
                            <p className="text-[11px] sm:text-xs text-blue-400 mb-1.5">{work.category}</p>
                            <p className="text-[11px] sm:text-xs text-gray-300 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">{work.description}</p>
                            
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3 text-[10px] sm:text-xs">
                            {work.projectId && (
                                <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">
                                  📁 {work.projectId}
                                </span>
                            )}
                            {work.images && work.images.length > 0 && (
                                <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">
                                  📷 {work.images.length} фото
                                </span>
                            )}
                            {work.videos && work.videos.length > 0 && (
                                <span className="px-2 py-1 bg-purple-900/50 rounded text-purple-300">
                                  📹 {work.videos.length} видео
                                </span>
                            )}
                            {work.city && (
                                <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">
                                  📍 {work.city}
                                </span>
                              )}
                              {work.workDate && (
                                <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">
                                  📅 {new Date(work.workDate).toLocaleDateString('ru-RU')}
                                </span>
                              )}
                            </div>
                            
                            {(work.images && work.images.length > 0) || (work.videos && work.videos.length > 0) ? (
                              <div className="mb-2 sm:mb-3">
                                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {work.images?.slice(0, 5).map((img, idx) => (
                                    <div key={idx} className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0 rounded overflow-hidden border border-gray-700 bg-gray-800">
                                      <Image
                                        src={img}
                                        alt={`Фото ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized={img.startsWith('/uploads/')}
                                        onError={(e) => {
                                          console.error('Thumbnail image load error:', img);
                                          e.currentTarget.style.display = 'none';
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 text-[8px]">Ошибка</div>`;
                                          }
                                        }}
                                      />
                                    </div>
                                  ))}
                                  {work.videos?.slice(0, 3).map((video, idx) => (
                                    <div key={`vid-${idx}`} className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-purple-700 bg-gray-800">
                                      <video
                                        src={video}
                                        className="w-full h-full object-cover"
                                        muted
                                        controls
                                        onError={(e) => {
                                          console.error('Thumbnail video load error:', video);
                                          e.currentTarget.style.display = 'none';
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            const fallback = parent.querySelector('.video-fallback');
                                            fallback?.classList.remove('hidden');
                                          }
                                        }}
                                      />
                                      <div className="video-fallback absolute inset-0 hidden items-center justify-center bg-gray-800 text-gray-500 text-[8px]">
                                        Ошибка
                                      </div>
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                        <span className="text-white text-xs">📹</span>
                                      </div>
                                    </div>
                                  ))}
                                  {((work.images?.length || 0) + (work.videos?.length || 0)) > 8 && (
                                    <div className="w-16 h-16 flex-shrink-0 rounded border border-gray-700 bg-gray-800 flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">
                                        +{((work.images?.length || 0) + (work.videos?.length || 0)) - 8}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}
                            
                            <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                              <button
                                onClick={() => handleWorkEdit(work)}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs sm:text-sm text-white transition-colors flex-1 sm:flex-none"
                              >
                                ✏️ Редактировать
                              </button>
                              <button
                                onClick={() => handleWorkDelete(work.id)}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 rounded text-xs sm:text-sm text-white transition-colors flex-1 sm:flex-none"
                              >
                                🗑️ Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="elegant-card p-4 sm:p-6 lg:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold elegant-title">
                  Сообщения с формы обратной связи ({messages.length})
                </h2>
                <GradientButton onClick={loadMessages} disabled={uploading}>
                  Обновить
                </GradientButton>
              </div>
              <div className="space-y-4 max-h-[800px] overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Нет сообщений</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`bg-gray-900 p-6 rounded-lg border-2 ${
                        message.read ? 'border-gray-700' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{message.name}</h3>
                            {!message.read && (
                              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                Новое
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-300">
                            <p>
                              <span className="text-gray-500">Email:</span>{' '}
                              <a
                                href={`mailto:${message.email}`}
                                className="text-blue-400 hover:underline"
                              >
                                {message.email}
                              </a>
                            </p>
                            {message.phone && (
                              <p>
                                <span className="text-gray-500">Телефон:</span>{' '}
                                <a
                                  href={`tel:${message.phone}`}
                                  className="text-blue-400 hover:underline"
                                >
                                  {message.phone}
                                </a>
                              </p>
                            )}
                            <p>
                              <span className="text-gray-500">Адрес:</span> {message.street}{' '}
                              {message.houseNumber}, {message.postalCode}
                              {message.city && `, ${message.city}`}
                            </p>
                            {message.service && (
                              <p>
                                <span className="text-gray-500">Услуга:</span> {message.service}
                              </p>
                            )}
                            <p>
                              <span className="text-gray-500">Дата:</span>{' '}
                              {new Date(message.createdAt).toLocaleString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!message.read && (
                            <button
                              onClick={() => handleMessageMarkRead(message.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white whitespace-nowrap"
                            >
                              Отметить прочитанным
                            </button>
                          )}
                          <button
                            onClick={() => handleMessageDelete(message.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm text-white whitespace-nowrap"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-gray-500 text-sm mb-2">Сообщение:</p>
                        <p className="text-white whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
