import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { translateText, detectSourceLanguage } from '@/lib/translate';
import { Language } from '@/lib/translations';
import {
  commentsRuntimeFile,
  commentsSeedFile,
  ensureCommentsFileWithSeed,
  ensureDirForFile,
} from '@/lib/data-file-paths';

type Comment = {
  id: string;
  projectId: string;
  name: string;
  surname?: string;
  message: string;
  createdAt: string;
  approved: boolean;
  photos?: string[];
  videos?: string[];
  rating?: number;
  city?: string;
  profileImage?: string;
  translations?: Record<string, string>;
}

function readComments(): Comment[] {
  try {
    ensureCommentsFileWithSeed();
    const runtime = commentsRuntimeFile();
    const seed = commentsSeedFile();
    const path = existsSync(runtime) ? runtime : seed;
    if (!existsSync(path)) return [];
    const data = readFileSync(path, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeComments(list: Comment[]) {
  const target = commentsRuntimeFile();
  ensureDirForFile(target);
  writeFileSync(target, JSON.stringify(list, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const force = searchParams.get('force') === 'true';
    
    const comments = readComments();
    
    if (commentId) {
      const index = comments.findIndex(c => c.id === commentId);
      if (index === -1) {
        return NextResponse.json(
          { error: 'Комментарий не найден' },
          { status: 404 }
        );
      }
      
      const comment = comments[index];
      console.log(`[Translate Comments API] 🔄 Translating comment ${commentId}: "${comment.message.substring(0, 30)}..."`);
      
      try {
        const sourceLang = detectSourceLanguage(comment.message);
        const sourceLangCode = sourceLang === 'ru' ? 'RU' : sourceLang === 'nl' ? 'NL' : sourceLang === 'en' ? 'EN' : 'RU';
        const languages: Language[] = ['RU', 'EN', 'NL', 'DE', 'FR', 'ES', 'IT', 'PT', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SL', 'ET', 'LV', 'LT', 'FI', 'SV', 'DA', 'NO', 'GR', 'UA'];
        
        const translations: Record<string, string> = { [sourceLangCode]: comment.message };
        
        for (const lang of languages) {
          if (lang === sourceLangCode) continue;
          
          try {
            const translated = await translateText(comment.message, lang, sourceLang);
            translations[lang] = translated;
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.error(`Error translating comment to ${lang}:`, error);
            translations[lang] = comment.message;
          }
        }
        
        comments[index] = { ...comment, translations };
        writeComments(comments);
        
        console.log(`[Translate Comments API] ✅ Successfully translated comment ${commentId}`);
        return NextResponse.json({ 
          success: true, 
          message: `Переводы для комментария ${commentId} обновлены`,
          comment: comments[index]
        });
      } catch (error: any) {
        console.error(`[Translate Comments API] ❌ Error translating comment ${commentId}:`, error);
        return NextResponse.json(
          { error: `Ошибка перевода: ${error.message || 'Неизвестная ошибка'}` },
          { status: 500 }
        );
      }
    } else {
      let translatedCount = 0;
      let errorCount = 0;
      
      console.log(`[Translate Comments API] 🔄 Starting translation of ${comments.length} comments (force=${force})...`);
      
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        
        if (!force && comment.translations && Object.keys(comment.translations).length >= 5) {
          console.log(`[Translate Comments API] ⏭️ Skipping comment ${comment.id} (already translated)`);
          continue;
        }
        
        try {
          console.log(`[Translate Comments API] 🔄 Translating comment ${i + 1}/${comments.length}: "${comment.message.substring(0, 30)}..."`);
          
          const sourceLang = detectSourceLanguage(comment.message);
          const sourceLangCode = sourceLang === 'ru' ? 'RU' : sourceLang === 'nl' ? 'NL' : sourceLang === 'en' ? 'EN' : 'RU';
          const languages: Language[] = ['RU', 'EN', 'NL', 'DE', 'FR', 'ES', 'IT', 'PT', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SL', 'ET', 'LV', 'LT', 'FI', 'SV', 'DA', 'NO', 'GR', 'UA'];
          
          const translations: Record<string, string> = { [sourceLangCode]: comment.message };
          
          for (const lang of languages) {
            if (lang === sourceLangCode) continue;
            
            try {
              const translated = await translateText(comment.message, lang, sourceLang);
              translations[lang] = translated;
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
              console.error(`Error translating comment to ${lang}:`, error);
              translations[lang] = comment.message;
            }
          }
          
          comments[i] = { ...comment, translations };
          translatedCount++;
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(`[Translate Comments API] ❌ Error translating comment ${comment.id}:`, error.message || error);
          errorCount++;
        }
      }
      
      if (translatedCount > 0) {
        writeComments(comments);
        console.log(`[Translate Comments API] ✅ Saved ${translatedCount} translated comments`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Переведено комментариев: ${translatedCount}, ошибок: ${errorCount}`,
        translated: translatedCount,
        errors: errorCount,
        total: comments.length
      });
    }
  } catch (error: any) {
    console.error('[Translate Comments API] ❌ Fatal error:', error);
    return NextResponse.json(
      { error: `Критическая ошибка: ${error.message || 'Неизвестная ошибка'}` },
      { status: 500 }
    );
  }
}

