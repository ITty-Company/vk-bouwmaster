import type { Language } from './translations';

export interface ServicePage {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  solutions: {
    title: string;
    description1: string;
    description2: string;
    projectsCompleted: string;
    yearsExperience: string;
  };
  services: {
    title: string;
    items: string[];
  };
  translations?: Record<string, {
    hero: {
      title: string;
      subtitle: string;
    };
    solutions: {
      title: string;
      description1: string;
      description2: string;
      projectsCompleted: string;
      yearsExperience: string;
    };
    services: {
      title: string;
      items: string[];
    };
  }>;
  _translationSourceFingerprint?: string;
}

export function getTranslatedService(
  service: ServicePage,
  language: Language
): {
  hero: {
    title: string;
    subtitle: string;
  };
  solutions: {
    title: string;
    description1: string;
    description2: string;
    projectsCompleted: string;
    yearsExperience: string;
  };
  services: {
    title: string;
    items: string[];
  };
} {
  if (service.translations && service.translations[language]) {
    const translation = service.translations[language];
    if (translation.hero && translation.hero.title && translation.hero.subtitle) {
      return translation;
    }
  }

  return {
    hero: service.hero,
    solutions: service.solutions,
    services: service.services
  };
}

