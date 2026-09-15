import { useEffect, useState } from 'react'
import { X, Link2, Check } from 'lucide-react'
import type { Market } from './types'
import { estimatePayout, formatKES } from './utils'
import { OddsNumber } from './display'

const BV_DK = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'
const BV_IN = '0 1px 3px rgba(21,43,67,0.10) inset, 0 1px 0 rgba(255,255,255,0.40)'
const NAVY = '#152B43'
const ORANGE = '#E15B36'
const WARM = '#FAF9F6'

export const QUICK_AMOUNTS = [99, 199, 999, 9999]

export type PendingTrade = { market: Market; position: string; odds: number }

type Props = {
  pending: PendingTrade
  onClose: () => void
  onConfirm: (amount: number) => void
  onAddToCombo: (amount: number) => void
  inCombo: boolean
}

/** Floating trade bar — lets you trade straight from the feed, no modal required. */
export function TradeBar({ pending, onClose, onConfirm, onAddToCombo, inCombo }: Props) {
  const [amount, setAmount] = useState(99)
  useEffect(() => { setAmount(99) }, [pending.market.id, pending.position])

  const payout = estimatePayout(amount, pending.odds)

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-[70] sm:left-auto sm:right-4 sm:bottom-4 sm:w-[420px]"
      style={{ animation: 'polkaToast 0.001s', pointerEvents: 'auto' }}
    >
      <div
        className="mx-0 sm:mx-0 border-t sm:border"
        style={{ background: WARM, borderColor: `${NAVY}22`, borderRadius: 0, boxShadow: '0 -8px 28px rgba(21,43,67,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: NAVY, boxShadow: BV_DK }}>
          <span className="px-2 py-0.5 text-[11px] font-700 text-white shrink-0" style={{ background: ORANGE, borderRadius: 2, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {pending.position}
          </span>
          <OddsNumber value={pending.odds} className="text-[11px] font-700" style={{ fontFamily: 'Geist Mono, monospace', color: '#F7D000' }} />
          <span className="text-[11px] truncate text-white/60 flex-1">{pending.market.question}</span>
          <button onClick={onClose} className="text-white/50 hover:text-white shrink-0"><X size={16} /></button>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Quick amounts */}
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3,
                  background: amount === a ? NAVY : WARM, color: amount === a ? WARM : `${NAVY}70`,
                  border: `1px solid ${amount === a ? NAVY : NAVY + '20'}`, boxShadow: amount === a ? BV_DK : BV_IN,
                }}
                className="px-3 py-2 text-sm font-700 transition-all active:scale-95"
              >
                {a.toLocaleString()}
              </button>
            ))}
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-24 border px-2 py-2 text-sm outline-none"
              style={{ borderRadius: 3, fontFamily: 'Geist Mono, monospace', boxShadow: BV_IN, background: WARM, color: NAVY, borderColor: `${NAVY}20` }}
            />
          </div>

          {/* Estimated win — large */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }}>Estimated win</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#1F6B45' }} className="text-3xl font-700 leading-none mt-0.5">
                {formatKES(Math.round(payout))}
              </div>
              <div className="text-[10px] mt-1" style={{ color: `${NAVY}35` }}>Estimate — parimutuel, final payout depends on the winning pool</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }}>Amount</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-base font-700">{formatKES(amount)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onConfirm(amount)}
              disabled={amount <= 0}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: ORANGE, boxShadow: BV_DK }}
              className="flex-1 py-3 text-sm font-800 uppercase tracking-wider text-white hover:brightness-110 transition-all active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check size={16} /> Confirm prediction
            </button>
            <button
              onClick={() => onAddToCombo(amount)}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: inCombo ? '#4C0F8F' : '#6B21A8', boxShadow: BV_DK }}
              className="px-3 py-3 text-xs font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Link2 size={14} /> {inCombo ? 'In combo' : 'Add to combo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
