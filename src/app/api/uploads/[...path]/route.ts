import { NextRequest, NextResponse } from 'next/server';
import { stat, readFile } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { existsSync, createReadStream } from 'fs';
import { uploadStorageDir } from '@/lib/data-file-paths';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const segments = params.path || [];
    if (segments.some((s) => s.includes('..'))) {
      return NextResponse.json({ error: 'Недопустимый путь' }, { status: 400 });
    }
    const rel = segments.join('/');
    const root = resolve(uploadStorageDir());
    const fullPath = resolve(join(uploadStorageDir(), rel));
    if (!fullPath.startsWith(root + sep) && fullPath !== root) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    const fileStat = await stat(fullPath);

    const ext = rel.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      webm: 'video/webm',
    };

    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

    const range = request.headers.get('range');
    if (range && (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'webm')) {
      const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB
      const bytesPrefix = 'bytes=';
      if (range.startsWith(bytesPrefix)) {
        const parts = range.replace(bytesPrefix, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = Math.min(start + CHUNK_SIZE, fileStat.size - 1);
        const chunkSize = end - start + 1;

        const stream = createReadStream(fullPath, { start, end });
        return new NextResponse(stream as any, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': `${chunkSize}`,
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    const fileBuffer = await readFile(fullPath);
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': `${fileStat.size}`,
      },
    });
  } catch (error: any) {
    console.error('Ошибка чтения файла:', error);
    return NextResponse.json(
      { error: 'Ошибка при чтении файла', details: error.message },
      { status: 500 }
    );
  }
}

