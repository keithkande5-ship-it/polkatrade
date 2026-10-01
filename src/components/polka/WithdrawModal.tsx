import { useState } from 'react'
import { X, Smartphone } from 'lucide-react'
import { formatKES, getWithdrawalFee } from './utils'

const BV_DK = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'
const BV_IN = '0 1px 3px rgba(21,43,67,0.10) inset, 0 1px 0 rgba(255,255,255,0.40)'
const BV_UP = '0 1px 0 rgba(255,255,255,0.55) inset, 0 -1px 0 rgba(0,0,0,0.10) inset'
const NAVY = '#152B43'
const WARM = '#FAF9F6'
const MINERAL = '#F2F0EA'

export function WithdrawModal({ balance, onClose, onWithdraw }: {
  balance: number
  onClose: () => void
  onWithdraw: (amount: number, phone: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('+254 712 345 678')
  const PRESETS = [500, 1000, 2500, 5000]
  const value = Number(amount)
  const fee = value > 0 ? getWithdrawalFee(value) : 0
  const net = Math.max(0, value - fee)
  const tooMuch = value + fee > balance
  const tooSmall = value > 0 && value < 100
  const valid = value >= 100 && !tooMuch && phone.replace(/\D/g, '').length >= 9

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: `${NAVY}60` }} onClick={onClose}>
      <div className="w-full sm:max-w-sm overflow-hidden" style={{ background: WARM, borderRadius: 4, border: `1px solid ${NAVY}18`, boxShadow: '0 24px 64px rgba(21,43,67,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-4 flex items-center justify-between" style={{ background: NAVY, boxShadow: BV_DK }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Wallet</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-lg font-700 text-white mt-0.5">Withdraw to M-PESA</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-between text-xs">
            <span style={{ color: `${NAVY}50` }}>Available</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="font-700">{formatKES(balance)}</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setAmount(String(p))}
                disabled={p > balance}
                style={{ borderRadius: 3, boxShadow: amount === String(p) ? BV_DK : BV_UP, background: amount === String(p) ? NAVY : WARM, color: amount === String(p) ? WARM : NAVY, border: `1px solid ${NAVY}${amount === String(p) ? 'ff' : '18'}`, fontFamily: 'Barlow Condensed, sans-serif' }}
                className="px-3 py-1.5 text-sm font-700 transition-all disabled:opacity-30"
              >
                {formatKES(p)}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-600 pointer-events-none" style={{ color: `${NAVY}45` }}>KES</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
              className="w-full border pl-10 pr-3 py-3 text-sm outline-none"
              style={{ borderRadius: 3, fontFamily: 'Geist Mono, monospace', boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}20` }} />
          </div>

          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>M-PESA Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full border px-3 py-2.5 text-sm outline-none"
              style={{ borderRadius: 3, fontFamily: 'Geist Mono, monospace', boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}20` }} />
          </div>

          {value > 0 && (
            <div className="space-y-1.5 border px-3 py-2.5" style={{ borderRadius: 3, background: MINERAL, borderColor: `${NAVY}15`, boxShadow: BV_IN }}>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: `${NAVY}55` }}>Fee</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="font-700">{formatKES(fee)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: `${NAVY}70` }} className="font-600">Net M-Pesa Payout</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', color: '#2A6B3A' }} className="font-700">{formatKES(net)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: `${NAVY}40` }}>Total deducted</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', color: `${NAVY}55` }}>{formatKES(value + fee)}</span>
              </div>
            </div>
          )}

          {tooMuch && <p className="text-[11px]" style={{ color: '#8B1A1A' }}>Amount plus fee is higher than your available balance.</p>}
          {tooSmall && <p className="text-[11px]" style={{ color: '#8B1A1A' }}>Minimum withdrawal is KES 100.</p>}

          <button
            onClick={() => { if (valid) { onWithdraw(value, phone); onClose() } }}
            disabled={!valid}
            style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#8B4A1A', boxShadow: BV_DK }}
            className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Smartphone size={15} /> Withdraw
          </button>
          <p className="text-[10px] text-center" style={{ color: `${NAVY}35` }}>Withdrawals are queued as pending until the M-PESA payout confirms.</p>
        </div>
      </div>
    </div>
  )
}
