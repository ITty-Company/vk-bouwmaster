"use client"

import { ShaderAnimation } from "@/components/ui/shader-animation";
import { Parallax } from "@/components/ui/parallax";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Meteors } from "@/components/ui/meteors";
import { useTranslations } from "@/hooks/useTranslations";
import { useService } from "@/hooks/useService";

export default function TileInstallationPage() {
  const { t, currentLanguage } = useTranslations();
  const sectionRef = useScrollAnimation();
  const { service } = useService('tile', currentLanguage);

  return (
    <div className="unified-gradient-bg">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient-bg pt-20 pb-20">
        <div className="absolute inset-0 z-20 opacity-90 pointer-events-none">
          <ShaderAnimation />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-950 to-black"></div>
        <Parallax speed={0.3} className="relative z-30 text-center px-4">
          <div>
            <div className="text-center mx-auto mb-8">
              <div className="text-6xl mb-6">🧱</div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
                <span className="text-gray-200">{service?.hero.title || t.servicePages?.tile?.hero?.title || 'Tile Installation'}</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {service?.hero.subtitle || t.servicePages?.tile?.hero?.subtitle || 'Professional tile removal and installation services for kitchens, bathrooms, and more'}
              </p>
            </div>
          </div>
        </Parallax>
      </section>

      <section ref={sectionRef} className="bg-black scroll-fade-in py-8 pb-0">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl leading-tight font-bold section-title mb-8">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                  {service?.solutions.title || t.servicePages?.tile?.solutions?.title || 'Professional Solutions'}
                </span>
              </h2>
              <p className="text-gray-200 text-lg md:text-xl leading-relaxed mb-6 elegant-text">
                {service?.solutions.description1 || t.servicePages?.tile?.solutions?.description1 || 'Removal of old tiles, surface preparation, and precise tile installation. I ensure proper geometry, grouting, and waterproofing.'}
              </p>
              <p className="text-gray-200 text-lg md:text-xl leading-relaxed mb-6 elegant-text">
                {service?.solutions.description2 || t.servicePages?.tile?.solutions?.description2 || 'I use quality materials and tools — for impeccable results and durability.'}
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center elegant-card p-6 animate-slide-up relative">
                  <Meteors number={15} />
                  <div className="relative z-10">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">200+</div>
                    <div className="text-gray-300">{service?.solutions.projectsCompleted || t.servicePages?.tile?.solutions?.projectsCompleted || 'Completed Projects'}</div>
                  </div>
                </div>
                <div className="text-center elegant-card p-6 animate-slide-up relative" style={{animationDelay: '0.1s'}}>
                  <Meteors number={15} />
                  <div className="relative z-10">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">10+</div>
                    <div className="text-gray-300">{service?.solutions.yearsExperience || t.servicePages?.tile?.solutions?.yearsExperience || 'Years of Experience'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="elegant-card p-8 animate-slide-up relative">
              <Meteors number={20} />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold elegant-title mb-6">{service?.services.title || t.servicePages?.tile?.services?.title || 'Our Services'}</h3>
                <div className="space-y-4">
                  {(service?.services.items || t.servicePages?.tile?.services?.items || [
                    'Old tile removal',
                    'Surface preparation and leveling',
                    'Wet area waterproofing',
                    'Tile and mosaic installation',
                    'Grouting and sealing',
                    'Restoration and replacement of individual elements'
                  ]).map((serviceItem: string, idx: number) => (
                    <div key={idx} className="flex items-center animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
                      <span className="w-3 h-3 bg-blue-400 rounded-full mr-4"></span>
                      <span className="text-gray-200 elegant-text">{serviceItem}</span>
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
