import { NextRequest, NextResponse } from 'next/server';
import { translatePricingData } from '@/lib/translate';
import {
  pricingRuntimeFile,
  pricingSeedFile,
  readJsonWithSeed,
  writeJsonFile,
} from '@/lib/data-file-paths';

interface PricingDataTranslations {
  packages: Array<{
    name: string;
    description: string;
    price: string;
    features: string[];
  }>;
  services: Array<{
    service: string;
    priceRange: string;
    description: string;
    includes: string[];
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
  translations?: Record<string, PricingDataTranslations>;
}

const emptyPricing = (): PricingData => ({ packages: [], services: [] });

function readPricingData(): PricingData {
  return readJsonWithSeed<PricingData>(pricingRuntimeFile(), pricingSeedFile(), emptyPricing());
}

function writePricingData(data: PricingData) {
  writeJsonFile(pricingRuntimeFile(), data);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'NL';
    
    const data = readPricingData();
    
    if (lang === 'RU' || lang === 'EN') {
      return NextResponse.json(data);
    }
    
    const translation = data.translations?.[lang];
    if (translation) {
      return NextResponse.json({
        ...data,
        packages: data.packages.map((pkg, idx) => ({
          ...pkg,
          name: translation.packages[idx]?.name || pkg.name,
          description: translation.packages[idx]?.description || pkg.description,
          features: translation.packages[idx]?.features || pkg.features
        })),
        services: data.services.map((service, idx) => ({
          ...service,
          service: translation.services[idx]?.service || service.service,
          description: translation.services[idx]?.description || service.description,
          includes: translation.services[idx]?.includes || service.includes
        }))
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при чтении данных' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data: PricingData = await request.json();
    
    if (!data.translations) {
      try {
        const translations = await translatePricingData({
          packages: data.packages.map(pkg => ({
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            features: pkg.features
          })),
          services: data.services.map(service => ({
            service: service.service,
            priceRange: service.priceRange,
            description: service.description,
            includes: service.includes
          }))
        });
        data.translations = translations;
      } catch (translationError) {
        console.error('Translation error:', translationError);
      }
    }
    
    writePricingData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при сохранении' },
      { status: 500 }
    );
  }
}

