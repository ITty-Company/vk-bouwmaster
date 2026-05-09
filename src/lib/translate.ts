import OpenAI from 'openai';
import { TRANSLATION_LANGUAGE_KEYS } from '@/lib/translation-languages';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

export async function translateText(text: string, targetLang: string, sourceLang?: string): Promise<string> {
  if (!text || text.trim() === '') return text;
  
  const langMap: Record<string, string> = {
    'RU': 'ru',
    'EN': 'en',
    'NL': 'nl',
    'DE': 'de',
    'FR': 'fr',
    'ES': 'es',
    'IT': 'it',
    'PT': 'pt',
    'PL': 'pl',
    'CZ': 'cs',
    'HU': 'hu',
    'RO': 'ro',
    'BG': 'bg',
    'HR': 'hr',
    'SK': 'sk',
    'SL': 'sl',
    'ET': 'et',
    'LV': 'lv',
    'LT': 'lt',
    'FI': 'fi',
    'SV': 'sv',
    'DA': 'da',
    'NO': 'no',
    'GR': 'el',
    'UA': 'uk'
  };

  const targetCode = langMap[targetLang] || 'en';
  const sourceCode = sourceLang || detectSourceLanguage(text);
  
  if (sourceCode === targetCode) {
    return text;
  }

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const maxLength = hasOpenAI ? 4000 : 500; // OpenAI может обрабатывать до 128k токенов, но для безопасности используем 4000 символов
  
  if (text.length <= maxLength) {
    return await translateChunk(text, targetCode, sourceCode);
  }

  const chunks: string[] = [];
  let currentChunk = '';
  
  const sentences = text.split(/(?<=[.!?]\s)/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      if (sentence.length <= maxLength) {
        currentChunk = sentence;
      } else {
        const words = sentence.split(' ');
        for (const word of words) {
          if ((currentChunk + word + ' ').length <= maxLength) {
            currentChunk += word + ' ';
          } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = word + ' ';
          }
        }
      }
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());

  const translatedChunks: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const translated = await translateChunk(chunks[i], targetCode, sourceCode);
    translatedChunks.push(translated);
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return translatedChunks.join(' ');
}

export function detectSourceLanguage(text: string): string {
  if (!text || text.trim() === '') return 'nl';
  
  const lowerText = text.toLowerCase();
  
  const nlWords = /\b(van|de|het|een|is|op|voor|met|aan|in|dat|die|wat|zijn|worden|hebben|kunnen|moeten|willen|doen|gaan|komen|zien|weten|denken|zeggen|geven|nemen|maken|vinden|krijgen|staan|liggen|zitten|blijven|beginnen|eindigen|proberen|helpen|werken|leven|groot|klein|goed|slecht|nieuw|oud|jong|lang|kort|hoog|laag|warm|koud|mooi|lelijk|rijk|arm|sterk|zwak|snel|langzaam|makkelijk|moeilijk|belangrijk|nodig|mogelijk|onmogelijk|waarschijnlijk|zeker|onzeker|open|dicht|vol|leeg|schoon|vuil|licht|donker|zacht|hard|zoet|zuur|bitter|zout|heet|nat|droog|recht|krom|rond|vierkant|driehoekig|breed|smal|dik|dun|zwaar|professioneel|leg|tegels|klinker|onder|grond|afwatering|verwijder|bereid|zorgvuldig|oppervlak|vlak|stevig|duurzaam|geschikt|tuin|paden|terrassen|opritten|bestrate)\b/i;
  const nlPatterns = /(ij|oe|eu|aa|ee|uu|sch|cht)/i; // Характерные нидерландские буквосочетания
  
  const ruIndicators = /[а-яё]/i;
  
  const enIndicators = /\b(the|and|is|are|was|were|been|have|has|had|do|does|did|will|would|should|could|can|may|might|must|shall|this|that|these|those|what|which|who|whom|whose|where|when|why|how|all|each|every|some|any|no|not|only|just|also|too|very|much|many|more|most|less|least|few|little|enough|so|such|as|like|than|from|to|in|on|at|by|for|with|about|into|onto|upon|over|under|above|below|between|among|through|during|before|after|while|since|until|till|because|although|though|however|therefore|thus|hence|moreover|furthermore|besides|instead|otherwise|nevertheless|nonetheless|meanwhile|finally|first|second|third|last|next|then|now|here|there)\b/i;
  
  const nlScore = (nlWords.test(text) ? 2 : 0) + (nlPatterns.test(text) ? 1 : 0);
  const ruScore = ruIndicators.test(text) ? 3 : 0;
  const enScore = enIndicators.test(text) ? 2 : 0;
  
  if (ruScore > 0) return 'ru';
  if (nlScore > enScore) return 'nl';
  if (enScore > 0) return 'en';
  
  return 'nl';
}

