import { createHash } from 'crypto'

export function fingerprintStable(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32)
}

/** Detect edits to Russian (canonical) service fields → invalidate cached translations. */
export function serviceTranslateFingerprint(service: {
  hero: { title: string; subtitle: string }
  solutions: {
    title: string
    description1: string
    description2: string
    projectsCompleted: string
    yearsExperience: string
  }
  services: { title: string; items: string[] }
}): string {
  return fingerprintStable({
    hero: service.hero,
    solutions: service.solutions,
    services: { title: service.services.title, items: [...service.services.items] },
  })
}

export function workTranslateFingerprint(work: {
  title: string
  description: string
  category: string
  city?: string
}): string {
  return fingerprintStable({
    title: work.title,
    description: work.description || '',
    category: work.category,
    city: work.city || '',
  })
}

export function faqCategoryFingerprint(cat: {
  title: string
  questions: Array<{ question: string; answer: string }>
}): string {
  return fingerprintStable({
    title: cat.title,
    questions: cat.questions.map((q) => [q.question, q.answer]),
  })
}

export function blogPostFingerprint(post: {
  title: string
  excerpt: string
  category: string
  content?: string
}): string {
  return fingerprintStable({
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    content: post.content || '',
  })
}
