"use client"

import { useState } from "react"
import { useTranslations } from '@/hooks/useTranslations'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { motion } from 'framer-motion'
import { ShaderAnimation } from '@/components/ui/shader-animation'
import { Meteors } from '@/components/ui/meteors'
import { GradientButton } from '@/components/ui/gradient-button'
import { Parallax } from '@/components/ui/parallax'
import { Phone, Mail, MapPin, Clock, MessageCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { PhoneInput } from '@/components/ui/phone-input'

export default function ContactPage() {
  const { t } = useTranslations()
  const contactInfoRef = useScrollAnimation()
  const [showThankYou, setShowThankYou] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    message: ''
  })

  const validatePostalCode = (postalCode: string): boolean => {
    const dutchPostalCodeRegex = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/
    return dutchPostalCodeRegex.test(postalCode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.street.trim()) {
      alert(t.contact.form.streetRequired)
      return
    }
    
    if (!formData.houseNumber.trim()) {
      alert(t.contact.form.houseNumberRequired)
      return
    }
    
    if (!formData.postalCode.trim()) {
      alert(t.contact.form.postalCodeRequired)
      return
    }
    
    if (!validatePostalCode(formData.postalCode)) {
      alert(t.contact.form.postalCodeInvalid)
      return
    }
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setFormData({
          name: '',
          email: '',
          phone: '',
          street: '',
          houseNumber: '',
          postalCode: '',
          city: '',
          message: ''
        })
        setShowThankYou(true)
      } else {
        alert(t.contact.form.errorMessage)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert(t.contact.form.errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Если показывается страница благодарности
  if (showThankYou) {
    // Получаем переводы для страницы благодарности
    const thankYouText = (t.contactThankYou && 
      t.contactThankYou.title && 
      t.contactThankYou.message && 
      t.contactThankYou.backToContact) ? t.contactThankYou : {
      title: 'Thank you for your message!',
      message: 'I will contact you within a day.',
      backToContact: 'Back to contact'
    }

    return (
      <div className="unified-gradient-bg fixed inset-0 z-50 text-white flex items-center justify-center overflow-auto" style={{ minHeight: '100vh', width: '100vw' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40 w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-8"
            >
              <CheckCircle2 className="h-12 w-12 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 px-4"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 animate-gradient bg-[length:200%_auto] break-words">
                {thankYouText.title}
              </span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 border-2 border-blue-700/40 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 mb-6 sm:mb-8 mx-4"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-gray-200 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed break-words"
              >
                {thankYouText.message}
              </motion.p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <GradientButton 
                onClick={() => setShowThankYou(false)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold cursor-pointer mx-4 sm:mx-0"
              >
                <ArrowLeft className="inline-block mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {thankYouText.backToContact}
              </GradientButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="unified-gradient-bg relative min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient-bg pt-16 sm:pt-20 md:pt-24 pb-20 z-10">
        {/* Shader Animation now on top with opacity */}
        <div className="absolute inset-0 z-20 opacity-90 pointer-events-none">
          <ShaderAnimation />
        </div>
        
        {/* Dark blue background with gradient fade to black */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-950 via-blue-950/80 to-black"></div>
        
        {/* Gradient fade at bottom to smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-25 pointer-events-none"></div>
        
        <Parallax speed={0.3} className="relative z-30 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <MessageCircle className="w-20 h-20 md:w-24 md:h-24 mx-auto text-blue-400" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 sm:mb-6 px-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 animate-gradient bg-[length:200%_auto] break-words">
                {t.contact.hero.title}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto text-gray-300 leading-relaxed px-4">
              {t.contact.hero.subtitle}
            </p>
          </motion.div>
        </Parallax>
      </section>

      {/* Contact Form & Info Section */}
      <motion.section 
        ref={contactInfoRef} 
        className="relative pt-8 pb-20 bg-gradient-to-b from-black via-gray-900 to-black z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Переходная анимация сверху */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-black/30 to-black z-0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        ></motion.div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl border border-blue-700/30">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-xl sm:rounded-2xl opacity-50"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 break-words">
                      {t.contact.form.title}
                    </span>
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                      >
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                          {t.contact.form.name} *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
                          placeholder={t.contact.form.namePlaceholder}
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 }}
                      >
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                          {t.contact.form.email} *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
                          placeholder={t.contact.form.emailPlaceholder}
                        />
                      </motion.div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                        {t.contact.form.phone}
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        placeholder={t.contact.form.phonePlaceholder?.replace(/^\+31\s?/, '') || '6 1234 5678'}
                        className="w-full"
                        defaultCountry="NL"
                      />
                    </motion.div>

                    {/* Address Fields */}
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-3 gap-6"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="md:col-span-2">
                        <label htmlFor="street" className="block text-sm font-medium text-gray-300 mb-2">
                          {t.contact.form.street} *
                        </label>
                        <input
                          type="text"
                          id="street"
                          name="street"
                          required
                          value={formData.street}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
                          placeholder={t.contact.form.streetPlaceholder}
                        />
                      </div>
                      <div>
                        <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-300 mb-2">
                          {t.contact.form.houseNumber} *
                        </label>
                        <input
                          type="text"
                          id="houseNumber"
                          name="houseNumber"
                          required
                          value={formData.houseNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
                          placeholder={t.contact.form.houseNumberPlaceholder}
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.35 }}
                    >
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-300 mb-2">
                          {t.contact.form.postalCode} *
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          required
                          value={formData.postalCode}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
                          placeholder={t.contact.form.postalCodePlaceholder}
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                          {t.contact.form.city}
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
                          placeholder={t.contact.form.cityPlaceholder}
                        />
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                    >
                      <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                        {t.contact.form.message} *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500 resize-none"
                        placeholder={t.contact.form.messagePlaceholder}
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.45 }}
                    >
                      <GradientButton type="submit" variant="variant" className="w-full text-lg px-8 py-4">
                        {t.contact.form.sendMessage}
                      </GradientButton>
                    </motion.div>
                  </form>
                </div>
                <Meteors number={20} />
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-2xl border border-blue-700/30">
                <h3 className="text-2xl font-bold mb-8">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300">
                    {t.contact.info.title}
                  </span>
                </h3>
                <div className="space-y-6">
                  <motion.div 
                    className="flex items-start space-x-4 group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-shadow">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{t.contact.info.phone.title}</h4>
                      <a href="https://wa.me/380990804115" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-blue-400 transition-colors">
                        +380 99 080 4115
                      </a>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start space-x-4 group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50 group-hover:shadow-green-500/70 transition-shadow">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{t.contact.info.email.title}</h4>
                      <a href="https://mail.google.com/mail/?view=cm&fs=1&to=vkbouwmaster@gmail.com" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-green-400 transition-colors break-all">
                        vkbouwmaster@gmail.com
                      </a>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start space-x-4 group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-shadow">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{t.contact.info.address.title}</h4>
                      <p className="text-gray-300">
                        Noord-Brabant<br />
                        {t.contact.info.address.country}
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start space-x-4 group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50 group-hover:shadow-orange-500/70 transition-shadow">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{t.contact.info.hours.title}</h4>
                      <p className="text-gray-300 text-sm">
                        {t.contact.info.hours.byAppointment}
                      </p>
                    </div>
                  </motion.div>
                </div>
                <Meteors number={15} />
              </div>

              {/* Contact Methods */}
              <motion.div 
                className="relative bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-2 border-blue-700/50 rounded-2xl p-6 shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-blue-300 text-lg">{t.contact.info.contactMethods.title}</h4>
                  </div>
                  <p className="text-blue-200 text-sm mb-4">
                    {t.contact.info.contactMethods.subtitle}
                  </p>
                  <div className="space-y-3">
                    <a
                      href="https://wa.me/380990804115"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl text-center transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30"
                    >
                      {t.contact.info.contactMethods.whatsapp}
                    </a>
                    <a
                      href="https://t.me/+380990804115"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl text-center transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/30"
                    >
                      {t.contact.info.contactMethods.telegram}
                    </a>
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=vkbouwmaster@gmail.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl text-center transition-all duration-300 hover:scale-105 shadow-lg shadow-red-500/30"
                    >
                      {t.contact.info.contactMethods.email}
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

    </div>
  )
}
