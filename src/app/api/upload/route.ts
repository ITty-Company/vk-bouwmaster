import { NextRequest, NextResponse } from 'next/server';
import { mkdir, access } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { existsSync, createWriteStream, constants } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { uploadPublicUrl, uploadStorageDir } from '@/lib/data-file-paths';

export const maxDuration = 300;
export const runtime = 'nodejs';

const MAX_UPLOAD_MB = process.env.MAX_UPLOAD_MB ? Number(process.env.MAX_UPLOAD_MB) : Infinity;

function readableFromWeb(webStream: ReadableStream): Readable {
  return Readable.fromWeb(webStream as any);
}

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

    if (isFinite(MAX_UPLOAD_MB) && file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимальный размер: ${MAX_UPLOAD_MB}MB. Ваш файл: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла. Разрешены только изображения.' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;

    const uploadDir = uploadStorageDir();
    const fileUrl = uploadPublicUrl(fileName);
    console.log('Загрузки сохраняются в:', uploadDir, '→ URL:', fileUrl);

    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      
      await access(uploadDir, constants.W_OK);
    } catch (dirError: any) {
      console.error('Ошибка доступа к директории:', dirError);
      if (dirError.code === 'EACCES' || dirError.code === 'EROFS') {
        return NextResponse.json(
          { 
            error: 'Файловая система доступна только для чтения.',
            code: 'READ_ONLY_FS',
            details: dirError.message,
            hint: 'Нужен записываемый каталог (локально public/uploads; на Render — Persistent Disk с mount /var/data, загрузки в /var/data/uploads)'
          },
          { status: 500 }
        );
      }
    }

    const filePath = join(uploadDir, fileName);

    try {
      const readable = readableFromWeb(file.stream());
      const writable = createWriteStream(filePath);
      await pipeline(readable, writable);
      console.log('✅ Файл успешно сохранён:', filePath);
      console.log('URL файла:', fileUrl);
    } catch (writeError: any) {
      console.error('Ошибка записи файла:', writeError);
      console.error('Код ошибки:', writeError.code);
      console.error('Сообщение:', writeError.message);
      
      if (writeError.code === 'EROFS' || writeError.code === 'EACCES' || writeError.message?.includes('read-only')) {
        return NextResponse.json(
          { 
            error: 'Файловая система доступна только для чтения.',
            code: 'READ_ONLY_FS',
            details: writeError.message,
            hint: 'На Render: Persistent Disk с mount /var/data (загрузки пишутся в /var/data/uploads автоматически)',
            solution: 'https://dashboard.render.com → ваш сервис → Settings → Disk → Create Disk'
          },
          { status: 500 }
        );
      }
      throw writeError;
    }

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
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json({ error: 'Недопустимое имя файла' }, { status: 400 });
    }

    const root = resolve(uploadStorageDir());
    const filePath = resolve(join(uploadStorageDir(), fileName));
    if (!filePath.startsWith(root + sep) && filePath !== root) {
      return NextResponse.json({ error: 'Недопустимый путь' }, { status: 400 });
    }

    const { unlink } = await import('fs/promises');
    
    try {
      await unlink(filePath);
      console.log('✅ Файл удалён:', filePath);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Файл не найден' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении файла' },
      { status: 500 }
    );
  }
}

