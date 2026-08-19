'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface PlayerAvatarProps {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  size?: number
  className?: string
}

export default function PlayerAvatar({
  name,
  email,
  avatarUrl,
  size = 36,
  className = '',
}: PlayerAvatarProps) {
  const [imageError, setImageError] = useState(false)

  // Primary profile image path (prefers user-provided avatar or provided pfp.jpeg asset)
  const imageSource = avatarUrl || '/images/pfp.jpeg'

  if (!imageError) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 select-none bg-[#06251D] ${className}`}
        style={{
          width: size,
          height: size,
        }}
      >
        <Image
          src={imageSource}
          alt={name || 'Player'}
          fill
          sizes={`${size}px`}
          priority
          className="object-cover object-center rounded-full"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  // Minimal cinematic two-tone MSC generated fallback
  return (
    <div
      className={`relative rounded-full shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#007A52] to-[#06251D] select-none ${className}`}
      style={{
        width: size,
        height: size,
      }}
      title={name || email || 'MSC Player'}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5 opacity-90"
      >
        <circle cx="20" cy="20" r="16" fill="rgba(0, 168, 107, 0.25)" />
        <path
          d="M20 7L29 11V19.5C29 25.5 25.2 31 20 33C14.8 31 11 25.5 11 19.5V11L20 7Z"
          stroke="#00A86B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M20 13L21.5 17.5H26L22.5 20.2L23.8 24.5L20 22L16.2 24.5L17.5 20.2L14 17.5H18.5L20 13Z"
          fill="#00A86B"
          opacity="0.9"
        />
      </svg>
    </div>
  )
}
