import React from 'react';

export function VKBouwmasterLogo() {
  return (
    <div className="flex flex-col">
      {/* Company Name - адаптивный размер для мобильных */}
      <span 
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide transition-all duration-500 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 leading-tight"
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 800,
          letterSpacing: '0.05em'
        }}
      >
        VK BOUWMASTER
      </span>
    </div>
  );
}
