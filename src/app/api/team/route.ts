import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { translateTeamMember } from '@/lib/translate';

const TEAM_FILE = join(process.cwd(), 'src/lib/team-data.json');

interface TeamMemberTranslations {
  name: string;
  position: string;
  bio: string;
  specialties: string[];
  experience: string;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  bio: string;
  specialties: string[];
  experience: string;
  translations?: Record<string, TeamMemberTranslations>;
}

function readTeamData(): TeamMember[] {
  try {
    const data = readFileSync(TEAM_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeTeamData(data: TeamMember[]) {
  writeFileSync(TEAM_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'NL';
    
    const data = readTeamData();
    
    // Если запрашивается исходный язык (определяем автоматически), возвращаем оригинальные данные
    // Для всех остальных языков возвращаем переводы
    if (lang === 'RU' || lang === 'EN') {
    return NextResponse.json(data);
    }
    
    // Для всех остальных языков возвращаем переводы
    const translated = data.map(member => {
      const translation = member.translations?.[lang];
      if (translation) {
        return {
          ...member,
          name: translation.name || member.name,
          position: translation.position || member.position,
          bio: translation.bio || member.bio,
          specialties: translation.specialties || member.specialties,
          experience: translation.experience || member.experience
        };
      }
      return member;
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
    const item: TeamMember = await request.json();

    if (!item.name || !item.position || !item.image) {
      return NextResponse.json(
        { error: 'Необходимы: name, position, image' },
        { status: 400 }
      );
    }

    // Автоматически переводим на все языки
    let translations: Record<string, TeamMemberTranslations> | undefined;
    try {
      translations = await translateTeamMember({
        name: item.name,
        position: item.position,
        bio: item.bio || '',
        specialties: item.specialties || [],
        experience: item.experience || ''
      });
    } catch (translationError) {
      console.error('Translation error:', translationError);
      // Продолжаем без переводов, если произошла ошибка
    }

    const data = readTeamData();
    const newItem = {
      ...item,
      id: item.id || Date.now().toString(),
      translations: translations || item.translations
    };

    data.push(newItem);
    writeTeamData(data);

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при сохранении' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const item: TeamMember = await request.json();

    if (!item.id) {
      return NextResponse.json(
        { error: 'Необходим id' },
        { status: 400 }
      );
    }

    const data = readTeamData();
    const index = data.findIndex(p => p.id === item.id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    const existingMember = data[index];
    // Если изменились текстовые поля, обновляем переводы автоматически
    const needsRetranslation = 
      item.position !== existingMember.position ||
      item.bio !== existingMember.bio ||
      JSON.stringify(item.specialties) !== JSON.stringify(existingMember.specialties);

    let translations = existingMember.translations;
    
    if (needsRetranslation && (item.position || item.bio || item.specialties)) {
      try {
        translations = await translateTeamMember({
          name: item.name || existingMember.name,
          position: item.position || existingMember.position,
          bio: item.bio || existingMember.bio || '',
          specialties: item.specialties || existingMember.specialties || [],
          experience: item.experience || existingMember.experience || ''
        });
        console.log('Translations updated automatically for team member:', item.id);
      } catch (translationError) {
        console.error('Translation error:', translationError);
        translations = existingMember.translations;
      }
    }

    data[index] = { ...existingMember, ...item, translations: translations || existingMember.translations };
    writeTeamData(data);

    return NextResponse.json({ success: true, item: data[index] });
  } catch (error) {
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

    const data = readTeamData();
    const filtered = data.filter(item => item.id !== id);
    writeTeamData(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении' },
      { status: 500 }
    );
  }
}