async function translateChunk(text: string, targetCode: string, sourceLang?: string): Promise<string> {
  const sourceCode = sourceLang || detectSourceLanguage(text);
  
  if (sourceCode === targetCode) {
    console.log(`[Translate] Skipping translation: source (${sourceCode}) = target (${targetCode})`);
    return text;
  }
  
  console.log(`[Translate] Translating from ${sourceCode} to ${targetCode}: "${text.substring(0, 50)}..."`);
  
  const apis = [
    async () => {
      const client = getOpenAIClient();
      if (!client) {
        console.log(`[Translate] OpenAI API key not configured, skipping AI translation`);
        return null;
      }
      
      try {
        const languageNames: Record<string, string> = {
          'ru': 'Russian',
          'en': 'English',
          'nl': 'Dutch',
          'de': 'German',
          'fr': 'French',
          'es': 'Spanish',
          'it': 'Italian',
          'pt': 'Portuguese',
          'pl': 'Polish',
          'cs': 'Czech',
          'hu': 'Hungarian',
          'ro': 'Romanian',
          'bg': 'Bulgarian',
          'hr': 'Croatian',
          'sk': 'Slovak',
          'sl': 'Slovenian',
          'et': 'Estonian',
          'lv': 'Latvian',
          'lt': 'Lithuanian',
          'fi': 'Finnish',
          'sv': 'Swedish',
          'da': 'Danish',
          'no': 'Norwegian',
          'el': 'Greek',
          'uk': 'Ukrainian'
        };
        
        const sourceLangName = languageNames[sourceCode] || sourceCode;
        const targetLangName = languageNames[targetCode] || targetCode;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini', // Используем более дешевую модель для переводов
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the text from ${sourceLangName} to ${targetLangName}. Preserve the original meaning, tone, and style. Return only the translated text without any explanations or additional text.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3, // Низкая температура для более точных переводов
          max_tokens: Math.ceil(text.length * 2) // Резервируем достаточно токенов
        }, {
          signal: controller.signal as any
        });
        
        clearTimeout(timeoutId);
        
        const translated = response.choices[0]?.message?.content?.trim();
        
        if (translated && translated !== text) {
          console.log(`[Translate] ✅ OpenAI AI translation success ${sourceCode}->${targetCode}`);
          return translated;
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn(`[Translate] OpenAI translation failed:`, e.message);
        }
      }
      return null;
    },
    
    async () => {
      const endpoints = [
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`,
        `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceCode}&tl=${targetCode}&q=${encodeURIComponent(text)}`
      ];
      
      for (const url of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const response = await fetch(url, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            let translated = '';
            
            if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
              translated = data[0].map((item: any[]) => item?.[0] || '').filter(Boolean).join('');
            } else if (typeof data === 'string') {
              translated = data;
            } else if (data.sentences && Array.isArray(data.sentences)) {
              translated = data.sentences.map((s: any) => s.trans || '').join('');
            }
            
            if (translated && translated.trim() && translated !== text) {
              console.log(`[Translate] ✅ Google Translate success ${sourceCode}->${targetCode}`);
              return translated;
            }
          }
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.warn(`[Translate] Google Translate endpoint failed:`, e.message);
          }
        }
      }
      return null;
    },
    
    async () => {
      try {
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.responseStatus === 200 && data.responseData?.translatedText) {
            const translated = data.responseData.translatedText;
            if (translated && translated.trim() && translated !== text) {
              console.log(`[Translate] ✅ MyMemory success ${sourceCode}->${targetCode}`);
              return translated;
            }
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn(`[Translate] MyMemory failed:`, e.message);
        }
      }
      return null;
    },
    
    async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`https://api-free.deepl.com/v2/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0'
          },
          body: new URLSearchParams({
            auth_key: '', // Публичный API не требует ключа для некоторых языков
            text: text,
            source_lang: sourceCode.toUpperCase(),
            target_lang: targetCode.toUpperCase()
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.translations && data.translations[0]?.text) {
            const translated = data.translations[0].text;
            if (translated && translated.trim() && translated !== text) {
              console.log(`[Translate] ✅ DeepL success ${sourceCode}->${targetCode}`);
              return translated;
            }
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
        }
      }
      return null;
    },
    
    async () => {
      console.warn(`[Translate] ⚠️ All APIs failed, using original text for ${sourceCode}->${targetCode}`);
      return null; // Вернём null, чтобы попробовать другие варианты
    }
  ];
  
  for (const api of apis) {
    try {
      const result = await api();
      if (result) {
        return result;
      }
    } catch (error: any) {
      console.warn(`[Translate] API attempt failed:`, error.message);
      continue;
    }
  }
  
  console.error(`[Translate] ❌ All translation APIs failed for ${sourceCode}->${targetCode}`);
  return text;
}

