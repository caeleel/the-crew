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
      className={`bg-white ${disabled ? '' : 'hover:bg-slate-200'} disabled:opacity-30 disabled:cursor-default disabled:text-slate-400 rounded-md ${sizing} cursor-pointer ${full ? 'w-full' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
