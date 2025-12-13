import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { translateServicePage } from '@/lib/translate';

// Путь к persistent-хранилищу
const RENDER_DISK_PATH = '/uploads';
const LOCAL_UPLOADS_PATH = join(process.cwd(), 'public', 'uploads');
const FALLBACK_REPO_FILE = join(process.cwd(), 'src', 'lib', 'services-data.json');

const getStorageDir = () => (existsSync(RENDER_DISK_PATH) ? RENDER_DISK_PATH : LOCAL_UPLOADS_PATH);
const getServicesFilePath = () => join(getStorageDir(), 'services-data.json');

function ensureStorageDir() {
  const dir = getStorageDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export interface ServicePage {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  solutions: {
    title: string;
    description1: string;
    description2: string;
    projectsCompleted: string;
    yearsExperience: string;
  };
  services: {
    title: string;
    items: string[];
  };
  translations?: Record<string, ServicePageTranslations>;
}

export interface ServicePageTranslations {
  hero: {
    title: string;
    subtitle: string;
  };
  solutions: {
    title: string;
    description1: string;
    description2: string;
    projectsCompleted: string;
    yearsExperience: string;
  };
  services: {
    title: string;
    items: string[];
  };
}

const EXPECTED_LANGUAGES = ['RU', 'EN', 'NL', 'DE', 'FR', 'ES', 'IT', 'PT', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SL', 'ET', 'LV', 'LT', 'FI', 'SV', 'DA', 'NO', 'GR', 'UA'];

function needsTranslation(service: ServicePage): boolean {
  const translations = service.translations;
  if (!translations || Object.keys(translations).length === 0) return true;
  
  const missingLanguages = EXPECTED_LANGUAGES.filter(lang => !translations[lang]);
  if (missingLanguages.length > 0) {
    console.log(`[needsTranslation] Service ${service.id} missing translations for: ${missingLanguages.join(', ')}`);
    return true;
  }
  
  const hasEmptyTranslations = Object.values(translations).some(
    (t) => !t || !t.hero || !t.hero.title || !t.hero.subtitle || !t.solutions || !t.services
  );
  if (hasEmptyTranslations) {
    console.log(`[needsTranslation] Service ${service.id} has empty translations`);
    return true;
  }
  
  return false;
}

async function readServicesData(): Promise<ServicePage[]> {
  try {
    const data = readFileSync(getServicesFilePath(), 'utf-8');
    return JSON.parse(data);
  } catch (primaryError) {
    try {
      const data = readFileSync(FALLBACK_REPO_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      const services = parsed.services || [];
      try {
        ensureStorageDir();
        writeFileSync(getServicesFilePath(), JSON.stringify(services, null, 2), 'utf-8');
      } catch (seedError) {
        console.warn('Не удалось сохранить seed данных в основное хранилище:', seedError);
      }
      return services;
    } catch (fallbackError) {
      console.error('Ошибка чтения данных услуг:', primaryError, fallbackError);
      return [];
    }
  }
}

async function writeServicesData(data: ServicePage[]): Promise<void> {
  try {
    ensureStorageDir();
    writeFileSync(getServicesFilePath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Ошибка записи данных услуг:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    let services = await readServicesData();
    
    // Проверяем и переводим услуги, которым нужны переводы
    const servicesNeedingTranslation = services.filter(needsTranslation);
    
    if (servicesNeedingTranslation.length > 0) {
      console.log(`[Services API] Found ${servicesNeedingTranslation.length} services needing translation out of ${services.length} total`);
      
      // Переводим все услуги, которым нужны переводы
      for (const service of servicesNeedingTranslation) {
        try {
          console.log(`[Services API] Translating service: ${service.id}`);
          const translations = await translateServicePage(service);
          
          // Обновляем услугу с переводами
          const serviceIndex = services.findIndex(s => s.id === service.id);
          if (serviceIndex !== -1) {
            services[serviceIndex] = {
              ...services[serviceIndex],
              translations
            };
          }
        } catch (error: any) {
          console.error(`[Services API] Error translating service ${service.id}:`, error.message || error);
        }
      }
      
      // Сохраняем обновленные данные
      await writeServicesData(services);
    }
    
    return NextResponse.json(services);
  } catch (error: any) {
    console.error('[Services API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const service: ServicePage = await request.json();
    
    let services = await readServicesData();
    const existingIndex = services.findIndex(s => s.id === service.id);
    
    if (existingIndex !== -1) {
      // Обновляем существующую услугу
      const oldService = services[existingIndex];
      
      // Проверяем, изменились ли основные поля (которые требуют перевода)
      const contentChanged = 
        oldService.hero.title !== service.hero.title ||
        oldService.hero.subtitle !== service.hero.subtitle ||
        oldService.solutions.title !== service.solutions.title ||
        oldService.solutions.description1 !== service.solutions.description1 ||
        oldService.solutions.description2 !== service.solutions.description2 ||
        JSON.stringify(oldService.services.items) !== JSON.stringify(service.services.items);
      
      services[existingIndex] = service;
      
      // Если контент изменился, нужно перевести заново
      if (contentChanged || needsTranslation(service)) {
        console.log(`[Services API] Content changed for service ${service.id}, generating new translations`);
        const translations = await translateServicePage(service);
        services[existingIndex].translations = translations;
      }
    } else {
      // Добавляем новую услугу
      services.push(service);
      
      // Генерируем переводы для новой услуги
      if (needsTranslation(service)) {
        console.log(`[Services API] Generating translations for new service ${service.id}`);
        const translations = await translateServicePage(service);
        services[services.length - 1].translations = translations;
      }
    }
    
    await writeServicesData(services);
    return NextResponse.json({ success: true, service: services.find(s => s.id === service.id) });
  } catch (error: any) {
    console.error('[Services API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

