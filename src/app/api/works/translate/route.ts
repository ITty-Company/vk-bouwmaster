import { NextRequest, NextResponse } from 'next/server';
import { translateWork } from '@/lib/translate';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { ensureDirForFile, worksRuntimeFile, worksSeedFile } from '@/lib/data-file-paths';

function getWorksFilePath() {
  return worksRuntimeFile();
}

export interface PortfolioWork {
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
  translations?: Record<string, {
    title: string;
    description: string;
    category: string;
    city?: string;
  }>;
}

async function readWorksData(): Promise<PortfolioWork[]> {
  try {
    const data = readFileSync(getWorksFilePath(), 'utf-8');
    return JSON.parse(data);
  } catch (primaryError) {
    try {
      const data = readFileSync(worksSeedFile(), 'utf-8');
      const parsed = JSON.parse(data);
      try {
        const target = getWorksFilePath();
        ensureDirForFile(target);
        writeFileSync(target, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch (seedError) {
        console.warn('Не удалось сохранить seed данных:', seedError);
      }
      return parsed;
    } catch (fallbackError) {
      console.error('Ошибка чтения данных работ:', primaryError, fallbackError);
      return [];
    }
  }
}

async function writeWorksData(data: PortfolioWork[]): Promise<void> {
  try {
    const target = getWorksFilePath();
    ensureDirForFile(target);
    writeFileSync(target, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Ошибка записи данных работ:', error);
    throw new Error(`Не удалось сохранить данные: ${error.message || 'Неизвестная ошибка'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('workId'); // Опционально: перевести только одну работу
    const force = searchParams.get('force') === 'true'; // Принудительно перевести даже если переводы есть
    
    const works = await readWorksData();
    
    if (workId) {
      const index = works.findIndex(w => w.id === workId);
      if (index === -1) {
        return NextResponse.json(
          { error: 'Работа не найдена' },
          { status: 404 }
        );
      }
      
      const work = works[index];
      console.log(`[Translate API] 🔄 Translating work ${workId}: "${work.title.substring(0, 30)}..."`);
      
      try {
        const translations = await translateWork({
          title: work.title,
          description: work.description || '',
          category: work.category,
          city: work.city
        });
        
        works[index] = { ...work, translations };
        await writeWorksData(works);
        
        console.log(`[Translate API] ✅ Successfully translated work ${workId}`);
        return NextResponse.json({ 
          success: true, 
          message: `Переводы для работы ${workId} обновлены`,
          work: works[index]
        });
      } catch (error: any) {
        console.error(`[Translate API] ❌ Error translating work ${workId}:`, error);
        return NextResponse.json(
          { error: `Ошибка перевода: ${error.message || 'Неизвестная ошибка'}` },
          { status: 500 }
        );
      }
    } else {
      let translatedCount = 0;
      let errorCount = 0;
      
      console.log(`[Translate API] 🔄 Starting translation of ${works.length} works (force=${force})...`);
      
      for (let i = 0; i < works.length; i++) {
        const work = works[i];
        
        if (!force && work.translations && Object.keys(work.translations).length >= 5) {
          const hasAllFields = Object.values(work.translations).every(
            t => t && t.title && t.description && t.category
          );
          if (hasAllFields) {
            console.log(`[Translate API] ⏭️ Skipping work ${work.id} (already translated)`);
            continue;
          }
        }
        
        try {
          console.log(`[Translate API] 🔄 Translating work ${i + 1}/${works.length}: "${work.title.substring(0, 30)}..."`);
          const translations = await translateWork({
            title: work.title,
            description: work.description || '',
            category: work.category,
            city: work.city
          });
          
          works[i] = { ...work, translations };
          translatedCount++;
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(`[Translate API] ❌ Error translating work ${work.id}:`, error.message || error);
          errorCount++;
        }
      }
      
      if (translatedCount > 0) {
        await writeWorksData(works);
        console.log(`[Translate API] ✅ Saved ${translatedCount} translated works`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Переведено работ: ${translatedCount}, ошибок: ${errorCount}`,
        translated: translatedCount,
        errors: errorCount,
        total: works.length
      });
    }
  } catch (error: any) {
    console.error('[Translate API] ❌ Fatal error:', error);
    return NextResponse.json(
      { error: `Критическая ошибка: ${error.message || 'Неизвестная ошибка'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const works = await readWorksData();
    
    const stats = {
      total: works.length,
      withTranslations: 0,
      withoutTranslations: 0,
      incompleteTranslations: 0,
      works: works.map(work => ({
        id: work.id,
        title: work.title.substring(0, 50),
        hasTranslations: !!work.translations,
        translationCount: work.translations ? Object.keys(work.translations).length : 0,
        languages: work.translations ? Object.keys(work.translations) : []
      }))
    };
    
    works.forEach(work => {
      if (!work.translations || Object.keys(work.translations).length === 0) {
        stats.withoutTranslations++;
      } else if (Object.keys(work.translations).length < 5) {
        stats.incompleteTranslations++;
      } else {
        stats.withTranslations++;
      }
    });
    
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[Translate API] ❌ Error getting translation stats:', error);
    return NextResponse.json(
      { error: `Ошибка получения статистики: ${error.message || 'Неизвестная ошибка'}` },
      { status: 500 }
    );
  }
}