export async function translateBlogPost(post: {
  title: string;
  excerpt: string;
  content?: string;
  category: string;
}): Promise<Record<string, {
  title: string;
  excerpt: string;
  content?: string;
  category: string;
}>> {
  const languages = TRANSLATION_LANGUAGE_KEYS.filter((k) => k !== 'RU');

  const translations: Record<string, {
    title: string;
    excerpt: string;
    content?: string;
    category: string;
  }> = {
    RU: {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category
    }
  };

  for (const lang of languages) {
    try {
      const [title, excerpt, content, category] = await Promise.all([
        translateText(post.title, lang),
        translateText(post.excerpt, lang),
        post.content ? translateText(post.content, lang) : Promise.resolve(undefined),
        post.category ? translateText(post.category, lang) : Promise.resolve(post.category)
      ]);

      translations[lang] = {
        title,
        excerpt,
        content,
        category: category || post.category
      };
      
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Error translating to ${lang}:`, error);
      translations[lang] = {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category
      };
    }
  }

  return translations;
}

export async function translateFAQCategory(category: {
  title: string;
  questions: Array<{
    question: string;
    answer: string;
  }>;
}): Promise<Record<string, {
  title: string;
  questions: Array<{
    question: string;
    answer: string;
  }>;
}>> {
  const languages = TRANSLATION_LANGUAGE_KEYS.filter((k) => k !== 'RU');

  const translations: Record<string, {
    title: string;
    questions: Array<{
      question: string;
      answer: string;
    }>;
  }> = {
    RU: {
      title: category.title,
      questions: category.questions
    }
  };

  for (const lang of languages) {
    try {
      const translatedTitle = await translateText(category.title, lang);
      const translatedQuestions = await Promise.all(
        category.questions.map(async (q) => ({
          question: await translateText(q.question, lang),
          answer: await translateText(q.answer, lang)
        }))
      );

      translations[lang] = {
        title: translatedTitle,
        questions: translatedQuestions
      };
      
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Error translating FAQ category to ${lang}:`, error);
      translations[lang] = {
        title: category.title,
        questions: category.questions
      };
    }
  }

  return translations;
}

