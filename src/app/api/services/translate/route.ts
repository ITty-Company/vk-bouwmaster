import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { translateServicePage } from '@/lib/translate';

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
  translations?: Record<string, any>;
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
        console.warn('Не удалось сохранить seed данных:', seedError);
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
  const searchParams = request.nextUrl.searchParams;
  const force = searchParams.get('force') === 'true';
  const serviceId = searchParams.get('id');

  try {
    let services = await readServicesData();
    
    if (serviceId) {
      const service = services.find(s => s.id === serviceId);
      if (!service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      services = [service];
    }

    const servicesToTranslate = force ? services : services.filter(s => !s.translations || Object.keys(s.translations).length < 25);

    if (servicesToTranslate.length === 0) {
      return NextResponse.json({ 
        message: `All services are already translated${serviceId ? ` for service ${serviceId}` : ''}`,
        count: services.length
      });
    }

    console.log(`[Services Translate API] Translating ${servicesToTranslate.length} service(s)...`);

    for (const service of servicesToTranslate) {
      try {
        console.log(`[Services Translate API] Translating service: ${service.id}`);
        const translations = await translateServicePage(service);
        
        const serviceIndex = services.findIndex(s => s.id === service.id);
        if (serviceIndex !== -1) {
          services[serviceIndex].translations = translations;
        }
      } catch (error: any) {
        console.error(`[Services Translate API] Error translating service ${service.id}:`, error.message || error);
      }
    }

    await writeServicesData(services);

    return NextResponse.json({ 
      success: true,
      message: `Translated ${servicesToTranslate.length} service(s)`,
      services: servicesToTranslate.map(s => ({ id: s.id, translationsCount: Object.keys(s.translations || {}).length }))
    });
  } catch (error: any) {
    console.error('[Services Translate API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

