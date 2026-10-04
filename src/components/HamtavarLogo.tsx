import React from 'react';

interface HamtavarLogoProps {
  className?: string;
  size?: number;
}

export const HamtavarLogo: React.FC<HamtavarLogoProps> = ({
  className = 'w-10 h-10',
  size = 40,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        {/* Top-Right Emerald Shape */}
        <path
          d="M20 20 H 72 C 77.5 20 82 24.5 82 30 V 50 C 82 55.5 77.5 60 72 60 H 60 C 54.5 60 50 55.5 50 50 V 38 C 50 34 46 30 42 30 H 20 Z"
          fill="#107C65"
          className="transition-colors"
        />

        {/* Bottom-Left Navy Shape */}
        <path
          d="M80 80 H 28 C 22.5 80 18 75.5 18 70 V 50 C 18 44.5 22.5 40 28 40 H 40 C 45.5 40 50 44.5 50 50 V 62 C 50 66 54 70 58 70 H 80 Z"
          fill="#172236"
          className="transition-colors"
        />
      </svg>
    </div>
  );
};
