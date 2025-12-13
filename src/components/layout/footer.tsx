"use client"

import Link from 'next/link'
import { VKBouwmasterLogo } from '@/components/ui/logo'
import { useTranslations } from '@/hooks/useTranslations'

export function Footer() {
  const { t } = useTranslations()
  
  return (
    <footer className="bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <VKBouwmasterLogo />
            <p className="mt-4 text-sm sm:text-base text-gray-200 max-w-md leading-relaxed">
              {t.footer?.description || 'Профессиональные услуги ремонта с более чем 10-летним опытом. Я преображаю ваше пространство качественной работой и вниманием к деталям.'}
            </p>
            <div className="mt-4 sm:mt-6 flex space-x-3 sm:space-x-4">
              <a href="https://wa.me/380990804115" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-110 flex items-center justify-center">
                <span className="sr-only">WhatsApp</span>
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24" style={{minWidth: '40px', minHeight: '40px'}}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195  similarly.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 有一次.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 componiendo5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48- porcelain.413Z"/>
                </svg>
              </a>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=vkbouwmaster@gmail.com&su=&body=" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-110 flex items-center justify-center">
                <span className="sr-only">Email</span>
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" style={{minWidth: '32px', minHeight: '32px'}}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
              <a href="https://t.me/+380990804115" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-110 flex items-center justify-center">
                <span className="sr-only">Telegram</span>
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" style={{minWidth: '32px', minHeight: '32px'}}>
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">{t.footer?.quickLinks?.title || 'Быстрые ссылки'}</span>
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link href="/about" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.navigation?.about || 'About'}</Link></li>
              <li><Link href="/services" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.navigation?.services || 'Services'}</Link></li>
              <li><Link href="/portfolio" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.navigation?.portfolio || 'Portfolio'}</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">{t.footer?.services?.title || 'Услуги'}</span>
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link href="/services/flooring-installation" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.home.services?.flooring?.title || 'Flooring Installation'}</Link></li>
              <li><Link href="/services/painting" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.home.services?.painting?.title || 'Painting Services'}</Link></li>
              <li><Link href="/services/plumbing-repairs" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.home.services?.plumbing?.title || 'Plumbing Repairs'}</Link></li>
              <li><Link href="/services/roof-repairs" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.home.services?.roofing?.title || 'Roof Repairs'}</Link></li>
              <li><Link href="/services/garden-design-landscaping" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.home.services?.garden?.title || 'Garden Design'}</Link></li>
            </ul>
          </div>

          {/* Shot / Additional Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">{t.footer?.shot?.title || 'Shot'}</span>
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link href="/" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.navigation?.home || 'Home'}</Link></li>
              <li><Link href="/reviews" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.navigation?.reviews || 'Reviews'}</Link></li>
              <li><Link href="/contact" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors break-words">{t.navigation?.contact || 'Contact'}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-300 text-xs sm:text-sm text-center sm:text-left">
              {t.footer?.copyright || '© 2025 VK Bouwmaster. All rights reserved.'}
            </p>
            <div className="flex space-x-4 sm:space-x-6">
              <Link href="/privacy" className="text-gray-300 hover:text-white text-xs sm:text-sm transition-colors break-words">
                {t.footer?.privacy || 'Privacy Policy'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
