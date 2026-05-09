/** Список отзывов после модерации должен подтягиваться с сервера заново, без HTTP-кэша. */
export const commentsListFetchInit: RequestInit = { cache: 'no-store' }
