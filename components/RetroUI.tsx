import React from 'react';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export const RetroButton: React.FC<RetroButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  let bgClass = 'bg-mario-question';
  let hoverClass = 'hover:bg-[#ffe66e]';
  
  if (variant === 'secondary') {
    bgClass = 'bg-gray-200';
    hoverClass = 'hover:bg-white';
  } else if (variant === 'danger') {
    bgClass = 'bg-red-500 text-white';
    hoverClass = 'hover:bg-red-400';
  }

  return (
    <button 
      className={`
        ${bgClass} ${hoverClass} 
        border-4 border-black 
        text-black font-press-start text-sm sm:text-base
        py-3 px-4 
        shadow-retro active:shadow-none active:translate-x-1 active:translate-y-1 
        transition-all duration-75
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export const RetroPanel: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-mario-ground border-4 border-black p-6 shadow-retro-lg ${className}`}>
      {children}
    </div>
  );
};

export const CrownIcon: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="0" y="0" width="100%" height="100%">
          <feOffset result="offOut" in="SourceGraphic" dx="2" dy="2" />
          <feColorMatrix result="matrixOut" in="offOut" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          <feBlend in="SourceGraphic" in2="matrixOut" mode="normal" />
        </filter>
      </defs>
      <path d="M15 35 L30 70 H70 L85 35 L65 55 L50 20 L35 55 Z" fill="#fbbf24" stroke="black" strokeWidth="4" strokeLinejoin="round"/>
      <rect x="30" y="70" width="40" height="10" fill="#f59e0b" stroke="black" strokeWidth="4"/>
      
      {/* Jewels */}
      <circle cx="50" cy="60" r="7" fill="#ef4444" stroke="black" strokeWidth="2" />
      <circle cx="38" cy="65" r="4" fill="#3b82f6" stroke="black" strokeWidth="2" />
      <circle cx="62" cy="65" r="4" fill="#3b82f6" stroke="black" strokeWidth="2" />

      {/* Top Points */}
      <circle cx="15" cy="35" r="5" fill="#fcd834" stroke="black" strokeWidth="2"/>
      <circle cx="85" cy="35" r="5" fill="#fcd834" stroke="black" strokeWidth="2"/>
      <circle cx="50" cy="20" r="6" fill="#fcd834" stroke="black" strokeWidth="2"/>
  </svg>
);

export const TrophyIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 2H17V4H19C20.1046 4 21 4.89543 21 6V8C21 9.10457 20.1046 10 19 10H17V12C17 14.2091 15.2091 16 13 16H11C8.79086 16 7 14.2091 7 12V10H5C3.89543 10 3 9.10457 3 8V6C3 4.89543 3.89543 4 5 4H7V2ZM17 8V6H19V8H17ZM5 8H7V6H5V8ZM9 18H15V20H9V18ZM7 20H17V22H7V20Z" fill="#fcd834" stroke="#000" strokeWidth="2"/>
  </svg>
);