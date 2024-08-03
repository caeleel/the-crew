import { ReactNode } from 'react'

export function Button({
  children,
  onClick,
  disabled,
  full,
  small,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  full?: boolean
  small?: boolean
}) {
  let sizing = `px-4 py-2`
  if (small) {
    sizing = `px-2 py-1 text-xs`
  }

  return (
    <button
      className={`border border-white bg-white ${disabled ? 'border-gray-300' : 'hover:bg-gray-200'} disabled:bg-slate-50 disabled:cursor-default disabled:text-slate-300 rounded-md ${sizing} cursor-pointer ${full ? 'w-full' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
