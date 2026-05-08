import { NextRequest, NextResponse } from 'next/server';
import {
  portfolioRuntimeFile,
  portfolioSeedFile,
  readJsonWithSeed,
  writeJsonFile,
} from '@/lib/data-file-paths';

interface PortfolioItem {
  id: string;
  service: string;
  title: string;
  description?: string;
  image: string;
  date?: string;
}

type PortfolioData = Record<string, PortfolioItem[]>;

function readPortfolioData(): PortfolioData {
  return readJsonWithSeed<PortfolioData>(portfolioRuntimeFile(), portfolioSeedFile(), {});
}

function writePortfolioData(data: PortfolioData) {
  writeJsonFile(portfolioRuntimeFile(), data);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    const data = readPortfolioData();

    if (service) {
      return NextResponse.json({ items: data[service] || [] });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при чтении данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const item: PortfolioItem = await request.json();

    if (!item.service || !item.title || !item.image) {
      return NextResponse.json(
        { error: 'Необходимы: service, title, image' },
        { status: 400 }
      );
    }

    const data = readPortfolioData();
    
    if (!data[item.service]) {
      data[item.service] = [];
    }

    const newItem: PortfolioItem = {
      ...item,
      id: item.id || Date.now().toString(),
      date: item.date || new Date().toISOString(),
    };

    data[item.service].push(newItem);
    writePortfolioData(data);

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при сохранении' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const id = searchParams.get('id');

    if (!service || !id) {
      return NextResponse.json(
        { error: 'Необходимы: service и id' },
        { status: 400 }
      );
    }

    const data = readPortfolioData();
    
    if (data[service]) {
      data[service] = data[service].filter((item: PortfolioItem) => item.id !== id);
      writePortfolioData(data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении' },
      { status: 500 }
    );
  }
}

