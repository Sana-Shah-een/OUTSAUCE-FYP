import React from "react";

interface OutsauceLogoProps {
  className?: string;
}

export const OutsauceLogo: React.FC<OutsauceLogoProps> = ({ className = "h-10" }) => {
  return (
    <svg 
      viewBox="0 0 130 80" 
      className={`select-none ${className}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4" 
        y="6" 
        width="4" 
        height="68" 
        fill="#C41E1E" 
        rx="2" 
        className="text-brand-red"
      />

      <text
        x="16" 
        y="38" 
        fontFamily="inherit" 
        fontWeight="800" 
        fontSize="38" 
        fill="currentColor"
        letterSpacing="-0.04em"
        className="text-text-main"
      >
        Out
      </text>

      <text
        x="16" 
        y="74" 
        fontFamily="inherit" 
        fontWeight="800" 
        fontSize="38" 
        fill="#C41E1E"
        letterSpacing="-0.04em"
      >
        Sauce
      </text>
    </svg>
  );
};
