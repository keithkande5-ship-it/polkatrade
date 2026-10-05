import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  LayoutGrid, MapPin, Trophy, Landmark, Bitcoin, Film, TrendingUp, FlaskConical, Globe,
  Twitter, Music2, Instagram, Hash, ListOrdered, BarChart3, Wallet, User, Settings, Bell,
  Languages, Plus, CheckCircle2, XCircle, Link2, Sparkles, Gavel, Lock,
} from 'lucide-react'
import type { CategoryId, CustomCategory, Market } from './types'
import { MARKETS } from './data'

/* ── Category / nav icons (lucide) ─────────────────────────────────────────── */

export function CatIcon({ id, size = 13 }: { id: CategoryId; size?: number }) {
  const p = { size, strokeWidth: 2 }
  switch (id) {
    case 'All': return <LayoutGrid {...p} />
    case 'Kenya': return <MapPin {...p} />
    case 'Sports': return <Trophy {...p} />
    case 'Politics': return <Landmark {...p} />
    case 'Crypto': return <Bitcoin {...p} />
    case 'Entertainment': return <Film {...p} />
    case 'Business': return <TrendingUp {...p} />
    case 'Science': return <FlaskConical {...p} />
    case 'Global': return <Globe {...p} />
    case 'Twitter': return <Twitter {...p} />
    case 'TikTok': return <Music2 {...p} />
    case 'Instagram': return <Instagram {...p} />
    case 'my': return <User {...p} />
    case 'closed': return <Lock {...p} />
    case 'resolved': return <CheckCircle2 {...p} />
    case 'disputed': return <Gavel {...p} />
    default: return <Hash {...p} />
  }
}

export function catIconFor(id: CategoryId, custom: CustomCategory[], size = 13) {
  const isCustom = custom.some(c => c.id === id)
  return <CatIcon id={isCustom ? 'custom' : id} size={size} />
}

export const NavIcons = {
  markets: ListOrdered, portfolio: BarChart3, leaderboard: Trophy, wallet: Wallet,
  profile: User, account: Settings, settings: Settings, notifications: Bell,
  language: Languages, create: Plus, won: CheckCircle2, lost: XCircle, combo: Link2,
  spark: Sparkles,
}

/* ── Odds format (percentage ↔ multiplier) ─────────────────────────────────── */

type OddsMode = 'percent' | 'multiplier'
const OddsCtx = createContext<{ mode: OddsMode; toggle: () => void }>({ mode: 'percent', toggle: () => {} })

export function OddsProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<OddsMode>('percent')
  const toggle = useCallback(() => setMode(m => (m === 'percent' ? 'multiplier' : 'percent')), [])
  return <OddsCtx.Provider value={{ mode, toggle }}>{children}</OddsCtx.Provider>
}

export function useOddsMode() { return useContext(OddsCtx) }

export function fmtOdds(pct: number, mode: OddsMode): string {
  if (mode === 'percent') return `${Math.round(pct)}%`
  return `${(100 / Math.max(pct, 1)).toFixed(2)}x`
}

export function OddsToggle({ color = '#F7D000' }: { color?: string }) {
  const { mode, toggle } = useOddsMode()
  return (
    <button
      onClick={toggle}
      title="Switch between percentage and odds multiplier"
      style={{ fontFamily: 'Geist Mono, monospace', borderRadius: 3, border: '1px solid rgba(255,255,255,0.2)', color, background: 'rgba(255,255,255,0.06)' }}
      className="px-1.5 py-1 text-[10px] font-700 leading-none hover:brightness-125 transition-all active:scale-95 shrink-0"
    >
      {mode === 'percent' ? '%' : '1.x'}
    </button>
  )
}

/* ── Rolling odometer number ──────────────────────────────────────────────── */

