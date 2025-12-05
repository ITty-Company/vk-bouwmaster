import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Увеличиваем лимит размера файла (до 100MB)
export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (максимум 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимальный размер: 100MB. Ваш файл: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    const allowedTypes = ['image/', 'video/'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла. Разрешены только изображения и видео.' },
        { status: 400 }
      );
    }

    // Создаем директорию uploads если её нет
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
    } catch (dirError) {
      console.error('Ошибка создания директории:', dirError);
      // Продолжаем, возможно директория уже существует
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(uploadDir, fileName);

    try {
      // Конвертируем File в Buffer и сохраняем
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
    } catch (writeError: any) {
      console.error('Ошибка записи файла:', writeError);
      
      // Проверяем, не является ли это ошибкой файловой системы (например, на Vercel)
      if (writeError.code === 'EROFS' || writeError.code === 'EACCES' || writeError.message?.includes('read-only')) {
        return NextResponse.json(
          { 
            error: 'Файловая система доступна только для чтения. На Vercel используйте внешнее хранилище (например, Vercel Blob Storage, Cloudinary или S3).',
            code: 'READ_ONLY_FS'
          },
          { status: 500 }
        );
      }
      throw writeError;
    }

    // Возвращаем URL файла
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    });
  } catch (error: any) {
    console.error('Ошибка загрузки файла:', error);
    const errorMessage = error.message || 'Ошибка при загрузке файла';
    return NextResponse.json(
      { error: errorMessage, details: error.toString() },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'Имя файла не указано' },
        { status: 400 }
      );
    }

    const filePath = join(process.cwd(), 'public', 'uploads', fileName);
    const { unlink } = await import('fs/promises');
    
    try {
      await unlink(filePath);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении файла' },
      { status: 500 }
    );
  }
}

