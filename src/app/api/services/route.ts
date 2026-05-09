import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { translateServicePage } from '@/lib/translate';
import { ensureDirForFile, servicesRuntimeFile, servicesSeedFile } from '@/lib/data-file-paths';
import { TRANSLATION_LANGUAGE_KEYS, autoTranslateOnFetch } from '@/lib/translation-languages';
import { serviceTranslateFingerprint } from '@/lib/content-fingerprint';

function getServicesFilePath() {
  return servicesRuntimeFile();
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
  /** Hash of canonical Russian fields — when text changes, all languages are refreshed */
  _translationSourceFingerprint?: string;
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

function translationsComplete(service: ServicePage): boolean {
  const tr = service.translations;
  if (!tr) return false;
  return TRANSLATION_LANGUAGE_KEYS.every((lang) => {
    const t = tr[lang];
    return !!(
      t?.hero?.title?.trim() &&
      t?.hero?.subtitle?.trim() &&
      t?.solutions?.description1?.trim() &&
      t?.solutions?.description2?.trim() &&
      t?.services?.items?.length
    );
  });
}

function needsTranslation(service: ServicePage): boolean {
  const fp = serviceTranslateFingerprint(service);

  if (!service.translations || Object.keys(service.translations).length === 0) return true;

  const missingLanguages = TRANSLATION_LANGUAGE_KEYS.filter((lang) => !service.translations![lang]);
  if (missingLanguages.length > 0) {
    console.log(`[needsTranslation] Service ${service.id} missing translations for: ${missingLanguages.join(', ')}`);
    return true;
  }

  const hasEmptyTranslations = TRANSLATION_LANGUAGE_KEYS.some((lang) => {
    const t = service.translations![lang];
    return !t?.hero?.title?.trim() || !t?.hero?.subtitle?.trim() || !t?.solutions || !t?.services?.items?.length;
  });
  if (hasEmptyTranslations) {
    console.log(`[needsTranslation] Service ${service.id} has empty translations`);
    return true;
  }

  if (!service._translationSourceFingerprint) return true;

  return service._translationSourceFingerprint !== fp;
}

async function readServicesData(): Promise<ServicePage[]> {
  try {
    const raw = readFileSync(getServicesFilePath(), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.services || [];
  } catch (primaryError) {
    try {
      const data = readFileSync(servicesSeedFile(), 'utf-8');
      const parsed = JSON.parse(data);
      const services = parsed.services || [];
      try {
        const target = getServicesFilePath();
        ensureDirForFile(target);
        writeFileSync(target, JSON.stringify(services, null, 2), 'utf-8');
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
    const target = getServicesFilePath();
    ensureDirForFile(target);
    writeFileSync(target, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Ошибка записи данных услуг:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    let services = await readServicesData();

    if (autoTranslateOnFetch()) {
      const servicesNeedingTranslation = services.filter(needsTranslation);

      if (servicesNeedingTranslation.length > 0) {
        console.log(
          `[Services API] Translating ${servicesNeedingTranslation.length}/${services.length} service(s): ${servicesNeedingTranslation.map((s) => s.id).join(', ')}`
        );

        for (const service of servicesNeedingTranslation) {
          try {
            console.log(`[Services API] Translating service: ${service.id}...`);
            const translations = await translateServicePage(service);

            const serviceIndex = services.findIndex((s) => s.id === service.id);
            if (serviceIndex !== -1) {
              const base = services[serviceIndex];
              services[serviceIndex] = {
                ...base,
                translations,
                _translationSourceFingerprint: serviceTranslateFingerprint(base),
              };
              console.log(`[Services API] ✅ Service ${service.id} translated to ${Object.keys(translations).length} languages`);
            }
          } catch (error: any) {
            console.error(`[Services API] ❌ Error translating service ${service.id}:`, error.message || error);
          }
        }

        await writeServicesData(services);
        console.log(`[Services API] ✅ All translations saved`);
      }
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
    const existingIndex = services.findIndex((s) => s.id === service.id);

    if (existingIndex !== -1) {
      const oldService = services[existingIndex];

      const contentChanged =
        oldService.hero.title !== service.hero.title ||
        oldService.hero.subtitle !== service.hero.subtitle ||
        oldService.solutions.title !== service.solutions.title ||
        oldService.solutions.description1 !== service.solutions.description1 ||
        oldService.solutions.description2 !== service.solutions.description2 ||
        JSON.stringify(oldService.services.items) !== JSON.stringify(service.services.items);

      services[existingIndex] = service;

      if (contentChanged || needsTranslation(service)) {
        console.log(`[Services API] Content changed for service ${service.id}, generating new translations`);
        const translations = await translateServicePage(service);
        services[existingIndex].translations = translations;
        services[existingIndex]._translationSourceFingerprint = serviceTranslateFingerprint(service);
      }
    } else {
      services.push(service);

      if (needsTranslation(service)) {
        console.log(`[Services API] Generating translations for new service ${service.id}`);
        const translations = await translateServicePage(service);
        services[services.length - 1].translations = translations;
        services[services.length - 1]._translationSourceFingerprint = serviceTranslateFingerprint(service);
      }
    }

    await writeServicesData(services);
    return NextResponse.json({ success: true, service: services.find((s) => s.id === service.id) });
  } catch (error: any) {
    console.error('[Services API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