export function FlipNumber({ value, className, style }: { value: string | number; className?: string | undefined; style?: React.CSSProperties | undefined }) {
  const text = String(value)
  const [shown, setShown] = useState(text)
  const [previous, setPrevious] = useState(text)
  const [rolling, setRolling] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (text === shown) return
    setDirection(Number.parseFloat(text.replace(/[^\d.-]/g, '')) >= Number.parseFloat(shown.replace(/[^\d.-]/g, '')) ? 1 : -1)
    setPrevious(shown)
    setShown(text)
    setRolling(false)
    frame.current = requestAnimationFrame(() => { frame.current = requestAnimationFrame(() => setRolling(true)) })
    const timer = window.setTimeout(() => setPrevious(text), 310)
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); window.clearTimeout(timer) }
  }, [text, shown])

  const width = Math.max(previous.length, shown.length)
  const oldChars = previous.padStart(width, ' ')
  const newChars = shown.padStart(width, ' ')
  return (
    <span className={className} aria-label={shown} style={{ display: 'inline-flex', whiteSpace: 'pre', ...style }}>
      {Array.from({ length: width }, (_, index) => {
        const oldChar = oldChars[index] ?? ' '
        const newChar = newChars[index] ?? ' '
        if (oldChar === newChar || previous === shown) return <span key={`${index}-${newChar}`}>{newChar}</span>
        const chars = direction === 1 ? [oldChar, newChar] : [newChar, oldChar]
        const transform = direction === 1 ? (rolling ? 'translateY(-50%)' : 'translateY(0)') : (rolling ? 'translateY(0)' : 'translateY(-50%)')
        return (
          <span key={index} aria-hidden="true" style={{ display: 'inline-block', height: '1em', lineHeight: '1em', overflow: 'hidden' }}>
            <span style={{ display: 'flex', flexDirection: 'column', transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)', transform }}>
              <span style={{ height: '1em', lineHeight: '1em' }}>{chars[0]}</span>
              <span style={{ height: '1em', lineHeight: '1em' }}>{chars[1]}</span>
            </span>
          </span>
        )
      })}
    </span>
  )
}

export function OddsNumber({ value, className, style }: { value: number; className?: string | undefined; style?: React.CSSProperties | undefined }) {
  const { mode } = useOddsMode()
  return <FlipNumber value={fmtOdds(value, mode)} className={className} style={style} />
}

/* ── Live market movement (demo activity) ─────────────────────────────────── */

type LiveState = { yesOdds: number; noOdds: number; volume: number; participants: number }
type Add = { id: number; amount: number }

const LiveCtx = createContext<{
  live: Record<number, LiveState>
  adds: Record<number, Add[]>
  bump: (id: number, dir: 1 | -1, amount: number) => void
}>({ live: {}, adds: {}, bump: () => {} })

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [live, setLive] = useState<Record<number, LiveState>>(() =>
    Object.fromEntries(MARKETS.map(m => [m.id, { yesOdds: m.yesOdds, noOdds: m.noOdds, volume: m.volume, participants: m.participants }])),
  )
  const [adds, setAdds] = useState<Record<number, Add[]>>({})

  const pushAdd = useCallback((id: number, amount: number) => {
    const addId = Date.now() + Math.random()
    setAdds(s => ({ ...s, [id]: [...(s[id] ?? []), { id: addId, amount }] }))
    setTimeout(() => setAdds(s => ({ ...s, [id]: (s[id] ?? []).filter(a => a.id !== addId) })), 2200)
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const pool = MARKETS.filter(m => !m.isResolved)
    const tick = () => {
      const m = pool[Math.floor(Math.random() * pool.length)]
      if (m) {
        const amount = [50, 120, 250, 500, 1200, 2500, 5000][Math.floor(Math.random() * 7)]!
        const dir = Math.random() < 0.5 ? -1 : 1
        setLive(s => {
          const cur = s[m.id]
          if (!cur) return s
          const yes = Math.min(96, Math.max(4, cur.yesOdds + dir))
          return { ...s, [m.id]: { yesOdds: yes, noOdds: 100 - yes, volume: cur.volume + amount, participants: cur.participants + (Math.random() < 0.4 ? 1 : 0) } }
        })
        pushAdd(m.id, amount)
      }
      timer = setTimeout(tick, 1400 + Math.random() * 2000)
    }
    timer = setTimeout(tick, 1200)
    return () => clearTimeout(timer)
  }, [pushAdd])

  const bump = useCallback((id: number, dir: 1 | -1, amount: number) => {
    setLive(s => {
      const cur = s[id]
      if (!cur) return s
      const yes = Math.min(96, Math.max(4, cur.yesOdds + dir * 2))
      return { ...s, [id]: { ...cur, yesOdds: yes, noOdds: 100 - yes, volume: cur.volume + amount, participants: cur.participants + 1 } }
    })
    pushAdd(id, amount)
  }, [pushAdd])

  return <LiveCtx.Provider value={{ live, adds, bump }}>{children}</LiveCtx.Provider>
}

