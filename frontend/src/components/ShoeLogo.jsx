import React from 'react';

function ShoeLogo({ size = 30, className = "", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shoekave-brand-logo ${className}`}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="skGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7D070" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A37E19" />
        </linearGradient>
      </defs>
      
      {/* Upper Sneaker Body */}
      <path
        d="M4.5 21C4.5 21 7.2 13.8 12.2 11.8C16.5 10 19.2 11.2 23 7C25.2 4.5 27.5 3.5 29.5 3.5C31.8 3.5 32.5 5.8 31 9.2C29.5 12.8 31 15.5 33 17.8C33.8 18.8 33.8 20 33.2 21H4.5Z"
        fill="url(#skGoldGrad)"
      />
      
      {/* Midsole & Sole */}
      <path
        d="M3 23C3 22.1716 3.67157 21.5 4.5 21.5H32.5C33.3284 21.5 34 22.1716 34 23V25C34 26.1046 33.1046 27 32 27H5C3.89543 27 3 26.1046 3 25V23Z"
        fill="url(#skGoldGrad)"
      />
      
      {/* Dynamic Stripe Accent */}
      <path
        d="M10 19.5C16.5 19.5 23 17 28.5 11.5"
        stroke="var(--bg-primary, #ffffff)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      
      {/* Laces Accents */}
      <circle cx="21" cy="10" r="1" fill="var(--bg-primary, #ffffff)" />
      <circle cx="24" cy="7.5" r="1" fill="var(--bg-primary, #ffffff)" />
    </svg>
  );
}

export default ShoeLogo;
