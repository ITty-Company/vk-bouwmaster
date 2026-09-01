import { NextRequest, NextResponse } from 'next/server';
import { translateWork } from '@/lib/translate';
import { uploadServedViaApi } from '@/lib/data-file-paths';
import {
  readMergedWorks,
  persistMergedWorks,
  type PortfolioWork,
  type WorkTranslations,
  type PersistWorksMergedOptions,
} from '@/lib/works-storage';
import { TRANSLATION_LANGUAGE_KEYS, autoTranslateOnFetch } from '@/lib/translation-languages';
import { workTranslateFingerprint } from '@/lib/content-fingerprint';
import {
  notifyTelegramNewWork,
  publicSiteUrlFromRequest,
} from '@/lib/telegram-contact-notify';

export type { PortfolioWork, WorkTranslations } from '@/lib/works-storage';

function normalizeFileUrl(url: string | undefined, serveViaApi: boolean): string | undefined {
  if (!url) return url;
  if (!serveViaApi) return url;
  const baseName = url.split('/').pop();
  if (!baseName) return url;
  if (url.startsWith('/uploads/') || url.startsWith('/api/uploads/')) {
    return `/api/uploads/${baseName}`;
  }
  return url;
}

function normalizeWorkFiles(work: PortfolioWork, serveViaApi: boolean): PortfolioWork {
  const normalizedMain = normalizeFileUrl(work.mainImage, serveViaApi) || work.mainImage;
  const normalizedImages = (work.images || []).map(img => normalizeFileUrl(img, serveViaApi) || img);
  const normalizedVideos = (work.videos || []).map(vid => normalizeFileUrl(vid, serveViaApi) || vid);
  return {
    ...work,
    mainImage: normalizedMain,
    images: normalizedImages,
    videos: normalizedVideos,
  };
}

function needsTranslation(work: PortfolioWork): boolean {
  const fp = workTranslateFingerprint(work);

  const translations = work.translations;
  if (!translations || Object.keys(translations).length === 0) return true;

  const missingLanguages = TRANSLATION_LANGUAGE_KEYS.filter((lang) => !translations[lang]);
  if (missingLanguages.length > 0) {
    console.log(`[needsTranslation] Work ${work.id} missing translations for: ${missingLanguages.join(', ')}`);
    return true;
  }

  const hasEmptyTranslations = TRANSLATION_LANGUAGE_KEYS.some((lang) => {
    const t = translations[lang];
    return !t?.title?.trim() || !t?.description?.trim() || !t?.category?.trim();
  });
  if (hasEmptyTranslations) {
    console.log(`[needsTranslation] Work ${work.id} has empty translations`);
    return true;
  }

  if (!work._translationSourceFingerprint) return true;

  return work._translationSourceFingerprint !== fp;
}

function readWorksData(): PortfolioWork[] {
  try {
    return readMergedWorks();
  } catch (e) {
    console.error('Ошибка чтения данных работ:', e);
    return [];
  }
}

