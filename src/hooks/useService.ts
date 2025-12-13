import { useEffect, useState } from 'react';
import { getTranslatedService, type ServicePage } from '@/lib/services';
import type { Language } from '@/lib/translations';

export function useService(serviceId: string, currentLanguage: Language) {
  const [serviceData, setServiceData] = useState<ServicePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/services');
        if (res.ok) {
          const services: ServicePage[] = await res.json();
          const service = services.find(s => s.id === serviceId);
          if (service) {
            setServiceData(service);
          }
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const service = serviceData ? getTranslatedService(serviceData, currentLanguage) : null;

  return { service, loading, serviceData };
}

