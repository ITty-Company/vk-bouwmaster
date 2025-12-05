import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { constants } from 'fs';

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

    // Проверяем наличие Render Disk (монтируется в /uploads)
    const renderDiskPath = '/uploads';
    const hasRenderDisk = existsSync(renderDiskPath);
    
    // Определяем путь для сохранения
    let uploadDir: string;
    let fileUrl: string;
    
    if (hasRenderDisk) {
      // Используем Render Disk
      uploadDir = renderDiskPath;
      fileUrl = `/uploads/${fileName}`;
      console.log('Используется Render Disk:', uploadDir);
    } else {
      // Пробуем локальное хранилище (для разработки)
      uploadDir = join(process.cwd(), 'public', 'uploads');
      fileUrl = `/uploads/${fileName}`;
      console.log('Используется локальное хранилище:', uploadDir);
    }

    // Создаём директорию, если её нет
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      
      // Проверяем, доступна ли директория для записи
      await access(uploadDir, constants.W_OK);
    } catch (dirError: any) {
      console.error('Ошибка доступа к директории:', dirError);
      if (dirError.code === 'EACCES' || dirError.code === 'EROFS') {
        return NextResponse.json(
          { 
            error: 'Файловая система доступна только для чтения.',
            code: 'READ_ONLY_FS',
            details: dirError.message,
            hint: 'На Render.com нужно создать Render Disk: Settings → Disk → Create Disk (mount path: /uploads)'
          },
          { status: 500 }
        );
      }
    }

    const filePath = join(uploadDir, fileName);

    try {
      // Конвертируем File в Buffer и сохраняем
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
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
            hint: 'На Render.com создайте Render Disk: Settings → Disk → Create Disk (mount path: /uploads, минимум 1GB)',
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

    // Проверяем наличие Render Disk
    const renderDiskPath = '/uploads';
    const hasRenderDisk = existsSync(renderDiskPath);
    
    let filePath: string;
    if (hasRenderDisk) {
      filePath = join(renderDiskPath, fileName);
    } else {
      filePath = join(process.cwd(), 'public', 'uploads', fileName);
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

