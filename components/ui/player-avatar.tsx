'use client'

import React from 'react'
import Image from 'next/image'

interface PlayerAvatarProps {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  size?: number
  className?: string
}

// Deterministic color variation based on name/email
const PALETTES = [
  { bg: 'from-[#007A52] to-[#005C43]', accent: '#00A86B', iconBg: 'rgba(0, 168, 107, 0.25)' },
  { bg: 'from-[#005C43] to-[#06251D]', accent: '#34D399', iconBg: 'rgba(52, 211, 153, 0.25)' },
  { bg: 'from-[#06251D] to-[#101412]', accent: '#6EE7B7', iconBg: 'rgba(110, 231, 183, 0.25)' },
  { bg: 'from-[#082F24] to-[#004D36]', accent: '#10B981', iconBg: 'rgba(16, 185, 129, 0.25)' },
]

export default function PlayerAvatar({
  name,
  email,
  avatarUrl,
  size = 36,
  className = '',
}: PlayerAvatarProps) {
  if (avatarUrl) {
    return (
      <div
        className={`relative rounded-full overflow-hidden border border-emerald-500/30 shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image src={avatarUrl} alt={name || 'Player'} fill className="object-cover" />
      </div>
    )
  }

  // Deterministic seed
  const identifier = (name || email || 'MSC Player').trim()
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  const paletteIndex = Math.abs(hash) % PALETTES.length
  const palette = PALETTES[paletteIndex]

  return (
    <div
      className={`relative rounded-full shrink-0 flex items-center justify-center overflow-hidden border border-emerald-500/30 bg-gradient-to-br ${palette.bg} shadow-xs select-none ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: '0 2px 8px rgba(0, 37, 29, 0.35)',
      }}
      title={identifier}
    >
      {/* Subtle athletic geometric vector emblem */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5 opacity-90"
      >
        {/* Soft radial background gleam */}
        <circle cx="20" cy="20" r="16" fill={palette.iconBg} />
        {/* Sleek MSC Shield / Crest Motif */}
        <path
          d="M20 7L29 11V19.5C29 25.5 25.2 31 20 33C14.8 31 11 25.5 11 19.5V11L20 7Z"
          stroke={palette.accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Inner geometric sports star / velocity mark */}
        <path
          d="M20 13L21.5 17.5H26L22.5 20.2L23.8 24.5L20 22L16.2 24.5L17.5 20.2L14 17.5H18.5L20 13Z"
          fill={palette.accent}
          opacity="0.9"
        />
      </svg>
    </div>
  )
}
