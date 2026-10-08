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

// ─── Mobile trade drawer ──────────────────────────────────────────────────────

export const DRAWER_STAKES = [50, 100, 250, 500]

type DrawerProps = {
  market: Market
  initialPosition?: string | undefined
  onClose: () => void
  onConfirm: (position: string, odds: number, amount: number) => void
  onAddToSlip?: ((position: string, odds: number) => void) | undefined
}

/** Slide-up drawer used by the mobile sticky trade bar in market details. */
export function TradeDrawer({ market, initialPosition, onClose, onConfirm, onAddToSlip }: DrawerProps) {
  const options = market.outcomes?.length
    ? market.outcomes.map(o => ({ label: o.label, odds: o.odds, color: o.color }))
    : [{ label: 'YES', odds: market.yesOdds, color: NAVY }, { label: 'NO', odds: market.noOdds, color: ORANGE }]
  const [position, setPosition] = useState(initialPosition ?? options[0]!.label)
  const [stake, setStake] = useState(100)
  const [toSlip, setToSlip] = useState(false)
  const odds = options.find(o => o.label === position)?.odds ?? 50
  const potential = Math.round(estimatePayout(stake, odds))

  return (
    <div className="fixed inset-0 z-[80] flex items-end" style={{ background: `${NAVY}70` }} onClick={onClose}>
      <div
        className="w-full max-h-[85dvh] overflow-y-auto"
        style={{ background: WARM, borderTopLeftRadius: 8, borderTopRightRadius: 8, boxShadow: '0 -12px 40px rgba(21,43,67,0.25)', animation: 'polkaDrawerUp 0.22s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{'@keyframes polkaDrawerUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'}</style>
        <div className="flex items-center gap-2 px-4 py-3" style={{ background: NAVY, boxShadow: BV_DK, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          <span className="text-[13px] text-white/80 flex-1 min-w-0 truncate">{market.question}</span>
          <button onClick={onClose} aria-label="Close trade" className="text-white/60 hover:text-white shrink-0"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-600 mb-1.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}50` }}>Selected outcome</div>
            <div className="flex flex-wrap gap-1.5">
              {options.map(o => (
                <button
                  key={o.label}
                  onClick={() => setPosition(o.label)}
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: position === o.label ? o.color : WARM, color: position === o.label ? '#fff' : NAVY, border: `1.5px solid ${position === o.label ? o.color : NAVY + '22'}`, boxShadow: position === o.label ? BV_DK : BV_IN }}
                  className="flex-1 min-w-[30%] px-3 py-2.5 text-sm font-700 uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  {o.label} · <OddsNumber value={o.odds} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest font-600 mb-1.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}50` }}>Stake</div>
            <div className="grid grid-cols-4 gap-1.5">
              {DRAWER_STAKES.map(a => (
                <button
                  key={a}
                  onClick={() => setStake(a)}
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: stake === a ? NAVY : WARM, color: stake === a ? WARM : `${NAVY}80`, border: `1px solid ${stake === a ? NAVY : NAVY + '22'}`, boxShadow: stake === a ? BV_DK : BV_IN }}
                  className="py-2.5 text-sm font-700 active:scale-95 transition-all"
                >
                  KES {a}
                </button>
              ))}
            </div>
          </div>

          <div className="border p-3 flex items-end justify-between gap-3" style={{ background: '#EBF7EE', borderColor: '#2A6B3A33', borderRadius: 3 }}>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#2A6B3A' }}>Potential return</div>
              <div className="text-3xl font-800 leading-none mt-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#1F6B45' }}>{formatKES(potential)}</div>
            </div>
            <div className="text-right text-[11px] shrink-0" style={{ color: `${NAVY}55` }}>Stake {formatKES(stake)}</div>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: `${NAVY}45` }}>Estimate only — parimutuel payout depends on the winning pool at resolution.</p>

          {onAddToSlip && (
            <label className="flex items-center justify-between gap-3 text-sm py-1" style={{ color: NAVY }}>
              <span>Stage in combo slip instead</span>
              <input type="checkbox" checked={toSlip} onChange={e => setToSlip(e.target.checked)} className="w-5 h-5 accent-[#2A7B6F]" />
            </label>
          )}
          <button
            onClick={() => toSlip && onAddToSlip ? onAddToSlip(position, odds) : onConfirm(position, odds, stake)}
            style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: ORANGE, boxShadow: BV_DK }}
            className="w-full py-4 text-base font-800 uppercase tracking-wider text-white hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Check size={18} /> {toSlip ? 'Add to Slip' : 'Confirm Trade'}
          </button>
        </div>
      </div>
    </div>
  )
}
