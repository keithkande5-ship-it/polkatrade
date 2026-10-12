import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import celebrate from '@/assets/banners/celebrate.jpg'
import football from '@/assets/banners/football.jpg'
import cashout from '@/assets/banners/cashout.jpg'
import athletics from '@/assets/banners/athletics.jpg'

type Slide = { img: string; side: 'left' | 'right'; kicker: string; title: string; sub: string; cta: string; accent: string; ink: string; band: string; action: 'combo' | 'sports' | 'deposit' | 'how' }

const SLIDES: Slide[] = [
  { img: celebrate, side: 'right', kicker: 'Combo Slip', title: 'CHAGUA 3, SHINDA KUBWA', sub: 'Stack up to 10 predictions in one slip from KES 1 each.', cta: 'Build a combo', accent: '#F7D000', ink: '#152B43', band: '#1E3BD1', action: 'combo' },
  { img: football, side: 'right', kicker: 'Mashemeji Derby', title: 'PREDICT THE PITCH', sub: 'FKF Premier League, EPL & AFCON — live odds that move with the crowd.', cta: 'Trade sports', accent: '#2BD67B', ink: '#0B1A12', band: '#0E3B24', action: 'sports' },
  { img: cashout, side: 'left', kicker: 'M-Pesa in seconds', title: 'WEKA, TRADE, TOA', sub: 'Deposit from KES 100. Withdraw winnings straight to your phone.', cta: 'Deposit now', accent: '#152B43', ink: '#F7D000', band: '#E15B36', action: 'deposit' },
  { img: athletics, side: 'right', kicker: 'Athletics · Politics · Culture', title: 'KILA KITU NI MARKET', sub: 'From Kipchoge to Kenya Decides 2027 — call it before it happens.', cta: 'How it works', accent: '#F7D000', ink: '#152B43', band: '#0F6E78', action: 'how' },
]

export function PromoCarousel({ onAction }: { onAction: (a: Slide['action']) => void }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = SLIDES.length
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setI(v => (v + 1) % n), 5000)
    return () => clearInterval(t)
  }, [paused, n])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotions"
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: '1600 / 640', maxHeight: 300 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {SLIDES.map((s, idx) => (
          <div key={s.title} className="relative h-full w-full shrink-0" aria-hidden={idx !== i}>
            <img src={s.img} alt="" width={1600} height={640} loading={idx === 0 ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-cover" />
            <div className={`absolute inset-y-0 ${s.side === 'right' ? 'right-0 items-end text-right' : 'left-0 items-start text-left'} flex w-[62%] sm:w-1/2 flex-col justify-center gap-1.5 sm:gap-2 px-3 sm:px-8`}>
              <span className="px-2 py-0.5 text-[9px] sm:text-[11px] font-700 uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif', background: s.accent, color: s.ink, borderRadius: 2 }}>{s.kicker}</span>
              <h2 className="text-xl sm:text-4xl lg:text-5xl font-800 leading-[0.9] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#fff', textShadow: `3px 3px 0 ${s.band}, 0 4px 18px rgba(0,0,0,0.45)` }}>{s.title}</h2>
              <p className="hidden sm:block text-sm max-w-sm font-500" style={{ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>{s.sub}</p>
              <button
                onClick={() => onAction(s.action)}
                className="mt-1 px-3 sm:px-5 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-800 uppercase tracking-wider active:scale-95 transition-transform"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', background: s.accent, color: s.ink, borderRadius: 3, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
              >{s.cta} →</button>
            </div>
            <span className="absolute bottom-1.5 left-2 text-[8px] sm:text-[9px] font-600 uppercase tracking-wider px-1.5 py-0.5" style={{ color: '#fff', background: 'rgba(0,0,0,0.45)', borderRadius: 2 }}>18+ · Trade responsibly</span>
          </div>
        ))}
      </div>
      <button aria-label="Previous slide" onClick={() => setI(v => (v - 1 + n) % n)} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.35)', color: '#fff' }}><ChevronLeft size={18} /></button>
      <button aria-label="Next slide" onClick={() => setI(v => (v + 1) % n)} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.35)', color: '#fff' }}><ChevronRight size={18} /></button>
      <div className="absolute bottom-2 right-3 flex gap-1.5">
        {SLIDES.map((s, idx) => (
          <button key={s.title} aria-label={`Slide ${idx + 1}`} onClick={() => setI(idx)} className="h-1.5 rounded-full transition-all" style={{ width: idx === i ? 18 : 6, background: idx === i ? '#F7D000' : 'rgba(255,255,255,0.6)' }} />
        ))}
      </div>
    </section>
  )
}
