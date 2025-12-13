"use client"

import { ShaderAnimation } from "@/components/ui/shader-animation";
import { Parallax } from "@/components/ui/parallax";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Meteors } from "@/components/ui/meteors";
import { useTranslations } from "@/hooks/useTranslations";
import { useService } from "@/hooks/useService";

export default function FlooringInstallationPage() {
  const { t, currentLanguage } = useTranslations();
  const sectionRef = useScrollAnimation();
  const { service } = useService('flooring', currentLanguage);

  return (
    <div className="unified-gradient-bg">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient-bg pt-16 sm:pt-20 md:pt-24 pb-20">
        <div className="absolute inset-0 z-20 opacity-90 pointer-events-none">
          <ShaderAnimation />
        </div>
        
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-950 to-black"></div>
        
        <Parallax speed={0.3} className="relative z-30 text-center px-4 sm:px-6">
          <div>
            <div className="text-center mx-auto mb-6 sm:mb-8">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">🏠</div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 sm:mb-6 px-2">
                <span className="text-gray-200 break-words">
                  {service?.hero.title || t.servicePages?.flooring?.hero?.title || 'Flooring Installation'}
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
                {service?.hero.subtitle || t.servicePages?.flooring?.hero?.subtitle || 'Professional flooring installation and repair services for all types of flooring materials'}
              </p>
            </div>
          </div>
        </Parallax>
      </section>

      {/* Services Overview */}
      <section ref={sectionRef} className="bg-black scroll-fade-in py-8 sm:py-12 pb-0">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start lg:items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight font-bold section-title mb-6 sm:mb-8">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 break-words">
                  {service?.solutions.title || t.servicePages?.flooring?.solutions?.title || 'Professional Solutions'}
                </span>
              </h2>
              <p className="text-gray-200 text-base sm:text-lg md:text-xl leading-relaxed mb-4 sm:mb-6 elegant-text">
                {service?.solutions.description1 || t.servicePages?.flooring?.solutions?.description1 || 'Transform your space with our professional flooring installation services. I specialize in all types of flooring materials and provide expert installation, repair, and maintenance services.'}
              </p>
              <p className="text-gray-200 text-base sm:text-lg md:text-xl leading-relaxed mb-6 sm:mb-8 elegant-text">
                {service?.solutions.description2 || t.servicePages?.flooring?.solutions?.description2 || 'My experience ensures proper installation techniques, attention to detail, and the use of quality materials to create beautiful, durable floors that will last for years.'}
              </p>
              
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center elegant-card p-4 sm:p-6 animate-slide-up relative">
                  <Meteors number={15} />
                  <div className="relative z-10">
                    <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
                      200+
                    </div>
                    <div className="text-sm sm:text-base text-gray-300 break-words">{service?.solutions.projectsCompleted || t.servicePages?.flooring?.solutions?.projectsCompleted || 'Completed Projects'}</div>
                  </div>
                </div>
                <div className="text-center elegant-card p-4 sm:p-6 animate-slide-up relative" style={{animationDelay: '0.1s'}}>
                  <Meteors number={15} />
                  <div className="relative z-10">
                    <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
                      10+
                    </div>
                    <div className="text-sm sm:text-base text-gray-300 break-words">{service?.solutions.yearsExperience || t.servicePages?.flooring?.solutions?.yearsExperience || 'Years of Experience'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="elegant-card p-6 sm:p-8 animate-slide-up relative">
              <Meteors number={20} />
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold elegant-title mb-4 sm:mb-6">{service?.services.title || t.servicePages?.flooring?.services?.title || 'Our Services'}</h3>
                <div className="space-y-3 sm:space-y-4">
                  {(service?.services.items || t.servicePages?.flooring?.services?.items || [
                    'Parquet flooring installation',
                    'Laminate flooring',
                    'Tile and stone installation',
                    'Carpet installation',
                    'Vinyl flooring (LVT)',
                    'Floor repair and restoration'
                  ]).map((serviceItem: string, idx: number) => (
                    <div key={idx} className="flex items-start sm:items-center animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
                      <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full mr-3 sm:mr-4 mt-1.5 sm:mt-0 flex-shrink-0"></span>
                      <span className="text-sm sm:text-base text-gray-200 elegant-text break-words">{serviceItem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
