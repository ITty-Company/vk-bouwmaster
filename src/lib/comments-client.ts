/** Список отзывов должен подтягиваться с сервера заново, без HTTP-кэша. */
export const commentsListFetchInit: RequestInit = { cache: 'no-store' }
