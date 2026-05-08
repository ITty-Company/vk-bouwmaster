import { dirname, join, resolve } from 'path'
import { mkdirSync, existsSync, copyFileSync, writeFileSync, readFileSync } from 'fs'

/** Ensure parent directory exists before writing a JSON file (e.g. under /var/data). */
export function ensureDirForFile(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true })
}

/** Legacy: JSON next to upload dirs when no explicit env path (local dev / old Render /uploads disk). */
function legacyJsonBesideUploads(fileName: string): string {
  const renderUploads = '/uploads'
  const localUploads = join(process.cwd(), 'public', 'uploads')
  const dir = existsSync(renderUploads) ? renderUploads : localUploads
  return join(dir, fileName)
}

export function commentsRuntimeFile(): string {
  return process.env.COMMENTS_FILE_PATH?.trim() || join(process.cwd(), 'data', 'comments-data.json')
}

export function commentsSeedFile(): string {
  return join(process.cwd(), 'src/lib/comments-data.json')
}

/** Create runtime comments file from seed or [] on first use (Render: under /var/data). */
export function ensureCommentsFileWithSeed(): void {
  const runtime = commentsRuntimeFile()
  const seed = commentsSeedFile()
  mkdirSync(dirname(runtime), { recursive: true })
  if (existsSync(runtime)) return
  try {
    if (existsSync(seed)) {
      copyFileSync(seed, runtime)
      return
    }
  } catch {
    /* ignore */
  }
  try {
    writeFileSync(runtime, '[]', 'utf-8')
  } catch {
    /* ignore */
  }
}

export function worksRuntimeFile(): string {
  return process.env.WORKS_FILE_PATH?.trim() || legacyJsonBesideUploads('works-data.json')
}

export function worksSeedFile(): string {
  return join(process.cwd(), 'src/lib/works-data.json')
}

export function servicesRuntimeFile(): string {
  return process.env.SERVICES_FILE_PATH?.trim() || legacyJsonBesideUploads('services-data.json')
}

export function servicesSeedFile(): string {
  return join(process.cwd(), 'src/lib/services-data.json')
}

export function portfolioRuntimeFile(): string {
  return process.env.PORTFOLIO_FILE_PATH?.trim() || join(process.cwd(), 'src/lib/portfolio-data.json')
}

export function portfolioSeedFile(): string {
  return join(process.cwd(), 'src/lib/portfolio-data.json')
}

export function teamRuntimeFile(): string {
  return process.env.TEAM_FILE_PATH?.trim() || join(process.cwd(), 'src/lib/team-data.json')
}

export function teamSeedFile(): string {
  return join(process.cwd(), 'src/lib/team-data.json')
}

export function blogRuntimeFile(): string {
  return process.env.BLOG_FILE_PATH?.trim() || join(process.cwd(), 'src/lib/blog-data.json')
}

export function blogSeedFile(): string {
  return join(process.cwd(), 'src/lib/blog-data.json')
}

export function faqRuntimeFile(): string {
  return process.env.FAQ_FILE_PATH?.trim() || join(process.cwd(), 'src/lib/faq-data.json')
}

export function faqSeedFile(): string {
  return join(process.cwd(), 'src/lib/faq-data.json')
}

export function pricingRuntimeFile(): string {
  return process.env.PRICING_FILE_PATH?.trim() || join(process.cwd(), 'src/lib/pricing-data.json')
}

export function pricingSeedFile(): string {
  return join(process.cwd(), 'src/lib/pricing-data.json')
}

/** Read JSON from runtime path; if missing, seed from repo copy on persistent disk (Render). */
export function readJsonWithSeed<T>(runtimePath: string, seedPath: string, emptyFallback: T): T {
  try {
    return JSON.parse(readFileSync(runtimePath, 'utf-8')) as T
  } catch {
    try {
      if (!existsSync(seedPath)) return emptyFallback
      const data = JSON.parse(readFileSync(seedPath, 'utf-8')) as T
      if (runtimePath !== seedPath) {
        ensureDirForFile(runtimePath)
        writeFileSync(runtimePath, JSON.stringify(data, null, 2), 'utf-8')
      }
      return data
    } catch {
      return emptyFallback
    }
  }
}

export function writeJsonFile(runtimePath: string, data: unknown): void {
  ensureDirForFile(runtimePath)
  writeFileSync(runtimePath, JSON.stringify(data, null, 2), 'utf-8')
}

const publicUploadsDir = () => join(process.cwd(), 'public', 'uploads')

/**
 * Directory for user uploads (images/videos). On Render use the same disk as JSON:
 * `/var/data/uploads` when `/var/data` exists, or `UPLOAD_DIR` if set.
 * Locally defaults to `public/uploads` (static `/uploads/...`).
 */
export function uploadStorageDir(): string {
  const env = process.env.UPLOAD_DIR?.trim()
  if (env) return env
  if (existsSync('/var/data')) {
    return join('/var/data', 'uploads')
  }
  return publicUploadsDir()
}

/** True when files are under `public/uploads` and can be served as `/uploads/filename`. */
export function uploadUsesPublicStatic(): boolean {
  return resolve(uploadStorageDir()) === resolve(publicUploadsDir())
}

/** True when files live outside `public/` and must be served via `/api/uploads/...`. */
export function uploadServedViaApi(): boolean {
  return !uploadUsesPublicStatic()
}

/** URL path to reference an uploaded file by basename. */
export function uploadPublicUrl(fileName: string): string {
  return uploadUsesPublicStatic() ? `/uploads/${fileName}` : `/api/uploads/${fileName}`
}
