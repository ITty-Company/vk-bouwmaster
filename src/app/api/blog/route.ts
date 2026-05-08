import { NextRequest, NextResponse } from 'next/server';
import { translateBlogPost } from '@/lib/translate';
import { blogRuntimeFile, blogSeedFile, readJsonWithSeed, writeJsonFile } from '@/lib/data-file-paths';

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
  translations?: Record<string, BlogPostTranslations>; // Язык -> перевод
}

function readBlogData(): BlogPost[] {
  return readJsonWithSeed<BlogPost[]>(blogRuntimeFile(), blogSeedFile(), []);
}

function writeBlogData(data: BlogPost[]) {
  writeJsonFile(blogRuntimeFile(), data);
}

export async function GET() {
  try {
    const data = readBlogData();
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
    const item: BlogPost = await request.json();

    if (!item.title || !item.excerpt || !item.image) {
      return NextResponse.json(
        { error: 'Необходимы: title, excerpt, image' },
        { status: 400 }
      );
    }

    let translations: Record<string, BlogPostTranslations> | undefined;
    try {
      translations = await translateBlogPost({
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        category: item.category || ''
      });
    } catch (translationError) {
      console.error('Translation error:', translationError);
    }

    const data = readBlogData();
    const newItem: BlogPost = {
      ...item,
      id: item.id || Date.now().toString(),
      date: item.date || new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }),
      slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      translations: translations || item.translations
    };

    data.push(newItem);
    writeBlogData(data);

    return NextResponse.json({ success: true, item: newItem });
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
    const item: BlogPost = await request.json();

    if (!item.id) {
      return NextResponse.json(
        { error: 'Необходим id' },
        { status: 400 }
      );
    }

    const data = readBlogData();
    const index = data.findIndex(p => p.id === item.id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    const existingItem = data[index];
    const needsRetranslation = 
      existingItem.title !== item.title ||
      existingItem.excerpt !== item.excerpt ||
      existingItem.content !== item.content ||
      existingItem.category !== item.category;

    let translations = item.translations || existingItem.translations;
    
    if (needsRetranslation) {
      try {
        translations = await translateBlogPost({
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          category: item.category || ''
        });
      } catch (translationError) {
        console.error('Translation error:', translationError);
        translations = translations || existingItem.translations;
      }
    }

    data[index] = { 
      ...data[index], 
      ...item,
      translations: translations || data[index].translations
    };
    writeBlogData(data);

    return NextResponse.json({ success: true, item: data[index] });
  } catch (error) {
    console.error('Error in PUT:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении' },
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
        { error: 'Необходим id' },
        { status: 400 }
      );
    }

    const data = readBlogData();
    const filtered = data.filter(item => item.id !== id);
    writeBlogData(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении' },
      { status: 500 }
    );
  }
}