export function useLive() { return useContext(LiveCtx) }

/** Market merged with its live (demo) movement. */
export function useLiveMarket(m: Market): Market {
  const { live } = useLive()
  const l = live[m.id]
  if (!l || m.isResolved) return m
  return { ...m, yesOdds: l.yesOdds, noOdds: l.noOdds, volume: l.volume, participants: l.participants }
}

/** Floating combat text — tiny grey amounts drifting up from the volume counter. */
export function VolumeFCT({ marketId }: { marketId: number }) {
  const { adds } = useLive()
  const list = adds[marketId] ?? []
  return (
    <span className="relative inline-block align-middle" style={{ width: 0, height: 12 }}>
      {list.map((a, i) => (
        <span
          key={a.id}
          className="absolute whitespace-nowrap"
          style={{
            left: 4, bottom: 0, fontFamily: 'Geist Mono, monospace', fontSize: 9,
            color: 'rgba(21,43,67,0.35)', animation: 'polkaFct 2.2s ease-out forwards',
            animationDelay: `${i * 60}ms`,
          }}
        >
          +{a.amount.toLocaleString()}
        </span>
      ))}
    </span>
  )
}

/* ── Toasts ───────────────────────────────────────────────────────────────── */

type Toast = { id: number; message: string; kind: 'success' | 'info' | 'warn' }
const ToastCtx = createContext<{ push: (message: string, kind?: Toast['kind']) => void }>({ push: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, message, kind }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-8 z-[90] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3,
              background: t.kind === 'success' ? '#1F6B45' : t.kind === 'warn' ? '#8B4A1A' : '#152B43',
              boxShadow: '0 8px 24px rgba(21,43,67,0.28)', animation: 'polkaToast 2.6s ease forwards',
            }}
            className="px-3.5 py-2 text-xs font-700 uppercase tracking-wider text-white"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToasts() { return useContext(ToastCtx) }

/* ── Market status ────────────────────────────────────────────────────────── */

export type MarketStatus = 'resolved' | 'closed' | 'closing' | 'live' | 'new'

export function marketStatus(m: Market): MarketStatus {
  if (m.isResolved) return 'resolved'
  const end = Date.parse(m.endsAt)
  const now = Date.now()
  if (!Number.isNaN(end)) {
    if (end < now) return 'closed'
    if (end - now < 7 * 24 * 3600 * 1000) return 'closing'
  }
  if (m.isLive) return 'live'
  if (m.volume < 200_000) return 'new'
  return 'live'
}

const STATUS_STYLE: Record<MarketStatus, { label: string; bg: string; fg: string }> = {
  new:      { label: 'New',      bg: '#1F4FA8', fg: '#FFFFFF' },
  closing:  { label: 'Closing',  bg: '#E15B36', fg: '#FFFFFF' },
  closed:   { label: 'Closed',   bg: '#6B6B5C', fg: '#FFFFFF' },
  resolved: { label: 'Paid',     bg: '#1F6B45', fg: '#FFFFFF' },
  live:     { label: 'Live',     bg: '#152B43', fg: '#FFFFFF' },
}

export function StatusPill({ market }: { market: Market }) {
  const s = STATUS_STYLE[marketStatus(market)]
  return (
    <span
      style={{ background: s.bg, color: s.fg, borderRadius: 2, fontFamily: 'Barlow Condensed, sans-serif' }}
      className="px-1.5 py-0.5 text-[9px] font-700 uppercase tracking-widest shrink-0"
    >
      {s.label}
    </span>
  )
}

/* ── Keyframes injected once ───────────────────────────────────────────────── */

export function DisplayKeyframes() {
  return (
    <style>{`
@keyframes polkaFct { 0% { opacity: 0; transform: translateY(4px) } 15% { opacity: 1 } 70% { opacity: 1; transform: translateY(-10px) } 100% { opacity: 0; transform: translateY(-18px) } }
@keyframes polkaToast { 0% { opacity: 0; transform: translateY(8px) } 10% { opacity: 1; transform: translateY(0) } 85% { opacity: 1 } 100% { opacity: 0; transform: translateY(-6px) } }
@keyframes polkaRevealRow { 0% { opacity: 0; transform: translateX(-24px) } 100% { opacity: 1; transform: translateX(0) } }
`}</style>
  )
}
