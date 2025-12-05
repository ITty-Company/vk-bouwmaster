"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { GradientButton } from '@/components/ui/gradient-button';

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

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<Record<string, PortfolioItem[]>>({});
  const [selectedService, setSelectedService] = useState('flooring-installation');
  const [portfolioFormData, setPortfolioFormData] = useState({
    title: '',
    description: '',
    image: '',
    service: 'flooring-installation',
  });
  const [dragActive, setDragActive] = useState(false);

  // Blog state
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

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    position: '',
    image: '',
    bio: '',
    specialties: '',
    experience: '',
  });

  // FAQ state
  const [faqCategories, setFaqCategories] = useState<FAQCategory[]>([]);

  // Pricing state
  const [pricingData, setPricingData] = useState<PricingData>({ packages: [], services: [] });

  // Contact state
  const [contactData, setContactData] = useState<ContactData>({
    phone: { number1: '', number2: '' },
    email: { address1: '', address2: '' },
    address: { street: '', city: '' },
    hours: { weekdays: '', saturday: '', sunday: '' },
    emergency: { phone: '' }
  });

  // Messages state
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const [uploading, setUploading] = useState(false);
  const [dragActiveWorks, setDragActiveWorks] = useState(false);
  const [dragActiveAdditionalImages, setDragActiveAdditionalImages] = useState(false);

  // Works Gallery state
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

  // Reviews state
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
      const response = await fetch('/api/comments?includeUnapproved=1');
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
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
      // Подготовка данных для отправки
      // Отправляем пустые массивы для удаления всех фото/видео, если они были удалены
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
        body: JSON.stringify(dataToSave),
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

  const loadWorks = async () => {
    try {
      const response = await fetch('/api/works');
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

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/contact?type=messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

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

  // Portfolio handlers
  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.url) {
        console.log('Файл успешно загружен:', data.url);
        return data.url;
      } else {
        throw new Error(data.error || 'Ошибка загрузки: файл не сохранён');
      }
    } catch (error: any) {
      console.error('Ошибка загрузки файла:', error);
      const errorMessage = error.message || 'Ошибка при загрузке файла';
      alert(`Ошибка при загрузке файла: ${errorMessage}\n\nПроверьте консоль браузера для деталей.`);
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
          // Автоматически добавляем работу сразу при загрузке
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
        // Автоматически добавляем работу сразу при загрузке
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
        // Не очищаем форму, чтобы можно было добавить ещё работы с теми же данными
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

  // Blog handlers
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

  // Team handlers
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

  // FAQ handlers
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

  // Pricing handlers
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

  // Works handlers
  const handleWorkMainImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await handleFileUpload(file);
      if (url) {
        setWorksFormData({ ...worksFormData, mainImage: url });
        console.log('Основное фото загружено:', url);
      } else {
        alert('Не удалось загрузить основное фото. Проверьте консоль браузера для деталей.');
      }
    } catch (error) {
      console.error('Ошибка загрузки основного фото:', error);
      alert('Ошибка при загрузке основного фото');
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
    setUploading(true);
    try {
      const imagePromises = Array.from(files).map(async (file) => {
        if (file.type.startsWith('image/')) {
          const url = await handleFileUpload(file);
          if (url) {
            return { type: 'image' as const, url };
          }
          return null;
        }
        if (file.type.startsWith('video/')) {
          const url = await handleFileUpload(file);
          if (url) {
            return { type: 'video' as const, url };
          }
          return null;
        }
        return null;
      });
      
      const results = (await Promise.all(imagePromises)).filter(Boolean) as Array<{ type: 'image' | 'video'; url: string }>;
      const imageUrls = results.filter(r => r.type === 'image' && r.url).map(r => r.url);
      const videoUrls = results.filter(r => r.type === 'video' && r.url).map(r => r.url);
      
      if (imageUrls.length > 0 || videoUrls.length > 0) {
        const newImages = [...worksFormData.images, ...imageUrls];
        const newVideos = [...worksFormData.videos, ...videoUrls];
        setWorksFormData({ 
          ...worksFormData, 
          images: newImages,
          videos: newVideos
        });
        console.log('Добавлены файлы:', { images: imageUrls.length, videos: videoUrls.length });
        alert(`Загружено: ${imageUrls.length} фото, ${videoUrls.length} видео`);
      } else {
        alert('Не удалось загрузить файлы. Проверьте консоль браузера.');
      }
    } catch (error) {
      console.error('Ошибка при загрузке дополнительных файлов:', error);
      alert('Ошибка при загрузке файлов');
    } finally {
      setUploading(false);
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
      
      // При создании и редактировании не передаем переводы - API создаст/обновит их автоматически
      // API автоматически определит, нужно ли обновлять переводы (если изменились title, description, category или city)
      const dataToSend = editingWork 
        ? { 
            ...editingWork, 
            ...worksFormData,
            // Не передаем переводы - API обновит их автоматически при изменении текстовых полей
            translations: undefined
          }
        : {
            ...worksFormData,
            // Убираем пустые переводы при создании - API автоматически создаст переводы на все языки
            translations: undefined
          };
      
      // Логируем данные для отладки
      console.log('Отправка работы:', {
        title: dataToSend.title,
        mainImage: dataToSend.mainImage,
        images: dataToSend.images?.length || 0,
        videos: dataToSend.videos?.length || 0,
        category: dataToSend.category
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
        const videosCount = work.videos?.length || 0;
        
        if (editingWork) {
          alert(`Работа обновлена!\n\nФото: ${imagesCount}\nВидео: ${videosCount}\n\nПереводы обновлены автоматически. Работа появится на сайте в течение 5 секунд.`);
        } else {
          alert(`Работа успешно добавлена!\n\nФото: ${imagesCount}\nВидео: ${videosCount}\n\nПереводы созданы автоматически на все языки. Работа появится в админ-панели и на сайте (Портфолио, Мои работы) в течение 5 секунд.`);
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
        loadWorks();
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
      }
    } catch {
      alert('Ошибка при удалении');
    } finally {
      setUploading(false);
    }
  };

  const handleWorkEdit = (work: WorkData) => {
    setEditingWork(work);
    setWorksFormData({
      title: work.title,
      description: work.description,
      mainImage: work.mainImage,
      category: work.category,
      projectId: work.projectId || '',
      images: work.images || [],
      videos: work.videos || [],
      workDate: work.workDate || new Date().toISOString().split('T')[0],
      city: work.city || '',
      translations: work.translations || {},
    });
  };

  // Contact handlers
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
      <div className="w-full px-4 py-6 sm:px-6 md:px-8 lg:px-12 xl:px-16 lg:py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Link href="/">
              <GradientButton className="px-4 py-2 flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                На главную
              </GradientButton>
            </Link>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                Панель Администратора
              </span>
            </h1>
          </div>
          <GradientButton onClick={handleLogout} className="px-6 py-2 whitespace-nowrap flex-shrink-0">
            Выйти
          </GradientButton>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-gray-700">
          {tabs.map((tab) => (
            <GradientButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? undefined : 'variant'}
              className="px-6 py-3 font-semibold"
            >
              {tab.label}
            </GradientButton>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
              {/* Edit Form */}
              {editingReview && (
                <div className="elegant-card p-8">
                  <h2 className="text-2xl font-bold elegant-title mb-6">Редактировать отзыв</h2>
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
                    
                    {/* Фото */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Фото</label>
                      <div className="mb-3">
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

                    {/* Видео */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Видео</label>
                      <div className="mb-3">
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
              
              {/* Reviews List */}
              <div className="elegant-card p-8">
                <h2 className="text-2xl font-bold elegant-title mb-6">
                  Отзывы ({reviews.length})
                </h2>
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
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-white font-bold text-lg">
                              {review.name} {review.surname || ''}
                            </div>
                            <div className="text-gray-400 text-sm">
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
                        <div className="text-gray-300 mb-4 whitespace-pre-wrap">{review.message}</div>
                        {(review.photos && review.photos.length > 0) || (review.videos && review.videos.length > 0) ? (
                          <div className="mb-4">
                            {review.photos && review.photos.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mb-2">
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
                        <div className="flex gap-2">
                          {!review.approved && (
                            <button
                              onClick={() => handleReviewApprove(review.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
                            >
                              Одобрить
                            </button>
                          )}
                          <button
                            onClick={() => handleReviewEdit(review)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleReviewReject(review.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
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
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
              <div className="elegant-card p-8">
                <h2 className="text-2xl font-bold elegant-title mb-6">
                  {editingWork ? 'Редактировать работу' : 'Добавить работу'}
                </h2>
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
                    <label className="block text-sm font-medium mb-2">Категория *</label>
                    <select
                      value={worksFormData.category}
                      onChange={(e) => setWorksFormData({ ...worksFormData, category: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      required
                    >
                      <option value="">Выберите категорию</option>
                      <option value="Укладка пола">Укладка пола</option>
                      <option value="Покраска">Покраска</option>
                      <option value="Сантехника">Сантехника</option>
                      <option value="Крыша">Крыша</option>
                      <option value="Сад">Сад</option>
                      <option value="Плитка">Плитка</option>
                      <option value="Общие работы">Общие работы</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Основное фото *</label>
                    {worksFormData.mainImage && (
                      <div className="mb-3 relative w-full h-48 rounded-lg overflow-hidden border border-gray-700">
                        <Image
                          src={worksFormData.mainImage}
                          alt="Предпросмотр"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setWorksFormData({ ...worksFormData, mainImage: '' })}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Удалить
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
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWorkMainImageSelect}
                        className="hidden"
                        id="work-main-image-upload"
                      />
                      <label
                        htmlFor="work-main-image-upload"
                        className="cursor-pointer flex flex-col items-center gap-4"
                      >
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="text-white font-medium">
                            {uploading ? 'Загрузка...' : 'Перетащите фото сюда или нажмите для выбора'}
                          </p>
                          <p className="text-gray-400 text-sm mt-1">PNG, JPG, GIF до 10MB</p>
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
                    <label className="block text-sm font-medium mb-2">Дополнительные фото и видео</label>
                    {(worksFormData.images.length > 0 || worksFormData.videos.length > 0) && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {worksFormData.images.map((img, idx) => (
                          <div key={`img-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700">
                            <Image
                              src={img}
                              alt={`Фото ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setWorksFormData({
                                ...worksFormData,
                                images: worksFormData.images.filter((_, i) => i !== idx)
                              })}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {worksFormData.videos.map((video, idx) => (
                          <div key={`video-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700">
                            <video src={video} className="w-full h-full object-cover" muted />
                            <button
                              type="button"
                              onClick={() => setWorksFormData({
                                ...worksFormData,
                                videos: worksFormData.videos.filter((_, i) => i !== idx)
                              })}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                            >
                              ×
                            </button>
                            <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-white text-xs">
                              📹
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
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleWorkAdditionalImagesSelect}
                        className="hidden"
                        id="work-additional-images-upload"
                      />
                      <label
                        htmlFor="work-additional-images-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {uploading ? 'Загрузка...' : 'Перетащите фото и видео сюда или нажмите для выбора'}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">Можно выбрать несколько файлов</p>
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
                  
                  {/* Translations Section */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Переводы на другие языки
                      <span className="text-xs text-gray-400 ml-2 font-normal">
                        (Автоматически создаются при сохранении. Можно редактировать вручную)
                      </span>
                    </label>
                    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-700 rounded-lg p-3">
                      {languages.filter(lang => lang !== 'RU').map((lang) => {
                        const flagByLang: Record<string, string> = {
                          RU: '🇷🇺', EN: '🇬🇧', NL: '🇳🇱', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', IT: '🇮🇹', PT: '🇵🇹', PL: '🇵🇱', CZ: '🇨🇿', BG: '🇧🇬', RO: '🇷🇴', HU: '🇭🇺', UA: '🇺🇦', FI: '🇫🇮', SV: '🇸🇪', DA: '🇩🇰', NO: '🇳🇴', GR: '🇬🇷', HR: '🇭🇷', SK: '🇸🇰', SL: '🇸🇮', ET: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹'
                        };
                        const translation = worksFormData.translations[lang] || { title: '', description: '', category: '', city: '' };
                        const isExpanded = expandedTranslationLang === lang;
                        
                        return (
                          <div key={lang} className="border border-gray-700 rounded p-2">
                            <button
                              type="button"
                              onClick={() => setExpandedTranslationLang(isExpanded ? null : lang)}
                              className="w-full flex items-center justify-between text-left text-sm text-white hover:bg-gray-800 p-2 rounded"
                            >
                              <span>{flagByLang[lang] || '🏳️'} {lang}</span>
                              <span>{isExpanded ? '▼' : '▶'}</span>
                            </button>
                            {isExpanded && (
                              <div className="mt-2 space-y-2 pl-2">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Название</label>
                                  <input
                                    type="text"
                                    value={translation.title}
                                    onChange={(e) => {
                                      const newTranslations = { ...worksFormData.translations };
                                      newTranslations[lang] = { ...translation, title: e.target.value };
                                      setWorksFormData({ ...worksFormData, translations: newTranslations });
                                    }}
                                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded text-white"
                                    placeholder="Название работы"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Описание</label>
                                  <textarea
                                    value={translation.description}
                                    onChange={(e) => {
                                      const newTranslations = { ...worksFormData.translations };
                                      newTranslations[lang] = { ...translation, description: e.target.value };
                                      setWorksFormData({ ...worksFormData, translations: newTranslations });
                                    }}
                                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded text-white"
                                    rows={2}
                                    placeholder="Описание работы"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Категория</label>
                                  <input
                                    type="text"
                                    value={translation.category}
                                    onChange={(e) => {
                                      const newTranslations = { ...worksFormData.translations };
                                      newTranslations[lang] = { ...translation, category: e.target.value };
                                      setWorksFormData({ ...worksFormData, translations: newTranslations });
                                    }}
                                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded text-white"
                                    placeholder="Категория"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Город</label>
                                  <input
                                    type="text"
                                    value={translation.city || ''}
                                    onChange={(e) => {
                                      const newTranslations = { ...worksFormData.translations };
                                      newTranslations[lang] = { ...translation, city: e.target.value };
                                      setWorksFormData({ ...worksFormData, translations: newTranslations });
                                    }}
                                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded text-white"
                                    placeholder="Город"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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

              <div className="elegant-card p-8">
                <h2 className="text-2xl font-bold elegant-title mb-6">Работы ({works.length})</h2>
                <div className="space-y-4 max-h-[800px] overflow-y-auto">
                  {works.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Нет работ. Добавьте первую работу.</p>
                  ) : (
                    works.map((work) => (
                      <div key={work.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-start gap-4">
                          {work.mainImage && (
                            <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                              <Image
                                src={work.mainImage}
                                alt={work.title}
                                fill
                                className="object-cover"
                                unoptimized={work.mainImage.startsWith('https://') && work.mainImage.includes('blob.vercel-storage.com')}
                                onError={(e) => {
                                  console.error('Image load error:', work.mainImage);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white mb-1">{work.title}</h3>
                            <p className="text-sm text-blue-400 mb-2">{work.category}</p>
                            <p className="text-sm text-gray-300 line-clamp-2 mb-3">{work.description}</p>
                            {work.projectId && (
                              <p className="text-xs text-gray-500 mb-2">Проект: {work.projectId}</p>
                            )}
                            {work.images && work.images.length > 0 && (
                              <p className="text-xs text-gray-500 mb-1">Доп. фото: {work.images.length}</p>
                            )}
                            {work.videos && work.videos.length > 0 && (
                              <p className="text-xs text-gray-500 mb-1">Видео: {work.videos.length}</p>
                            )}
                            {work.city && (
                              <p className="text-xs text-gray-500 mb-1">Город: {work.city}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleWorkEdit(work)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={() => handleWorkDelete(work.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
                              >
                                Удалить
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
            <div className="elegant-card p-8">
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
