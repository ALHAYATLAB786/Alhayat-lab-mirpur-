import React from 'react';

interface AlHayatLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const AlHayatLogo: React.FC<AlHayatLogoProps> = ({size = 'md', showText = true}) => {
  const iconDim = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';

  return (
    <div className="inline-flex items-center gap-3.5">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDim} shrink-0`}
        aria-label="Al-Hayat Lab Mirpur Emblem"
      >
        {/* Outer Royal Indigo Arch */}
        <path
          d="M22 82C16 70 15 54 20 40C28 19 46 10 60 10C74 10 92 19 100 40C105 54 104 70 98 82"
          stroke="#26318C"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        {/* Microscope Base & Stand */}
        <rect x="38" y="84" width="38" height="6" rx="3" fill="#26318C" />
        <path d="M50 84V75H66V84" fill="#26318C" />
        <rect x="43" y="69" width="27" height="4.5" rx="2" fill="#26318C" />
        {/* Microscope Curved Arm & Tube */}
        <path
          d="M58 39C69 39 76 47 76 58C76 68 69 76 59 78"
          stroke="#26318C"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <rect x="52" y="25" width="7" height="25" rx="2.5" fill="#26318C" />
        <rect x="53.5" y="20" width="4" height="6" rx="1" fill="#1E297B" />
        <circle cx="60" cy="43" r="4" fill="#FFFFFF" stroke="#26318C" strokeWidth="2.5" />
        {/* Medical Capsules on Left */}
        <g transform="translate(27 56) rotate(40)">
          <rect x="0" y="0" width="13" height="5.5" rx="2.75" fill="#FFFFFF" stroke="#26318C" strokeWidth="1.4" />
          <path d="M6.5 0H10.2C11.8 0 13 1.2 13 2.75C13 4.3 11.8 5.5 10.2 5.5H6.5V0Z" fill="#2E7D32" />
        </g>
        <g transform="translate(33 45) rotate(-35)">
          <rect x="0" y="0" width="10" height="4.5" rx="2.25" fill="#FFFFFF" stroke="#26318C" strokeWidth="1.2" />
          <path d="M5 0H7.8C9 0 10 1 10 2.25C10 3.5 9 4.5 7.8 4.5H5V0Z" fill="#4CAF50" />
        </g>
        {/* Medical Red Cross on Right */}
        <path d="M84 46H90V53H97V59H90V66H84V59H77V53H84V46Z" fill="#DC2626" />
        {/* Curved Bottom Arc */}
        <path d="M18 96C46 87 74 87 102 96" stroke="#26318C" strokeWidth="2.8" strokeLinecap="round" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#26318C] leading-tight">
            AL-HAYAT LAB
          </span>
          <span className="text-xs font-semibold text-red-600 tracking-normal leading-snug">
            Skin Care Center &amp; Laboratory
          </span>
          <span className="text-xs text-slate-500 leading-snug">
            Your Health Deserves the Best
          </span>
        </div>
      )}
    </div>
  );
};
