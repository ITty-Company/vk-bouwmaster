import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { translateFAQCategory } from '@/lib/translate';

const FAQ_FILE = join(process.cwd(), 'src/lib/faq-data.json');

interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
}

interface FAQQuestionTranslations {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  questions: FAQQuestion[];
  translations?: Record<string, {
    title: string;
    questions: FAQQuestionTranslations[];
  }>;
}

function readFAQData(): FAQCategory[] {
  try {
    const data = readFileSync(FAQ_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeFAQData(data: FAQCategory[]) {
  writeFileSync(FAQ_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'NL';
    
    const data = readFAQData();
    
    // Если запрашивается русский язык, возвращаем оригинальные данные
    if (lang === 'RU') {
      return NextResponse.json(data);
    }
    
    // Для всех остальных языков (включая NL по умолчанию) возвращаем переводы
      const translated = data.map(category => {
        const translation = category.translations?.[lang];
        if (translation) {
          return {
            ...category,
            title: translation.title,
            questions: category.questions.map((q, idx) => ({
              ...q,
              question: translation.questions[idx]?.question || q.question,
              answer: translation.questions[idx]?.answer || q.answer
            }))
          };
        }
        return category;
      });
      return NextResponse.json(translated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при чтении данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const item: FAQCategory = await request.json();

    if (!item.title) {
      return NextResponse.json(
        { error: 'Необходим title' },
        { status: 400 }
      );
    }

    // Автоматически переводим на все языки
    let translations: Record<string, {
      title: string;
      questions: Array<{ question: string; answer: string }>;
    }> | undefined;
    
    try {
      translations = await translateFAQCategory({
        title: item.title,
        questions: item.questions.map(q => ({
          question: q.question,
          answer: q.answer
        }))
      });
    } catch (translationError) {
      console.error('Translation error:', translationError);
      // Продолжаем без переводов, если произошла ошибка
    }

    const data = readFAQData();
    const newItem: FAQCategory = {
      ...item,
      id: item.id || Date.now().toString(),
      translations: translations || item.translations
    };

    data.push(newItem);
    writeFAQData(data);

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
    const item: FAQCategory = await request.json();

    if (!item.id) {
      return NextResponse.json(
        { error: 'Необходим id' },
        { status: 400 }
      );
    }

    const data = readFAQData();
    const index = data.findIndex(p => p.id === item.id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, изменились ли title, questions (для перевода)
    const oldItem = data[index];
    const titleChanged = oldItem.title !== item.title;
    const questionsChanged = JSON.stringify(oldItem.questions.map(q => ({ q: q.question, a: q.answer }))) !== 
                             JSON.stringify(item.questions.map(q => ({ q: q.question, a: q.answer })));

    // Если изменились данные, переводим заново
    if (titleChanged || questionsChanged) {
      try {
        const translations = await translateFAQCategory({
          title: item.title,
          questions: item.questions.map(q => ({
            question: q.question,
            answer: q.answer
          }))
        });
        item.translations = translations;
      } catch (translationError) {
        console.error('Translation error:', translationError);
        // Продолжаем без переводов, если произошла ошибка
      }
    } else {
      // Сохраняем существующие переводы
      item.translations = oldItem.translations || item.translations;
    }

    data[index] = { ...data[index], ...item };
    writeFAQData(data);

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

    const data = readFAQData();
    const filtered = data.filter(item => item.id !== id);
    writeFAQData(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении' },
      { status: 500 }
    );
  }
}
