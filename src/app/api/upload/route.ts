import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { put } from '@vercel/blob';

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

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;

    // Проверяем, есть ли токен Vercel Blob (для production)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (blobToken) {
      // Используем Vercel Blob Storage для production
      try {
        console.log('Загрузка в Vercel Blob Storage:', fileName);
        const blob = await put(fileName, file, {
          access: 'public',
          token: blobToken,
        });
        console.log('✅ Файл успешно загружен в Blob Storage:', blob.url);
        
        return NextResponse.json({ 
          success: true, 
          url: blob.url,
          fileName: fileName,
          size: file.size,
          type: file.type
        });
      } catch (blobError: any) {
        console.error('Ошибка загрузки в Blob Storage:', blobError);
        return NextResponse.json(
          { 
            error: 'Ошибка загрузки в облачное хранилище. Проверьте настройки BLOB_READ_WRITE_TOKEN.',
            details: blobError.message
          },
          { status: 500 }
        );
      }
    } else {
      // Локальная загрузка в public/uploads (для разработки)
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      try {
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }
      } catch (dirError) {
        console.error('Ошибка создания директории:', dirError);
      }

      const filePath = join(uploadDir, fileName);

      try {
        // Конвертируем File в Buffer и сохраняем
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        console.log('✅ Файл успешно сохранён локально:', filePath);
      } catch (writeError: any) {
        console.error('Ошибка записи файла:', writeError);
        console.error('Код ошибки:', writeError.code);
        console.error('Сообщение:', writeError.message);
        
        if (writeError.code === 'EROFS' || writeError.code === 'EACCES' || writeError.message?.includes('read-only')) {
          return NextResponse.json(
            { 
              error: 'Файловая система доступна только для чтения. Настройте Vercel Blob Storage или используйте внешнее хранилище (S3, Cloudflare R2).',
              code: 'READ_ONLY_FS',
              details: writeError.message,
              hint: 'Добавьте переменную окружения BLOB_READ_WRITE_TOKEN в настройках проекта'
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
    }
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
    const blobUrl = searchParams.get('url'); // URL из Vercel Blob

    if (!fileName && !blobUrl) {
      return NextResponse.json(
        { error: 'Имя файла или URL не указано' },
        { status: 400 }
      );
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (blobToken && blobUrl) {
      // Удаление из Vercel Blob Storage
      try {
        const { del } = await import('@vercel/blob');
        await del(blobUrl, { token: blobToken });
        console.log('✅ Файл удалён из Blob Storage:', blobUrl);
        return NextResponse.json({ success: true });
      } catch (blobError: any) {
        console.error('Ошибка удаления из Blob Storage:', blobError);
        return NextResponse.json(
          { error: 'Ошибка при удалении файла из облачного хранилища' },
          { status: 500 }
        );
      }
    } else if (fileName) {
      // Локальное удаление
      const filePath = join(process.cwd(), 'public', 'uploads', fileName);
      const { unlink } = await import('fs/promises');
      
      try {
        await unlink(filePath);
        console.log('✅ Файл удалён локально:', filePath);
        return NextResponse.json({ success: true });
      } catch (error) {
        return NextResponse.json(
          { error: 'Файл не найден' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Не указано имя файла или URL' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении файла' },
      { status: 500 }
    );
  }
}

