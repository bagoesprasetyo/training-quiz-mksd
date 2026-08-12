import React from 'react';

interface CompanyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  emblemOnly?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true,
  emblemOnly = false
}) => {
  const sizes = {
    sm: { icon: 'h-7 sm:h-8', sub: 'text-[9px]' },
    md: { icon: 'h-10 sm:h-12', sub: 'text-[10px] sm:text-[11px]' },
    lg: { icon: 'h-14 sm:h-16', sub: 'text-xs sm:text-sm' },
  };

  const currentSize = sizes[size];

  if (emblemOnly) {
    return (
      <img 
        src="/mks-logo.svg.png" 
        alt="MKS Emblem" 
        className={`${currentSize.icon} w-auto object-contain select-none ${className}`} 
      />
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Full Corporate PNG Logo */}
      <img 
        src="/logo2.png" 
        alt="PT Multikarya Sinardinamika" 
        className={`${currentSize.icon} w-auto object-contain`}
      />
      {showSubtitle && (
        <span className={`font-black tracking-[0.25em] text-[#0000FF] uppercase ${currentSize.sub} mt-1 drop-shadow-xs`}>
          TRAINING SYSTEM
        </span>
      )}
    </div>
  );
};
