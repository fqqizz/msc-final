import React from 'react'

type TwoColorHeadingProps = {
  primaryText: string
  accentText: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4'
  className?: string
  accentPosition?: 'suffix' | 'prefix'
}

export function TwoColorHeading({
  primaryText,
  accentText,
  tag = 'h2',
  className = '',
  accentPosition = 'suffix',
}: TwoColorHeadingProps) {
  const Tag = tag

  return (
    <Tag className={`font-display font-bold tracking-tight text-slate-900 ${className}`}>
      {accentPosition === 'prefix' ? (
        <>
          <span className="text-emerald-600">{accentText}</span>{' '}
          <span className="text-slate-900">{primaryText}</span>
        </>
      ) : (
        <>
          <span className="text-slate-900">{primaryText}</span>{' '}
          <span className="text-emerald-600">{accentText}</span>
        </>
      )}
    </Tag>
  )
}
