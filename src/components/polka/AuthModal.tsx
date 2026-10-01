import { useState } from 'react'
import { X, Chrome } from 'lucide-react'

const BV_DK = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'
const BV_IN = '0 1px 3px rgba(21,43,67,0.10) inset, 0 1px 0 rgba(255,255,255,0.40)'
const NAVY = '#152B43'
const TEAL = '#1A5C52'
const TEAL_L = '#2A7B6F'

export type AuthResult = { name: string; email: string; phone: string }

export function AuthModal({ reason, onClose, onSuccess }: {
  reason?: string | undefined
  onClose: () => void
  onSuccess: (profile: AuthResult) => void
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const digits = phone.replace(/\D/g, '')
  const phoneOk = /^254\d{9}$/.test(digits)
  const emailOk = /\S+@\S+\.\S+/.test(email)
  const valid = emailOk && password.length >= 6 && phoneOk && (mode === 'signin' || name.trim().length > 1)

  const submit = () => {
    if (!valid) return
    onSuccess({ name: name.trim() || email.split('@')[0] || 'Trader', email, phone: digits })
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: `${NAVY}60` }} onClick={onClose}>
      <div className="w-full sm:max-w-sm overflow-hidden" style={{ background: '#fff', borderRadius: 4, border: `1px solid ${TEAL}33`, boxShadow: '0 24px 64px rgba(21,43,67,0.22)' }} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-5" style={{ background: TEAL, boxShadow: BV_DK }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest font-600 text-white/50">POLKA<span style={{ color: '#F7D000' }}>.TRADE</span></div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-xl font-700 text-white mt-1">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</div>
              <div className="text-white/60 text-xs mt-0.5">{reason ?? (mode === 'signin' ? 'Sign in to trade' : 'Start predicting in minutes')}</div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex mt-4 p-0.5" style={{ borderRadius: 4, background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: mode === m ? BV_DK : 'none', background: mode === m ? '#fff' : 'transparent', color: mode === m ? TEAL : 'rgba(255,255,255,0.6)' }} className="flex-1 py-1.5 text-sm font-700 uppercase tracking-wider transition-all">
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-3" style={{ background: '#FAFDFB' }}>
          <button
            onClick={() => onSuccess({ name: 'Google User', email: 'google.user@gmail.com', phone: digits })}
            style={{ color: NAVY, borderRadius: 3, border: `1.5px solid ${TEAL}33`, boxShadow: BV_IN }}
            className="w-full py-2.5 text-sm font-600 bg-white hover:bg-[#E8F2F0] transition-colors flex items-center justify-center gap-2"
          >
            <Chrome size={16} style={{ color: TEAL_L }} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="font-700 uppercase tracking-wider">Continue with Google</span>
          </button>
          <div className="flex items-center gap-2"><div className="flex-1 h-px bg-gray-200" /><span className="text-[10px] text-gray-400 uppercase tracking-wider">or</span><div className="flex-1 h-px bg-gray-200" /></div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Njeri Kamau" className="w-full border px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BV_IN, background: '#fff', color: NAVY }} />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="w-full border px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BV_IN, background: '#fff', color: NAVY, fontFamily: 'Geist Mono, monospace' }} />
          </div>
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full border px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BV_IN, background: '#fff', color: NAVY, fontFamily: 'Geist Mono, monospace' }} />
          </div>
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Safaricom M-PESA Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="254712345678" inputMode="numeric" className="w-full border px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BV_IN, background: '#fff', color: NAVY, fontFamily: 'Geist Mono, monospace' }} />
            {phone.length > 0 && !phoneOk && <p className="text-[10px] mt-1" style={{ color: '#8B1A1A' }}>Use the format 254XXXXXXXXX.</p>}
          </div>

          <button onClick={submit} disabled={!valid} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: TEAL, boxShadow: BV_DK }} className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-40 mt-1">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
          <p className="text-[10px] text-gray-400 text-center leading-relaxed pt-1">18+ only · Prediction market, not a bookmaker · Participate responsibly</p>
        </div>
      </div>
    </div>
  )
}
