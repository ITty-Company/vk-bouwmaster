import React from 'react';
import Image from 'next/image';

export function VKBouwmasterLogo() {
  return (
    <div className="flex items-center">
      <Image
        src="/vk-logo.png"
        alt="VK Bouwmaster Logo"
        width={120}
        height={60}
        className="h-8 sm:h-10 md:h-12 w-auto object-contain"
        priority
        unoptimized
      />
    </div>
  );
}
