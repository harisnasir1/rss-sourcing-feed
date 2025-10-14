import React from 'react'

export default function BlobGradient() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1333 1152"
      className="fixed left-1/2 -translate-x-1/2 -top-10 w-[110rem] h-[18rem] rotate-[-124deg] blur-[200px] z-[999] pointer-events-none"
      aria-hidden
    >
      <defs>
        {/* Match: radial-gradient(50% 50% at 50% 50%, #40789A 0%, rgba(64,120,154,0) 100%) */}
        <radialGradient id="blobGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#40789A" stopOpacity="1" />
          <stop offset="100%" stopColor="#40789A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M-86.893 -724.371C-32.6176 -761.456 251.364 -444.946 525.237 -44.1178C799.11 356.71 977.13 711.709 922.854 748.793C868.579 785.878 602.562 491.006 328.688 90.1778C54.8151 -310.65 -141.168 -687.286 -86.893 -724.371Z"
        fill="url(#blobGradient)"
      />
    </svg>
  )
}
