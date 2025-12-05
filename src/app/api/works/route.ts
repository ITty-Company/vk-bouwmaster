import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { translateWork } from '@/lib/translate';
import { put } from '@vercel/blob'; // Только put, без get

const WORKS_FILE = join(process.cwd(), 'src/lib/works-data.json');
const WORKS_BLOB_KEY = 'works-data.json';

export interface WorkTranslations {
  title: string;
  description: string;
  category: string;
  city?: string;
}

export interface PortfolioWork {
  id: string;
  title: string;
  description: string;
  mainImage: string;
  category: string;
  projectId?: string;
  images?: string[];
  videos?: string[]; // optional list of video urls per work
  workDate?: string;
  city?: string; // Город, где была выполнена работа
  translations?: Record<string, WorkTranslations>;
}

async function readWorksData(): Promise<PortfolioWork[]> {
  const isVercel = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN;
  if (isVercel) {
    // Публичный fetch вместо get!
    const url = 'https://vk-bouwmaster-blob.public.blob.vercel-storage.com/works-data.json';
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error) {
      console.error('Error reading from Blob:', error);
      return [];
    }
  }
  // Локальное чтение
  try {
    const data = readFileSync(WORKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeWorksData(data: PortfolioWork[]): Promise<void> {
  const isVercel = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN;
  
  if (isVercel && process.env.BLOB_READ_WRITE_TOKEN) {
    // Используем Vercel Blob Storage на продакшене
    try {
      const jsonData = JSON.stringify(data, null, 2);
      await put(WORKS_BLOB_KEY, jsonData, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (error: any) {
      console.error('Error writing to Blob:', error);
      throw new Error(`Ошибка записи в хранилище: ${error.message || 'Неизвестная ошибка'}`);
    }
  } else {
    // Локальная запись в файл
    try {
  writeFileSync(WORKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error: any) {
      // Проверяем, не является ли это ошибкой файловой системы (например, на Vercel)
      if (error.code === 'EROFS' || error.code === 'EACCES' || error.message?.includes('read-only')) {
        throw new Error('Файловая система доступна только для чтения. На Vercel нужно использовать Vercel Blob Storage.');
      }
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');
    const translateAll = searchParams.get('translateAll') === 'true';

    let works = await readWorksData();

    if (projectId) {
      works = works.filter(work => work.projectId === projectId);
    }

    if (category) {
      works = works.filter(work => work.category === category);
    }

    // Если запрошено перевести все работы без переводов
    if (translateAll) {
      let updated = false;
      for (let i = 0; i < works.length; i++) {
        const work = works[i];
        if (!work.translations || Object.keys(work.translations).length === 0) {
          try {
            const translations = await translateWork({
              title: work.title,
              description: work.description || '',
              category: work.category,
              city: work.city
            });
            works[i] = { ...work, translations };
            updated = true;
            // Небольшая задержка между работами
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error translating work ${work.id}:`, error);
          }
        }
      }
      if (updated) {
        await writeWorksData(works);
      }
    }

    return NextResponse.json(works);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при чтении данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const work: PortfolioWork = await request.json();

    if (!work.title || !work.mainImage || !work.category) {
      return NextResponse.json(
        { error: 'Необходимы: title, mainImage, category' },
        { status: 400 }
      );
    }

    // Автоматически переводим на все языки
    let translations: Record<string, WorkTranslations> | undefined;
    try {
      translations = await translateWork({
        title: work.title,
        description: work.description || '',
        category: work.category,
        city: work.city
      });
    } catch (translationError) {
      console.error('Translation error:', translationError);
      // Продолжаем без переводов, если произошла ошибка
    }

    const works = await readWorksData();

    const newWork: PortfolioWork = {
      ...work,
      id: work.id || Date.now().toString(),
      projectId: work.projectId || `project-${Date.now()}`,
      workDate: work.workDate || new Date().toISOString().split('T')[0],
      translations: translations || work.translations
    };

    works.push(newWork);
    await writeWorksData(works);

    return NextResponse.json({ success: true, work: newWork });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const work: PortfolioWork = await request.json();

    if (!id && !work.id) {
      return NextResponse.json(
        { error: 'Необходим id работы' },
        { status: 400 }
      );
    }

    const workId = id || work.id;
    const works = await readWorksData();
    const index = works.findIndex(w => w.id === workId);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    // Если изменились title, description, category или city, обновляем переводы
    const existingWork = works[index];
    const needsRetranslation = 
      work.title !== existingWork.title ||
      work.description !== existingWork.description ||
      work.category !== existingWork.category ||
      work.city !== existingWork.city;

    let translations = work.translations || existingWork.translations;
    
    if (needsRetranslation && (work.title || work.description || work.category || work.city)) {
      try {
        translations = await translateWork({
          title: work.title || existingWork.title,
          description: work.description || existingWork.description || '',
          category: work.category || existingWork.category,
          city: work.city || existingWork.city
        });
      } catch (translationError) {
        console.error('Translation error:', translationError);
        // Используем существующие переводы или те, что были переданы
      }
    }

    works[index] = { 
      ...existingWork, 
      ...work, 
      id: workId,
      translations: translations || existingWork.translations
    };
    await writeWorksData(works);

    return NextResponse.json({ success: true, work: works[index] });
  } catch (error: any) {
    console.error('Error in PUT:', error);
    const errorMessage = error.message || 'Ошибка при обновлении';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Необходим id работы' },
        { status: 400 }
      );
    }

    const works = await readWorksData();
    const filteredWorks = works.filter(work => work.id !== id);
    await writeWorksData(filteredWorks);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении' },
      { status: 500 }
    );
  }
}


