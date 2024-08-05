import { ReactNode } from 'react'
import { Emote, Hint } from './types'
import { send } from './ws'

export function Button({
  children,
  onClick,
  disabled,
  border,
  full,
  small,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  border?: boolean
  full?: boolean
  small?: boolean
}) {
  let sizing = `px-4 py-2`
  if (small) {
    sizing = `px-2 py-1 text-xs`
  }

  return (
    <button
      className={`bg-white ${disabled ? '' : 'hover:bg-slate-200'} ${border ? 'border border-slate-500' : ''} disabled:opacity-30 disabled:cursor-default disabled:text-slate-400 rounded-md ${sizing} cursor-pointer ${full ? 'w-full' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function SignalButton({
  pendingSignal,
  signaling,
  canSignal,
  startSignaling,
  cancelSignal,
}: {
  pendingSignal: Hint | null
  signaling: boolean
  canSignal: boolean
  startSignaling: () => void
  cancelSignal: () => void
}) {
  const status = pendingSignal
    ? 'Pending signal...'
    : signaling
      ? 'Signal a card...'
      : ''

  return (
    <>
      {status && canSignal && (
        <div className="text-sm text-slate-400">{status}</div>
      )}
      <Button
        small
        border
        disabled={!canSignal}
        onClick={() => {
          if (signaling || pendingSignal) {
            cancelSignal()
          } else {
            startSignaling()
          }
        }}
      >
        {canSignal
          ? signaling || pendingSignal
            ? 'Cancel'
            : 'Signal'
          : 'Signal used'}
      </Button>
    </>
  )
}

export const emotes = {
  distress: "I'm distressed...",
  winnable: "It's winnable",
  trust: 'Trust trust',
}

export function EmoteButton({ emote }: { emote: Emote }) {
  return (
    <Button
      small
      onClick={() => {
        send({
          type: 'move',
          move: `e:${emote}`,
        })
      }}
    >
      <span className="italic text-slate-400">{emotes[emote]}</span>
    </Button>
  )
}
