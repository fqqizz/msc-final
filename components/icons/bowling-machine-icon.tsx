import React from 'react'

interface BowlingMachineIconProps {
  size?: number
  className?: string
}

/**
 * BowlingMachineIcon
 * Vector silhouette representation of an automated cricket bowling machine
 * mounted on a tripod stand, based directly on the authoritative MSC facility asset.
 */
export function BowlingMachineIcon({ size = 20, className = '' }: BowlingMachineIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top Feeder Aperture with cutout inner circle and diagonal slit */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 3C19.5817 3 16 6.58172 16 11C16 15.4183 19.5817 19 24 19C28.4183 19 32 15.4183 32 11C32 6.58172 28.4183 3 24 3ZM24 6.5C21.5147 6.5 19.5 8.51472 19.5 11C19.5 13.4853 21.5147 15.5 24 15.5C26.4853 15.5 28.5 13.4853 28.5 11C28.5 8.51472 26.4853 6.5 24 6.5Z"
      />
      {/* Diagonal feeder wheel marker */}
      <path
        d="M21.2 8.2L26.8 13.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Main Machine Head Housing with cutout pill grooves */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.5 7C7.01472 7 5 9.01472 5 11.5C5 13.9853 7.01472 16 9.5 16H38.5C40.9853 16 43 13.9853 43 11.5C43 9.01472 40.9853 7 38.5 7H9.5ZM10 10.5C9.44772 10.5 9 10.9477 9 11.5C9 12.0523 9.44772 12.5 10 12.5H14C14.5523 12.5 15 12.0523 15 11.5C15 10.9477 14.5523 10.5 14 10.5H10ZM34 10.5C33.4477 10.5 33 10.9477 33 11.5C33 12.0523 33.4477 12.5 34 12.5H38C38.5523 12.5 39 12.0523 39 11.5C39 10.9477 38.5523 10.5 38 10.5H34Z"
      />

      {/* Lower Head Chassis */}
      <path d="M8 16H40V19.5C40 21.433 38.433 23 36.5 23H11.5C9.567 23 8 21.433 8 19.5V16Z" />

      {/* Downward bumper pads */}
      <rect x="10" y="23" width="5" height="3.5" rx="1.75" />
      <rect x="33" y="23" width="5" height="3.5" rx="1.75" />

      {/* Swivel neck connector collar */}
      <rect x="21.5" y="23" width="5" height="4.5" rx="1" />

      {/* Tripod Stand */}
      {/* Center Vertical Leg */}
      <rect x="22.5" y="27.5" width="3" height="15" rx="1" />
      <rect x="20" y="42.5" width="8" height="2.5" rx="1.25" />

      {/* Left Angled Leg */}
      <path
        d="M22 28.5L9.5 43"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <rect x="6" y="42.5" width="8" height="2.5" rx="1.25" />

      {/* Right Angled Leg */}
      <path
        d="M26 28.5L38.5 43"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <rect x="34" y="42.5" width="8" height="2.5" rx="1.25" />
    </svg>
  )
}

export default BowlingMachineIcon