export async function translateTeamMember(member: {
  name: string;
  position: string;
  bio: string;
  specialties: string[];
  experience: string;
}): Promise<Record<string, {
  name: string;
  position: string;
  bio: string;
  specialties: string[];
  experience: string;
}>> {
  const detectedLang = detectSourceLanguage(member.position + ' ' + member.bio);
  const sourceLang = detectedLang === 'nl' && /[a-zA-Z]/.test(member.position) && !/[а-яё]/i.test(member.position) ? 'en' : detectedLang;
  console.log(`[TranslateTeamMember] Using source language: ${sourceLang} for member: "${member.name}"`);
  
  const languages = [...TRANSLATION_LANGUAGE_KEYS];

  const translations: Record<string, {
    name: string;
    position: string;
    bio: string;
    specialties: string[];
    experience: string;
  }> = {};

  console.log(`[TranslateTeamMember] Starting translation for member: "${member.name}" to ${languages.length} languages`);
  
  for (const lang of languages) {
    try {
      const langCode = lang === 'RU' ? 'ru' : lang === 'EN' ? 'en' : lang === 'NL' ? 'nl' : lang === 'DE' ? 'de' : lang === 'FR' ? 'fr' : lang === 'ES' ? 'es' : lang === 'IT' ? 'it' : lang === 'PT' ? 'pt' : lang === 'PL' ? 'pl' : lang === 'CZ' ? 'cs' : lang === 'HU' ? 'hu' : lang === 'RO' ? 'ro' : lang === 'BG' ? 'bg' : lang === 'HR' ? 'hr' : lang === 'SK' ? 'sk' : lang === 'SL' ? 'sl' : lang === 'ET' ? 'et' : lang === 'LV' ? 'lv' : lang === 'LT' ? 'lt' : lang === 'FI' ? 'fi' : lang === 'SV' ? 'sv' : lang === 'DA' ? 'da' : lang === 'NO' ? 'no' : lang === 'GR' ? 'el' : lang === 'UA' ? 'uk' : 'en';
      
      if (sourceLang === langCode) {
        translations[lang] = {
          name: member.name,
          position: member.position,
          bio: member.bio,
          specialties: member.specialties,
          experience: member.experience
        };
        console.log(`[TranslateTeamMember] ⏭️ Skipped translation to ${lang} (same as source)`);
        continue;
      }
      
      console.log(`[TranslateTeamMember] Translating to ${lang} (${sourceLang}->${langCode})...`);
      
      const [position, bio] = await Promise.all([
        translateText(member.position, lang, sourceLang),
        translateText(member.bio, lang, sourceLang)
      ]);
      
      const specialties = await Promise.all(
        member.specialties.map(specialty => translateText(specialty, lang, sourceLang))
      );
      
      translations[lang] = {
        name: member.name, // Имя обычно не переводится
        position: (position && position !== member.position) ? position : member.position,
        bio: (bio && bio !== member.bio) ? bio : member.bio,
        specialties: specialties,
        experience: member.experience
      };
      
      console.log(`[TranslateTeamMember] ✅ Completed translation to ${lang}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error: any) {
      console.error(`[TranslateTeamMember] ❌ Error translating to ${lang}:`, error.message || error);
      translations[lang] = {
        name: member.name,
        position: member.position,
        bio: member.bio,
        specialties: member.specialties,
        experience: member.experience
      };
    }
  }
  
  console.log(`[TranslateTeamMember] ✅ Finished translation. Created translations for ${Object.keys(translations).length} languages`);
  return translations;
}

export async function translatePricingData(pricing: {
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
}): Promise<Record<string, {
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
}>> {
  const sampleText = pricing.packages[0]?.name || pricing.services[0]?.service || '';
  const detectedLang = detectSourceLanguage(sampleText);
  const sourceLang = detectedLang === 'nl' && /[a-zA-Z]/.test(sampleText) && !/[а-яё]/i.test(sampleText) ? 'en' : detectedLang;
  console.log(`[TranslatePricing] Using source language: ${sourceLang}`);
  
  const languages = [...TRANSLATION_LANGUAGE_KEYS];

  const translations: Record<string, {
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
  }> = {};

  console.log(`[TranslatePricing] Starting translation to ${languages.length} languages`);
  
  for (const lang of languages) {
    try {
      const langCode = lang === 'RU' ? 'ru' : lang === 'EN' ? 'en' : lang === 'NL' ? 'nl' : lang === 'DE' ? 'de' : lang === 'FR' ? 'fr' : lang === 'ES' ? 'es' : lang === 'IT' ? 'it' : lang === 'PT' ? 'pt' : lang === 'PL' ? 'pl' : lang === 'CZ' ? 'cs' : lang === 'HU' ? 'hu' : lang === 'RO' ? 'ro' : lang === 'BG' ? 'bg' : lang === 'HR' ? 'hr' : lang === 'SK' ? 'sk' : lang === 'SL' ? 'sl' : lang === 'ET' ? 'et' : lang === 'LV' ? 'lv' : lang === 'LT' ? 'lt' : lang === 'FI' ? 'fi' : lang === 'SV' ? 'sv' : lang === 'DA' ? 'da' : lang === 'NO' ? 'no' : lang === 'GR' ? 'el' : lang === 'UA' ? 'uk' : 'en';
      
      if (sourceLang === langCode) {
        translations[lang] = {
          packages: pricing.packages,
          services: pricing.services
        };
        console.log(`[TranslatePricing] ⏭️ Skipped translation to ${lang} (same as source)`);
        continue;
      }
      
      console.log(`[TranslatePricing] Translating to ${lang} (${sourceLang}->${langCode})...`);
      
      const translatedPackages = await Promise.all(
        pricing.packages.map(async (pkg) => {
          const [name, description] = await Promise.all([
            translateText(pkg.name, lang, sourceLang),
            translateText(pkg.description, lang, sourceLang)
          ]);
          const features = await Promise.all(
            pkg.features.map(feature => translateText(feature, lang, sourceLang))
          );
          return {
            name: (name && name !== pkg.name) ? name : pkg.name,
            description: (description && description !== pkg.description) ? description : pkg.description,
            price: pkg.price, // Цена обычно не переводится
            features: features
          };
        })
      );
      
      const translatedServices = await Promise.all(
        pricing.services.map(async (service) => {
          const [serviceName, description] = await Promise.all([
            translateText(service.service, lang, sourceLang),
            translateText(service.description, lang, sourceLang)
          ]);
          const includes = await Promise.all(
            service.includes.map(inc => translateText(inc, lang, sourceLang))
          );
          return {
            service: (serviceName && serviceName !== service.service) ? serviceName : service.service,
            priceRange: service.priceRange, // Цена обычно не переводится
            description: (description && description !== service.description) ? description : service.description,
            includes: includes
          };
        })
      );
      
      translations[lang] = {
        packages: translatedPackages,
        services: translatedServices
      };
      
      console.log(`[TranslatePricing] ✅ Completed translation to ${lang}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error: any) {
      console.error(`[TranslatePricing] ❌ Error translating to ${lang}:`, error.message || error);
      translations[lang] = {
        packages: pricing.packages,
        services: pricing.services
      };
    }
  }
  
  console.log(`[TranslatePricing] ✅ Finished translation. Created translations for ${Object.keys(translations).length} languages`);
  return translations;
}

export async function translateWork(work: {
  title: string;
  description: string;
  category: string;
  city?: string;
}): Promise<Record<string, {
  title: string;
  description: string;
  category: string;
  city?: string;
}>> {
  const combined = `${work.title}\n${work.description || ''}`;
  const detectedSourceLang = detectSourceLanguage(combined);
  const sourceLang = detectedSourceLang || 'nl';
  console.log(`[TranslateWork] Using source language: ${sourceLang} for work: "${work.title.substring(0, 30)}..."`);

  const languages = [...TRANSLATION_LANGUAGE_KEYS];
  
  const translations: Record<string, {
    title: string;
    description: string;
    category: string;
    city?: string;
  }> = {};

  console.log(`[TranslateWork] Starting translation for work: "${work.title.substring(0, 30)}..." to ${languages.length} languages`);
  
  for (const lang of languages) {
    try {
      const langCode = lang === 'RU' ? 'ru' : lang === 'EN' ? 'en' : lang === 'NL' ? 'nl' : lang === 'DE' ? 'de' : lang === 'FR' ? 'fr' : lang === 'ES' ? 'es' : lang === 'IT' ? 'it' : lang === 'PT' ? 'pt' : lang === 'PL' ? 'pl' : lang === 'CZ' ? 'cs' : lang === 'HU' ? 'hu' : lang === 'RO' ? 'ro' : lang === 'BG' ? 'bg' : lang === 'HR' ? 'hr' : lang === 'SK' ? 'sk' : lang === 'SL' ? 'sl' : lang === 'ET' ? 'et' : lang === 'LV' ? 'lv' : lang === 'LT' ? 'lt' : lang === 'FI' ? 'fi' : lang === 'SV' ? 'sv' : lang === 'DA' ? 'da' : lang === 'NO' ? 'no' : lang === 'GR' ? 'el' : lang === 'UA' ? 'uk' : 'en';
      
      if (sourceLang === langCode) {
        translations[lang] = {
          title: work.title,
          description: work.description,
          category: work.category,
          city: work.city
        };
        console.log(`[TranslateWork] ⏭️ Skipped translation to ${lang} (same as source)`);
        continue;
      }
      
      console.log(`[TranslateWork] Translating to ${lang} (${sourceLang}->${langCode})...`);
      const categorySourceLang = work.category ? detectSourceLanguage(work.category) : sourceLang;
      const citySourceLang = work.city ? detectSourceLanguage(work.city) : sourceLang;
      
      const shouldTranslateCategory = work.category && categorySourceLang !== langCode;
      const shouldTranslateCity = work.city && citySourceLang !== langCode;
      
      const [title, description, category, city] = await Promise.all([
        translateText(work.title, lang, sourceLang),
        translateText(work.description, lang, sourceLang),
        shouldTranslateCategory && work.category ? translateText(work.category, lang, categorySourceLang) : Promise.resolve(work.category),
        shouldTranslateCity && work.city ? translateText(work.city, lang, citySourceLang) : Promise.resolve(work.city)
      ]);

      translations[lang] = {
        title: (title && title !== work.title) ? title : work.title,
        description: (description && description !== work.description) ? description : work.description,
        category: (category && category !== work.category) ? category : work.category,
        city: (city && city !== work.city) ? city : work.city
      };
      
      console.log(`[TranslateWork] ✅ Completed translation to ${lang}: "${translations[lang].title.substring(0, 30)}..."`);
      
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error: any) {
      console.error(`[TranslateWork] ❌ Error translating work to ${lang}:`, error.message || error);
      translations[lang] = {
        title: work.title,
        description: work.description,
        category: work.category,
        city: work.city
      };
    }
  }
  
  console.log(`[TranslateWork] ✅ Finished translation. Created translations for ${Object.keys(translations).length} languages`);

  return translations;
}

export async function translateServicePage(service: {
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
}): Promise<Record<string, {
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
}>> {
  const detectedSourceLang = detectSourceLanguage(service.hero.title || service.hero.subtitle || '');
  const sourceLang = detectedSourceLang || 'nl'; // По умолчанию нидерландский
  console.log(`[TranslateServicePage] Detected source language: ${sourceLang} for service: ${service.id}`);
  
  const languages = [...TRANSLATION_LANGUAGE_KEYS];

  const translations: Record<string, any> = {};

  console.log(`[TranslateServicePage] Starting translation for service: ${service.id} to ${languages.length} languages`);
  
  for (const lang of languages) {
    try {
      const langCode = lang === 'RU' ? 'ru' : lang === 'EN' ? 'en' : lang === 'NL' ? 'nl' : lang === 'DE' ? 'de' : lang === 'FR' ? 'fr' : lang === 'ES' ? 'es' : lang === 'IT' ? 'it' : lang === 'PT' ? 'pt' : lang === 'PL' ? 'pl' : lang === 'CZ' ? 'cs' : lang === 'HU' ? 'hu' : lang === 'RO' ? 'ro' : lang === 'BG' ? 'bg' : lang === 'HR' ? 'hr' : lang === 'SK' ? 'sk' : lang === 'SL' ? 'sl' : lang === 'ET' ? 'et' : lang === 'LV' ? 'lv' : lang === 'LT' ? 'lt' : lang === 'FI' ? 'fi' : lang === 'SV' ? 'sv' : lang === 'DA' ? 'da' : lang === 'NO' ? 'no' : lang === 'GR' ? 'el' : lang === 'UA' ? 'uk' : 'en';
      
      if (sourceLang === langCode) {
        translations[lang] = {
          hero: {
            title: service.hero.title,
            subtitle: service.hero.subtitle
          },
          solutions: {
            title: service.solutions.title,
            description1: service.solutions.description1,
            description2: service.solutions.description2,
            projectsCompleted: service.solutions.projectsCompleted,
            yearsExperience: service.solutions.yearsExperience
          },
          services: {
            title: service.services.title,
            items: service.services.items
          }
        };
        console.log(`[TranslateServicePage] ⏭️ Skipped translation to ${lang} (same as source)`);
        continue;
      }
      
      console.log(`[TranslateServicePage] Translating to ${lang} (${sourceLang}->${langCode})...`);
      
      const [heroTitle, heroSubtitle, solutionsTitle, solutionsDesc1, solutionsDesc2, projectsCompleted, yearsExperience, servicesTitle, ...serviceItems] = await Promise.all([
        translateText(service.hero.title, lang, sourceLang),
        translateText(service.hero.subtitle, lang, sourceLang),
        translateText(service.solutions.title, lang, sourceLang),
        translateText(service.solutions.description1, lang, sourceLang),
        translateText(service.solutions.description2, lang, sourceLang),
        translateText(service.solutions.projectsCompleted, lang, sourceLang),
        translateText(service.solutions.yearsExperience, lang, sourceLang),
        translateText(service.services.title, lang, sourceLang),
        ...service.services.items.map(item => translateText(item, lang, sourceLang))
      ]);

      translations[lang] = {
        hero: {
          title: heroTitle || service.hero.title,
          subtitle: heroSubtitle || service.hero.subtitle
        },
        solutions: {
          title: solutionsTitle || service.solutions.title,
          description1: solutionsDesc1 || service.solutions.description1,
          description2: solutionsDesc2 || service.solutions.description2,
          projectsCompleted: projectsCompleted || service.solutions.projectsCompleted,
          yearsExperience: yearsExperience || service.solutions.yearsExperience
        },
        services: {
          title: servicesTitle || service.services.title,
          items: serviceItems.filter(Boolean).length > 0 ? serviceItems.filter(Boolean) : service.services.items
        }
      };
      
      console.log(`[TranslateServicePage] ✅ Completed translation to ${lang}`);
      
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error: any) {
      console.error(`[TranslateServicePage] ❌ Error translating service to ${lang}:`, error.message || error);
      translations[lang] = {
        hero: service.hero,
        solutions: service.solutions,
        services: service.services
      };
    }
  }
  
  console.log(`[TranslateServicePage] ✅ Finished translation. Created translations for ${Object.keys(translations).length} languages`);
  return translations;
}

