import { useEffect, useState } from 'react'
import { X, Smartphone, Pencil, Loader2, CheckCircle2 } from 'lucide-react'
import { formatKES } from './utils'

const BV_DK = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'
const BV_IN = '0 1px 3px rgba(21,43,67,0.10) inset, 0 1px 0 rgba(255,255,255,0.40)'
const BV_UP = '0 1px 0 rgba(255,255,255,0.55) inset, 0 -1px 0 rgba(0,0,0,0.10) inset'
const NAVY = '#152B43'
const WARM = '#FAF9F6'
const MINERAL = '#F2F0EA'
const GREEN = '#2A7B6F'

const PRESETS = [100, 250, 500, 1000, 2500]

export function DepositModal({ savedPhone, onClose, onDeposit }: {
  savedPhone?: string | undefined
  onClose: () => void
  onDeposit: (amount: number, phone: string) => void
}) {
  const [stage, setStage] = useState<'input' | 'push_pending' | 'success'>('input')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState(savedPhone ?? '')
  const [editPhone, setEditPhone] = useState(!savedPhone)
  const [seconds, setSeconds] = useState(60)

  const value = Number(amount)
  const digits = phone.replace(/\D/g, '')
  const tooSmall = value > 0 && value < 100
  const valid = value >= 100 && digits.length >= 9

  useEffect(() => {
    if (stage !== 'push_pending') return
    const t = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [stage])

  const verify = () => {
    onDeposit(value, phone)
    setStage('success')
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: `${NAVY}60` }} onClick={onClose}>
      <div className="w-full sm:max-w-sm overflow-hidden" style={{ background: WARM, borderRadius: 4, border: `1px solid ${NAVY}18`, boxShadow: '0 24px 64px rgba(21,43,67,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-4 flex items-center justify-between" style={{ background: NAVY, boxShadow: BV_DK }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Wallet</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-lg font-700 text-white mt-0.5">
              {stage === 'input' ? 'Deposit via M-PESA' : stage === 'push_pending' ? 'Confirm on your phone' : 'Deposit received'}
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        {stage === 'input' && (
          <div className="p-5 space-y-4">
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  style={{ borderRadius: 3, boxShadow: amount === String(p) ? BV_DK : BV_UP, background: amount === String(p) ? NAVY : WARM, color: amount === String(p) ? WARM : NAVY, border: `1px solid ${NAVY}${amount === String(p) ? 'ff' : '18'}`, fontFamily: 'Barlow Condensed, sans-serif' }}
                  className="px-3 py-1.5 text-sm font-700 transition-all"
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
              {editPhone ? (
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="254712345678"
                  className="w-full border px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: 3, fontFamily: 'Geist Mono, monospace', boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}20` }} />
              ) : (
                <div className="flex items-center justify-between border px-3 py-2.5" style={{ borderRadius: 3, boxShadow: BV_IN, background: MINERAL, borderColor: `${NAVY}20` }}>
                  <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-sm font-700">{phone}</span>
                  <button onClick={() => setEditPhone(true)} className="flex items-center gap-1 text-[11px] font-600" style={{ color: GREEN }}>
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              )}
            </div>

            {tooSmall && <p className="text-[11px]" style={{ color: '#8B1A1A' }}>Minimum deposit is KES 100.</p>}

            <button
              onClick={() => { if (valid) { setSeconds(60); setStage('push_pending') } }}
              disabled={!valid}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: GREEN, boxShadow: BV_DK }}
              className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Smartphone size={15} /> Deposit {value >= 100 ? formatKES(value) : ''}
            </button>
            <p className="text-[10px] text-center" style={{ color: `${NAVY}35` }}>You will receive an M-PESA STK push to confirm.</p>
          </div>
        )}

        {stage === 'push_pending' && (
          <div className="p-5 space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#2A9D4A' }} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-sm font-700 uppercase tracking-wider">Awaiting your M-PESA PIN</span>
            </div>
            <div style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-2xl font-700">{formatKES(value)}</div>
            <div className="text-xs" style={{ color: `${NAVY}55` }}>
              Sent to <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="font-700">{phone}</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 size={16} className="animate-spin" style={{ color: GREEN }} />
              <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-sm font-700">
                {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
              </span>
            </div>
            <button
              onClick={verify}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: GREEN, boxShadow: BV_DK }}
              className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all"
            >
              Already entered PIN? Verify Payment
            </button>
            <button onClick={() => setStage('input')} className="text-[11px] hover:underline" style={{ color: `${NAVY}50` }}>Change amount</button>
          </div>
        )}

        {stage === 'success' && (
          <div className="p-6 space-y-3 text-center">
            <CheckCircle2 size={40} className="mx-auto" style={{ color: '#2A9D4A' }} />
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-lg font-700 uppercase tracking-wide">Deposit confirmed</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', color: '#2A6B3A' }} className="text-2xl font-700">+{formatKES(value)}</div>
            <p className="text-[11px]" style={{ color: `${NAVY}45` }}>Your balance and ledger have been updated.</p>
            <button onClick={onClose} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: NAVY, boxShadow: BV_DK }} className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
