import { NextRequest, NextResponse } from 'next/server';
import { translateFAQCategory } from '@/lib/translate';
import { faqRuntimeFile, faqSeedFile, readJsonWithSeed, writeJsonFile } from '@/lib/data-file-paths';
import { TRANSLATION_LANGUAGE_KEYS, autoTranslateOnFetch } from '@/lib/translation-languages';
import { faqCategoryFingerprint } from '@/lib/content-fingerprint';

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
  _translationSourceFingerprint?: string;
}

function faqCanonicalQuestions(cat: FAQCategory) {
  return cat.questions.map((q) => ({ question: q.question, answer: q.answer }));
}

function faqNeedsTranslation(cat: FAQCategory): boolean {
  const fp = faqCategoryFingerprint({ title: cat.title, questions: faqCanonicalQuestions(cat) });
  const tr = cat.translations;
  if (!tr) return true;

  const missing = TRANSLATION_LANGUAGE_KEYS.filter((lang) => !tr[lang]);
  if (missing.length > 0) return true;

  for (const lang of TRANSLATION_LANGUAGE_KEYS) {
    const t = tr[lang];
    if (!t?.title?.trim() || !Array.isArray(t.questions) || t.questions.length !== cat.questions.length) {
      return true;
    }
    if (t.questions.some((q) => !q.question?.trim() || !q.answer?.trim())) return true;
  }

  if (!cat._translationSourceFingerprint) return true;
  return cat._translationSourceFingerprint !== fp;
}

function readFAQData(): FAQCategory[] {
  return readJsonWithSeed<FAQCategory[]>(faqRuntimeFile(), faqSeedFile(), []);
}

function writeFAQData(data: FAQCategory[]) {
  writeJsonFile(faqRuntimeFile(), data);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'NL';

    let data = readFAQData();

    if (autoTranslateOnFetch()) {
      const toTranslate = data.filter(faqNeedsTranslation);
      if (toTranslate.length > 0) {
        console.log(`[FAQ API] Filling translations for ${toTranslate.length} categor(ies)`);
        let dirty = false;
        const next: FAQCategory[] = [];
        for (const cat of data) {
          if (!faqNeedsTranslation(cat)) {
            next.push(cat);
            continue;
          }
          try {
            const translations = await translateFAQCategory({
              title: cat.title,
              questions: faqCanonicalQuestions(cat),
            });
            next.push({
              ...cat,
              translations,
              _translationSourceFingerprint: faqCategoryFingerprint({
                title: cat.title,
                questions: faqCanonicalQuestions(cat),
              }),
            });
            dirty = true;
          } catch (e) {
            console.error(`[FAQ API] Translate failed for ${cat.id}`, e);
            next.push(cat);
          }
        }
        if (dirty) {
          writeFAQData(next);
          data = next;
        }
      }
    }

    if (lang === 'RU') {
      return NextResponse.json(data);
    }

    const translated = data.map((category) => {
      const translation = category.translations?.[lang];
      if (translation) {
        return {
          ...category,
          title: translation.title,
          questions: category.questions.map((q, idx) => ({
            ...q,
            question: translation.questions[idx]?.question || q.question,
            answer: translation.questions[idx]?.answer || q.answer,
          })),
        };
      }
      return category;
    });
    return NextResponse.json(translated);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при чтении данных' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const item: FAQCategory = await request.json();

    if (!item.title) {
      return NextResponse.json({ error: 'Необходим title' }, { status: 400 });
    }

    let translations: Record<string, { title: string; questions: Array<{ question: string; answer: string }> }> | undefined;
    try {
      translations = await translateFAQCategory({
        title: item.title,
        questions: item.questions.map((q) => ({
          question: q.question,
          answer: q.answer,
        })),
      });
    } catch (translationError) {
      console.error('Translation error:', translationError);
    }

    const data = readFAQData();
    const fp = faqCategoryFingerprint({
      title: item.title,
      questions: item.questions.map((q) => ({ question: q.question, answer: q.answer })),
    });
    const newItem: FAQCategory = {
      ...item,
      id: item.id || Date.now().toString(),
      translations: translations || item.translations,
      _translationSourceFingerprint: fp,
    };

    data.push(newItem);
    writeFAQData(data);

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ error: 'Ошибка при сохранении' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const item: FAQCategory = await request.json();

    if (!item.id) {
      return NextResponse.json({ error: 'Необходим id' }, { status: 400 });
    }

    const data = readFAQData();
    const index = data.findIndex((p) => p.id === item.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    const oldItem = data[index];
    const titleChanged = oldItem.title !== item.title;
    const questionsChanged =
      JSON.stringify(oldItem.questions.map((q) => ({ q: q.question, a: q.answer }))) !==
      JSON.stringify(item.questions.map((q) => ({ q: q.question, a: q.answer })));

    if (titleChanged || questionsChanged) {
      try {
        const translations = await translateFAQCategory({
          title: item.title,
          questions: item.questions.map((q) => ({
            question: q.question,
            answer: q.answer,
          })),
        });
        item.translations = translations;
      } catch (translationError) {
        console.error('Translation error:', translationError);
      }
    } else {
      item.translations = oldItem.translations || item.translations;
    }

    item._translationSourceFingerprint = faqCategoryFingerprint({
      title: item.title,
      questions: item.questions.map((q) => ({ question: q.question, answer: q.answer })),
    });

    data[index] = { ...data[index], ...item };
    writeFAQData(data);

    return NextResponse.json({ success: true, item: data[index] });
  } catch (error) {
    console.error('Error in PUT:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Необходим id' }, { status: 400 });
    }

    const data = readFAQData();
    const filtered = data.filter((item) => item.id !== id);
    writeFAQData(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при удалении' }, { status: 500 });
  }
}
