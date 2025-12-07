"use client"

import { useEffect, useState } from 'react'
import Link from "next/link";
import { useTranslations } from '@/hooks/useTranslations'
import { GradientButton } from '@/components/ui/gradient-button'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

interface PricingData {
  packages: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    features: string[];
    popular: boolean;
  }>;
  services: Array<{
    id: string;
    service: string;
    priceRange: string;
    description: string;
    includes: string[];
  }>;
}

export default function PricingPage() {
  const { t, isInitialized, currentLanguage } = useTranslations()
  const heroRef = useScrollAnimation()
  const pricingRef = useScrollAnimation()
  const faqRef = useScrollAnimation()
  const [pricingData, setPricingData] = useState<PricingData>({ packages: [], services: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPricingData()
  }, [currentLanguage])

  const loadPricingData = async () => {
    try {
      const response = await fetch(`/api/pricing?lang=${currentLanguage}`)
      if (response.ok) {
        const data = await response.json()
        setPricingData(data)
      }
    } catch (error) {
      console.error('Error loading pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isInitialized || loading) {
    return (
      <div className="unified-gradient-bg">
        <section className="text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="unified-gradient-bg">
      {/* Hero Section */}
      <section className="text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{t.pricing.hero.title}</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">{t.pricing.hero.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Stats Block (ultra-minimized) */}
      <div className="flex flex-wrap justify-center gap-x-0.5 gap-y-0.5 my-0.5 leading-none">
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-0 text-[8px] font-semibold">
            <span className="text-[8px] leading-none">🏗️</span>
            <span className="ml-[1px]">500+</span>
          </span>
          <span className="text-[6px] text-gray-300 mt-[0.5px] leading-[1]">Проекты</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-0 text-[8px] font-semibold">
            <span className="text-[8px] leading-none">📅</span>
            <span className="ml-[1px]">15+</span>
          </span>
          <span className="text-[6px] text-gray-300 mt-[0.5px] leading-[1]">Лет</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-0 text-[8px] font-semibold">
            <span className="text-[8px] leading-none">⭐</span>
            <span className="ml-[1px]">98%</span>
          </span>
          <span className="text-[6px] text-gray-300 mt-[0.5px] leading-[1]">Удовлетвор.</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-0 text-[8px] font-semibold">
            <span className="text-[8px] leading-none">💬</span>
            <span className="ml-[1px]">24/7</span>
          </span>
          <span className="text-[6px] text-gray-300 mt-[0.5px] leading-[1]">Поддержка</span>
        </div>
      </div>

      {/* Pricing Packages */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.pricing.packages.title}</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t.pricing.packages.subtitle}</p>
          </div>
          
          {pricingData.packages.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-300 text-xl font-medium mb-2">No pricing packages yet</p>
              <p className="text-gray-500 text-sm">Add pricing packages through the admin panel</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingData.packages.map((plan) => (
              <div
                  key={plan.id}
                className={`relative bg-gray-800 rounded-lg shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">{t.pricing.packages.popular}</span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-300 mb-4">{plan.description}</p>
                  <div className="text-3xl font-bold text-blue-400">{plan.price}</div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/contact"
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {t.common?.getQuote || 'Get Quote'}
                </Link>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Service Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.pricing.services.title}</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t.pricing.services.subtitle}</p>
          </div>
          
          {pricingData.services.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30">
              <div className="text-6xl mb-4">🔧</div>
              <p className="text-gray-300 text-xl font-medium mb-2">No service pricing yet</p>
              <p className="text-gray-500 text-sm">Add service pricing through the admin panel</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pricingData.services.map((service) => (
                <div key={service.id} className="bg-gray-800 rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-semibold text-white mb-2">{service.service}</h3>
                <div className="text-2xl font-bold text-blue-400 mb-4">{service.priceRange}</div>
                <p className="text-gray-300 mb-6">{service.description}</p>
                
                <div>
                  <h4 className="font-semibold text-white mb-3">{t.common?.includes || 'Includes:'}</h4>
                  <ul className="space-y-2">
                    {service.includes.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm text-gray-300">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Factors Affecting Price */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Affects Pricing?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Several factors influence the final cost of your renovation project
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📏</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Project Size & Scope</h3>
                  <p className="text-gray-300">
                    Larger projects typically cost more per square foot due to economies of scale and complexity.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🏗️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Material Quality</h3>
                  <p className="text-gray-300">
                    Premium materials cost more but offer better durability and aesthetics.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">⏰</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Timeline</h3>
                  <p className="text-gray-300">
                    Rush projects may incur additional costs due to expedited scheduling and overtime.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🔧</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Existing Conditions</h3>
                  <p className="text-gray-300">
                    Structural issues or hidden problems discovered during renovation can affect pricing.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📍</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Location & Access</h3>
                  <p className="text-gray-300">
                    Difficult access or remote locations may require additional equipment or time.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🎨</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Customization</h3>
                  <p className="text-gray-300">
                    Custom designs and unique requirements may increase project costs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Quote CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
              {t.pricing.cta.title}
            </span>
          </h2>
          <p className="text-xl text-blue-100 mb-8">{t.pricing.cta.subtitle}</p>
          <div className="flex gap-6 flex-col sm:flex-row justify-center">
            <GradientButton asChild>
              <Link href="/contact">
                Получить Бесплатную Смету
              </Link>
            </GradientButton>
            <GradientButton asChild variant="variant">
              <Link href="/portfolio">
                Посмотреть Наши Работы
              </Link>
            </GradientButton>
          </div>
        </div>
      </section>
    </div>
  );
}