async function writeWorksData(data: PortfolioWork[], persistOpts?: PersistWorksMergedOptions): Promise<void> {
  try {
    persistMergedWorks(data, persistOpts);
  } catch (error: any) {
    console.error('Error writing works data:', error);
    if (error.code === 'EACCES' || error.code === 'EROFS' || error.message?.includes('read-only')) {
      throw new Error(
        'Файловая система доступна только для чтения. Укажите WORKS_FILE_PATH на persistent disk (например /uploads/works-data.json или /var/data/works-data.json — путь должен совпадать с точкой монтирования диска в Render).'
      );
    }
    throw new Error(`Ошибка записи данных: ${error.message || 'Неизвестная ошибка'}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');
    const translateAll = searchParams.get('translateAll') === 'true';
    const serveViaApi = uploadServedViaApi();

    let works = readWorksData();
    works = works.map(w => ({ ...w, videos: [] }));
    let normalized = false;
    works = works.map(work => {
      const normalizedWork = normalizeWorkFiles(work, serveViaApi);
      if (
        normalizedWork.mainImage !== work.mainImage ||
        normalizedWork.images !== work.images ||
        normalizedWork.videos !== work.videos
      ) {
        normalized = true;
      }
      return normalizedWork;
    });

    let translationsAdded = false;
    const worksNeedingTranslation = autoTranslateOnFetch() ? works.filter((w) => needsTranslation(w)) : [];

    /** Публичный GET не должен ждать перевод — иначе главная зависает на спиннере (таймаут /api/works). */
    const runLazyTranslations = async (): Promise<boolean> => {
      let added = false;
      for (let i = 0; i < worksNeedingTranslation.length; i++) {
        const work = worksNeedingTranslation[i];
        const index = works.findIndex(w => w.id === work.id);
        if (index === -1) continue;
        try {
          console.log(
            `[Works API] 🔄 Translating work ${i + 1}/${worksNeedingTranslation.length}: "${work.title.substring(0, 30)}..."`
          );
          const translations = await translateWork({
            title: work.title,
            description: work.description || '',
            category: work.category,
            city: work.city,
          });
          works[index] = {
            ...work,
            translations,
            _translationSourceFingerprint: workTranslateFingerprint(work),
          };
          added = true;
          console.log(
            `[Works API] ✅ Translation completed for work ${work.id}. Languages:`,
            Object.keys(translations || {}).length
          );
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`[Works API] ❌ Error translating work ${work.id}:`, msg);
        }
      }
      if (added) {
        console.log(`[Works API] 💾 Saving ${works.length} works with new translations...`);
        await writeWorksData(works);
        console.log(`[Works API] ✅ Works saved successfully with translations`);
      }
      return added;
    };

    if (worksNeedingTranslation.length > 0) {
      console.log(
        `[Works API] Translating ${worksNeedingTranslation.length}/${works.length} work(s) missing or incomplete translations`
      );
      if (translateAll) {
        translationsAdded = await runLazyTranslations();
      } else {
        void runLazyTranslations().catch((e) => console.error('[Works API] Background translation failed:', e));
      }
    }

    if (translateAll) {
      let updated = false;
      for (let i = 0; i < works.length; i++) {
        const work = works[i];
        if (needsTranslation(work)) {
          try {
            const translations = await translateWork({
              title: work.title,
              description: work.description || '',
              category: work.category,
              city: work.city
            });
            works[i] = {
              ...work,
              translations,
              _translationSourceFingerprint: workTranslateFingerprint(work),
            };
            updated = true;
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.error(`Error translating work ${work.id}:`, error);
          }
        }
      }
      if (updated) {
        translationsAdded = true;
      }
    }

    if (projectId) {
      works = works.filter(work => work.projectId === projectId);
    }

    if (category) {
      works = works.filter(work => work.category === category);
    }

    if (translationsAdded) {
      console.log(`[Works API] 💾 Saving ${works.length} works with new translations`);
      await writeWorksData(works);
      console.log(`[Works API] ✅ Works saved successfully`);
    }

    const res = NextResponse.json(works);
    /* Публичный сайт: браузер/CDN может переиспользовать ответ; админка запрашивает с cache: 'no-store'. */
    res.headers.set(
      'Cache-Control',
      'public, max-age=15, s-maxage=60, stale-while-revalidate=300'
    );
    return res;
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
    const serveViaApi = uploadServedViaApi();
    work.videos = [];

    console.log('POST /api/works - получена работа:', {
      title: work.title,
      mainImage: work.mainImage,
      images: work.images?.length || 0,
      videos: work.videos?.length || 0,
      category: work.category
    });

    if (!work.title || !work.mainImage || !work.category) {
      return NextResponse.json(
        { error: 'Необходимы: title, mainImage, category' },
        { status: 400 }
      );
    }

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
    }

    const works = readWorksData();

    const normalized = normalizeWorkFiles(work, serveViaApi);
    const newWork: PortfolioWork = {
      ...normalized,
      id: work.id || Date.now().toString(),
      projectId: work.projectId || `project-${Date.now()}`,
      workDate: work.workDate || new Date().toISOString().split('T')[0],
      translations: translations || work.translations,
      images: work.images || [],
      videos: [],
      _translationSourceFingerprint: workTranslateFingerprint({
        title: normalized.title,
        description: normalized.description || '',
        category: normalized.category,
        city: normalized.city,
      }),
    };

    console.log('Сохранение работы:', {
      id: newWork.id,
      title: newWork.title,
      images: newWork.images?.length || 0,
      videos: newWork.videos?.length || 0
    });

    works.push(newWork);
    await writeWorksData(works);

    console.log('Работа успешно сохранена. Всего работ:', works.length);

    const siteUrl = publicSiteUrlFromRequest(request);
    notifyTelegramNewWork(
      {
        id: newWork.id,
        title: newWork.title,
        description: newWork.description,
        category: newWork.category,
        city: newWork.city,
        projectId: newWork.projectId,
        workDate: newWork.workDate,
        photos: [newWork.mainImage, ...(newWork.images || [])].filter(Boolean),
      },
      { siteUrl }
    ).catch((err) => console.error('Telegram sending failed:', err));

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
    const serveViaApi = uploadServedViaApi();
    work.videos = [];

    if (!id && !work.id) {
      return NextResponse.json(
        { error: 'Необходим id работы' },
        { status: 400 }
      );
    }

    const workId = id || work.id;
    const works = readWorksData();
    const index = works.findIndex(w => w.id === workId);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      );
    }

    const existingWork = works[index];
    const needsRetranslation = 
      work.title !== existingWork.title ||
      work.description !== existingWork.description ||
      work.category !== existingWork.category ||
      work.city !== existingWork.city;

    let translations = existingWork.translations;
    
    if (needsRetranslation && (work.title || work.description || work.category || work.city)) {
      try {
        translations = await translateWork({
          title: work.title || existingWork.title,
          description: work.description || existingWork.description || '',
          category: work.category || existingWork.category,
          city: work.city || existingWork.city
        });
        console.log('Translations updated automatically for work:', workId);
      } catch (translationError) {
        console.error('Translation error:', translationError);
        translations = existingWork.translations;
      }
    }

    const merged: PortfolioWork = {
      ...existingWork,
      ...normalizeWorkFiles(work, serveViaApi),
      id: workId,
      translations: translations || existingWork.translations,
      videos: [],
    };
    merged._translationSourceFingerprint = workTranslateFingerprint({
      title: merged.title,
      description: merged.description || '',
      category: merged.category,
      city: merged.city,
    });
    works[index] = merged;
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

    const works = readWorksData();
    const filteredWorks = works.filter(work => work.id !== id);
    await writeWorksData(filteredWorks, { deletedSeedId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении' },
      { status: 500 }
    );
  }
}



