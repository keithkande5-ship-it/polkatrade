import polkaLogo from '@/assets/polka-logo.png.asset.json'
import { useState, useEffect, useRef } from 'react'
import type { CategoryId, Market, ComboPosition, PortfolioTrade, WalletEntry, View, CustomCategory, Outcome, InfoTab, PolkaProfile, PolkaSettings } from './types'
import { MARKETS, MOCK_PROFILE, INITIAL_PORTFOLIO, INITIAL_WALLET, TOP_MOVERS, RECENT_BETS } from './data'
import { formatVolume, formatKES, shouldHideStats, estimatePayout, comboMath, seedSplit } from './utils'
import {
  OddsProvider, OddsToggle, OddsNumber, FlipNumber, LiveProvider, ToastProvider, useToasts, useOddsMode,
  useLive, useLiveMarket, VolumeFCT, StatusPill, marketStatus, DisplayKeyframes,
  CatIcon, catIconFor, NavIcons,
} from './display'
import { Tutorial } from './Tutorial'
import { WithdrawModal } from './WithdrawModal'
import { DepositModal } from './DepositModal'
import { AuthModal } from './AuthModal'
import { ShieldCheck, MessageCircle, Lock, Link2, HelpCircle, Pencil, Check, X } from 'lucide-react'
import { TradeDrawer } from './TradeBar'
import { InfoModal } from './InfoModal'

const PRIVATE_VIEWS: View[] = ['portfolio', 'wallet', 'notifications', 'settings', 'profile', 'account']

// ─── Style constants ──────────────────────────────────────────────────────────
const BV_UP   = '0 1px 0 rgba(255,255,255,0.55) inset, 0 -1px 0 rgba(0,0,0,0.10) inset'
const BV_IN   = '0 1px 3px rgba(21,43,67,0.10) inset, 0 1px 0 rgba(255,255,255,0.40)'
const BV_DK   = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'
const NAVY    = '#152B43'
const ORANGE  = '#E15B36'
const SKY     = '#DCE7EF'
const WARM    = '#FAF9F6'
const MINERAL = '#F2F0EA'

const DEFAULT_PROFILE: PolkaProfile = { name: '', email: '', phone: '', joined: '', verified: false, oddsFormat: 'percent', signedIn: false }
const DEFAULT_SETTINGS: PolkaSettings = { confirmTrade: true, autoAddToMultiSlip: false, leaderboardPublic: true }
const PAGE_TITLE = "Polka.trade — Kenya's Prediction Market"
function readSaved<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    return valid(value) ? value : fallback
  } catch { return fallback }
}
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
const isProfile = (v: unknown): v is PolkaProfile => isRecord(v) && typeof v['name'] === 'string' && typeof v['email'] === 'string' && typeof v['phone'] === 'string' && typeof v['signedIn'] === 'boolean' && (v['oddsFormat'] === 'percent' || v['oddsFormat'] === 'multiplier')
const isSettings = (v: unknown): v is PolkaSettings => isRecord(v) && typeof v['confirmTrade'] === 'boolean' && typeof v['autoAddToMultiSlip'] === 'boolean' && typeof v['leaderboardPublic'] === 'boolean'
const isMarket = (v: unknown): v is Market => isRecord(v) && typeof v['id'] === 'number' && typeof v['question'] === 'string' && typeof v['yesOdds'] === 'number' && typeof v['noOdds'] === 'number' && typeof v['category'] === 'string'
const isWalletEntry = (v: unknown): v is WalletEntry => isRecord(v) && typeof v['id'] === 'string' && typeof v['amount'] === 'number' && typeof v['description'] === 'string' && (v['status'] === 'completed' || v['status'] === 'pending')
const isPortfolioTrade = (v: unknown): v is PortfolioTrade => isRecord(v) && typeof v['id'] === 'string' && typeof v['market'] === 'string' && typeof v['stake'] === 'number' && typeof v['status'] === 'string'
const isArrayOf = <T,>(v: unknown, check: (item: unknown) => item is T): v is T[] => Array.isArray(v) && v.every(check)

function CountBadge({ count }: { count: number }) {
  if (!count) return null
  return <span className="inline-flex min-w-4 h-4 px-1 items-center justify-center rounded-full text-[10px] font-700 text-white" style={{ background: ORANGE }} aria-label={`${count} new`}>{count}</span>
}


// ─── Category definitions ─────────────────────────────────────────────────────
type CatDef = { id: CategoryId; label: string; icon: React.ReactNode }
const BASE_CATEGORIES: CatDef[] = [
  { id: 'All',           label: 'All',           icon: <CatIcon id="All" /> },
  { id: 'Kenya',         label: 'Kenya',         icon: <CatIcon id="Kenya" /> },
  { id: 'Sports',        label: 'Sports',        icon: <CatIcon id="Sports" /> },
  { id: 'Politics',      label: 'Politics',      icon: <CatIcon id="Politics" /> },
  { id: 'Crypto',        label: 'Crypto',        icon: <CatIcon id="Crypto" /> },
  { id: 'Entertainment', label: 'Entertainment', icon: <CatIcon id="Entertainment" /> },
  { id: 'Business',      label: 'Business',      icon: <CatIcon id="Business" /> },
  { id: 'Science',       label: 'Science',       icon: <CatIcon id="Science" /> },
  { id: 'Global',        label: 'Global',        icon: <CatIcon id="Global" /> },
  { id: 'Twitter',       label: 'X / Twitter',   icon: <CatIcon id="Twitter" /> },
  { id: 'TikTok',        label: 'TikTok',        icon: <CatIcon id="TikTok" /> },
  { id: 'Instagram',     label: 'Instagram',     icon: <CatIcon id="Instagram" /> },
]

/** Feed filter pills that are not real categories. */
const FEED_FILTERS = [
  { id: 'my', label: 'My Markets' },
  { id: 'closed', label: 'Closed' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'disputed', label: 'Disputed' },
] as const

function getCatIcon(id: CategoryId, custom: CustomCategory[]): React.ReactNode {
  return catIconFor(id, custom)
}

// ─── Shared small components ──────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: ORANGE }} />
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ORANGE }} className="text-[10px] font-600 tracking-wider uppercase">Live</span>
    </span>
  )
}

function ResolvedBadge({ winner }: { winner: string }) {
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#2A6B3A' }} />
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#2A6B3A' }} className="text-[10px] font-700 tracking-wider uppercase">Resolved · {winner}</span>
    </span>
  )
}

function OddsBar({ yes, outcomes }: { yes: number; outcomes?: { odds: number; color: string }[] | undefined }) {
  if (outcomes) {
    return (
      <div className="flex w-full h-1.5 overflow-hidden gap-px">
        {outcomes.map((o, i) => (
          <div key={i} className="h-full" style={{ width: `${o.odds}%`, background: o.color, opacity: 0.75 }} />
        ))}
      </div>
    )
  }
  return (
    <div className="w-full h-1.5 overflow-hidden" style={{ background: SKY }}>
      <div className="h-full" style={{ width: `${yes}%`, background: NAVY, transition: 'width 0.4s ease' }} />
    </div>
  )
}

// ─── Combo Slip ───────────────────────────────────────────────────────────────

type ComboSlipProps = {
  positions: ComboPosition[]
  open: boolean
  onToggle: () => void
  onRemove: (id: number) => void
  onClear: () => void
  onCheckout: (addedAmount: number) => void
  newlyAdded: number[]
}

function ComboSlip({ positions, open, onToggle, onRemove, onClear, onCheckout, newlyAdded }: ComboSlipProps) {
  const [addAmount, setAddAmount] = useState(0)
  const ADD_OPTS = [0, 10, 99, 999, 9999]
  const n = positions.length
  const math = n > 0 ? comboMath(n, addAmount, positions) : null

  return (
    <>
      {/* Floating FAB — mobile only */}
      <div className="fixed bottom-5 right-4 z-50 sm:hidden">
        <div
          onClick={onToggle}
          role="button"
          className="relative flex items-center justify-center w-14 h-14 rounded-full cursor-pointer select-none active:scale-95 transition-transform"
          style={{ background: '#F7D000', boxShadow: '0 4px 20px rgba(107,33,168,0.35), ' + BV_DK }}
        >
          {n > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-700 text-white animate-bounce" style={{ background: '#6B21A8' }}>{n}</span>
          )}
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#6B21A8', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>COMBO</span>
        </div>
      </div>

      {/* Drawer — slides up on mobile, right panel on desktop */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end" onClick={onToggle}>
          <div
            className="w-full sm:w-80 max-h-[90dvh] sm:max-h-full sm:h-full flex flex-col overflow-hidden"
            style={{ background: WARM, borderTop: `1px solid ${NAVY}22`, borderLeft: `1px solid ${NAVY}22`, boxShadow: '-8px 0 32px rgba(21,43,67,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: '#6B21A8', boxShadow: BV_DK }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#F7D000' }} />
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F7D000', letterSpacing: '0.08em' }} className="text-sm font-800 uppercase">Combo Slip</span>
                {n > 0 && <span className="text-xs text-white/60 font-500">— {n} position{n > 1 ? 's' : ''}</span>}
              </div>
              <div className="flex items-center gap-3">
                {n > 0 && (
                  <button onClick={onClear} className="text-white/50 hover:text-white text-xs uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Clear</button>
                )}
                <button onClick={onToggle} className="text-white/50 hover:text-white text-xl w-7 h-7 flex items-center justify-center">×</button>
              </div>
            </div>

            {/* Empty state */}
            {n === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#6B21A8', fontSize: 48, opacity: 0.12, fontWeight: 800 }}>COMBO</div>
                <p className="text-sm text-[#152B43]/40">Click <strong>YES</strong>, <strong>NO</strong>, or any outcome on a market to add it to your combo slip.</p>
                <p className="text-xs text-[#152B43]/25 mt-1">Base: 1 KES per position. Add more at checkout.</p>
              </div>
            )}

            {/* Positions */}
            {n > 0 && (
              <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: `${NAVY}10` }}>
                {positions.map((p, i) => {
                  const isFlash = newlyAdded.includes(p.marketId)
                  return (
                    <div
                      key={p.marketId}
                      className="px-3 py-2.5 flex items-start gap-2 transition-all"
                      style={{
                        background: isFlash ? '#F7D000' + '22' : (i % 2 === 0 ? WARM : MINERAL),
                        border: isFlash ? `1px solid #F7D000` : 'none',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-[#152B43]/50 truncate leading-snug">{p.marketQuestion}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-xs font-700 px-2 py-0.5 text-white"
                            style={{ background: '#6B21A8', borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif' }}
                          >
                            {p.position}
                          </span>
                          <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-[10px] font-500">{p.odds}%</span>
                          {p.customAmount && (
                            <span className="text-[10px] text-[#152B43]/50">· KES {p.customAmount}</span>
                          )}
                          {isFlash && <span className="text-[10px] font-700" style={{ color: '#6B21A8' }}>✓ Added</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(p.marketId)}
                        className="text-[#152B43]/30 hover:text-[#152B43] text-base shrink-0 mt-0.5"
                      >×</button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Checkout panel */}
            {n > 0 && math && (
              <div className="border-t shrink-0 p-4 space-y-3" style={{ borderColor: `${NAVY}15`, background: SKY }}>
                {/* Base stake info */}
                <div className="flex justify-between text-xs">
                  <span className="text-[#152B43]/50">Base ({n} × KES 1)</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace' }} className="font-600 text-[#152B43]">KES {n}</span>
                </div>

                {/* Add amounts */}
                <div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/40 font-600 mb-1.5">Add to combo</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {ADD_OPTS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setAddAmount(amt)}
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          borderRadius: 3,
                          boxShadow: addAmount === amt ? BV_DK : BV_UP,
                          background: addAmount === amt ? '#6B21A8' : WARM,
                          color: addAmount === amt ? '#F7D000' : `${NAVY}99`,
                          border: `1px solid ${addAmount === amt ? '#6B21A8' : NAVY + '18'}`,
                        }}
                        className="px-2.5 py-1 text-xs font-700 transition-all"
                      >
                        {amt === 0 ? 'Base only' : `+${amt.toLocaleString()}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1 text-xs border-t pt-2" style={{ borderColor: `${NAVY}15` }}>
                  <div className="flex justify-between">
                    <span className="text-[#152B43]/50">Total stake</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace' }} className="font-600 text-[#152B43]">{formatKES(math.totalStake)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#152B43]/50">Per position</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace' }} className="font-600 text-[#152B43]">{formatKES(Math.round(math.perPosition))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#152B43]/50">Est. return (all win)</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace' }} className="font-700 text-[#2A6B3A]">{formatKES(Math.round(math.totalEstimatedReturn))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#152B43]/50">Est. profit</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace', color: math.estimatedProfit > 0 ? '#2A6B3A' : ORANGE }} className="font-700">
                      {math.estimatedProfit > 0 ? '+' : ''}{formatKES(Math.round(math.estimatedProfit))}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onCheckout(addAmount)}
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#6B21A8', boxShadow: BV_DK }}
                  className="w-full py-3 text-sm font-800 uppercase tracking-wider text-white hover:brightness-110 transition-all active:scale-[0.99]"
                >
                  Confirm Combo — {formatKES(math.totalStake)}
                </button>
                <p className="text-[9px] text-[#152B43]/30 text-center">Parimutuel · Platform 2% fee · 18+ only</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Side Menu ────────────────────────────────────────────────────────────────

type SideMenuProps = {
  open: boolean
  onClose: () => void
  isSignedIn: boolean
  balance: number
  onNavigate: (v: View) => void
  onSignIn: () => void
  onSignOut: () => void
  onDeposit: () => void
  onCreate: () => void
  onInfo: () => void
  activeView: View
  profile: PolkaProfile
  badges: { portfolio: number; wallet: number; notifications: number }
}

function SideMenu({ open, onClose, isSignedIn, balance, onNavigate, onSignIn, onSignOut, onDeposit, onCreate, onInfo, activeView, profile, badges }: SideMenuProps) {
  if (!open) return null
  const nav = (v: View, label: string, icon: string) => (
    <button
      onClick={() => { onNavigate(v); onClose() }}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:brightness-95"
      style={{ background: activeView === v ? SKY : 'transparent', borderLeft: activeView === v ? `3px solid ${ORANGE}` : '3px solid transparent' }}
    >
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <span className="font-500 flex-1" style={{ color: NAVY }}>{label}</span>
      {isSignedIn && (v === 'portfolio' || v === 'wallet' || v === 'notifications') && <CountBadge count={badges[v]} />}
      {!isSignedIn && PRIVATE_VIEWS.includes(v) && <Lock size={13} style={{ color: `${NAVY}55` }} aria-label="Sign in required" />}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-72 h-full flex flex-col overflow-y-auto" style={{ background: WARM, borderLeft: `1px solid ${NAVY}18`, boxShadow: '-16px 0 40px rgba(21,43,67,0.15)' }} onClick={e => e.stopPropagation()}>
        {/* Profile header */}
        <div className="px-4 py-5 shrink-0" style={{ background: NAVY }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white text-xl">×</button>
          {isSignedIn ? (
            <div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-700 text-white mb-2" style={{ background: ORANGE, boxShadow: BV_DK }}>{profile.name[0]?.toUpperCase()}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-white font-700 text-base">{profile.name}</div>
              <div className="text-white/40 text-xs">{profile.email}</div>
              <div className="mt-3 flex items-center gap-2">
                <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-white font-600 text-sm">{formatKES(balance)}</span>
                <button onClick={onDeposit} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#F7D000', boxShadow: BV_DK, color: '#6B21A8' }} className="px-2.5 py-1 text-xs font-700 uppercase tracking-wider">+ Deposit</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl mb-3">👤</div>
              <p className="text-white/60 text-sm mb-3">Sign in to trade on any market</p>
              <button onClick={() => { onSignIn(); onClose() }} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: ORANGE, boxShadow: BV_DK }} className="px-4 py-2 text-sm font-700 uppercase tracking-wider text-white">Sign In / Register</button>
            </div>
          )}
        </div>

        {/* Nav items */}
        <div className="flex-1 py-2">
          {isSignedIn && nav('profile', 'My Profile', '👤')}
          {isSignedIn && nav('account', 'My Account', '⚙️')}
          {nav('portfolio', 'Portfolio', '📊')}
          {nav('wallet', 'Wallet & Ledger', '💼')}
          <div className="my-1 mx-4 h-px" style={{ background: `${NAVY}12` }} />
          {nav('markets', 'Markets', '📋')}
          {nav('leaderboard', 'Leaderboard', '🏆')}
          <button
            onClick={() => { onCreate(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:brightness-95"
            style={{ borderLeft: '3px solid transparent' }}
          >
            <span className="text-base w-5 text-center shrink-0" style={{ color: ORANGE }}>＋</span>
            <span className="font-600 flex-1" style={{ color: ORANGE }}>Create Market</span>
            {!isSignedIn && <Lock size={13} style={{ color: `${NAVY}55` }} />}
          </button>
          <div className="my-1 mx-4 h-px" style={{ background: `${NAVY}12` }} />
          {nav('notifications', 'Notifications', '🔔')}
          {nav('settings', 'Settings', '⚙️')}
          {nav('language', 'Language', '🌐')}
          <button
            onClick={() => { onInfo(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:brightness-95"
            style={{ borderLeft: '3px solid transparent' }}
          >
            <span className="w-5 flex justify-center shrink-0" style={{ color: NAVY }}><HelpCircle size={16} /></span>
            <span className="font-500" style={{ color: NAVY }}>FAQ, Help & Legal</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: `${NAVY}12` }}>
          {isSignedIn && (
            <button onClick={() => { onSignOut(); onClose() }} className="w-full text-left text-sm text-[#152B43]/40 hover:text-[#152B43] transition-colors">Sign Out</button>
          )}
          <div className="text-[10px] text-[#152B43]/25">Polka.trade · Prediction market · Not a bookmaker · 18+</div>
        </div>
      </div>
    </div>
  )
}

// ─── MarketRow ────────────────────────────────────────────────────────────────

type MarketRowProps = {
  market: Market
  index: number
  onSelect: (m: Market) => void
  comboMode: boolean
  comboPositions: ComboPosition[]
  onAddToCombo: (m: Market, position: string, odds: number) => void
  customCategories: CustomCategory[]
}

function MarketRow({ market: baseMarket, index, onSelect, comboMode, comboPositions, onAddToCombo, customCategories }: MarketRowProps) {
  const market = useLiveMarket(baseMarket)
  const bg = index % 2 === 0 ? WARM : SKY
  const isMulti = Boolean(market.outcomes?.length)
  const isResolved = Boolean(market.isResolved)
  const hideStats = shouldHideStats(market.volume, market.participants)
  const inCombo = comboPositions.some(p => p.marketId === market.id)

  const handlePositionClick = (e: React.MouseEvent, position: string, odds: number) => {
    e.stopPropagation()
    if (comboMode) {
      onAddToCombo(market, position, odds)
    } else {
      onSelect(market)
    }
  }

  return (
    <div
      onClick={() => onSelect(market)}
      className="w-full border-b cursor-pointer transition-all hover:brightness-[0.97]"
      style={{
        background: inCombo ? '#F7D000' + '18' : bg,
        borderColor: inCombo ? '#F7D000' : `${NAVY}10`,
        borderWidth: inCombo ? '1px' : '0 0 1px 0',
      }}
    >
      <div className="px-3 py-3 md:px-4">
        {/* Top meta row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}55` }} className="text-[10px] font-600 uppercase tracking-widest shrink-0 flex items-center gap-1">
            <span className="flex items-center">{getCatIcon(market.category, customCategories)}</span>
            <span>{market.category}</span>
          </span>
          {isResolved
            ? <ResolvedBadge winner={market.winner!} />
            : market.isLive ? <LiveDot /> : null}
          {market.trending && !market.isLive && !isResolved && (
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-[10px] uppercase tracking-wider font-600">↑ Trending</span>
          )}
          {inCombo && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#6B21A8' }} className="text-[10px] uppercase tracking-wider font-700">● In Combo</span>}
          <StatusPill market={market} />
          <span className="ml-auto text-[10px] shrink-0" style={{ color: `${NAVY}35` }}>Ends {market.endsAt}</span>
        </div>

        {/* Question */}
        <p className="text-sm font-500 leading-snug" style={{ color: NAVY }}>
          {market.question}{' '}
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onSelect(baseMarket) }}
            className="whitespace-nowrap underline cursor-pointer hover:opacity-80"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            view details
          </span>
        </p>

        {/* Odds bar */}
        <div className="mt-2">
          <OddsBar yes={market.yesOdds} outcomes={isResolved ? undefined : market.outcomes} />
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Binary odds */}
          {!isMulti && !isResolved && (
            <div className="flex items-center gap-2 shrink-0">
              <OddsNumber value={market.yesOdds} style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-base font-700" />
              <span style={{ color: `${NAVY}35` }} className="text-[10px]">YES</span>
              <div className="w-px h-4" style={{ background: `${NAVY}20` }} />
              <OddsNumber value={market.noOdds} style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}55` }} className="text-base font-700" />
              <span style={{ color: `${NAVY}30` }} className="text-[10px]">NO</span>
            </div>
          )}

          {/* Volume — hidden for thin markets */}
          {!hideStats && (
            <span style={{ fontFamily: 'Geist Mono, monospace', color: `${NAVY}45` }} className="text-[10px]">
              <FlipNumber value={formatVolume(market.volume)} /><VolumeFCT marketId={market.id} /> · <FlipNumber value={market.participants.toLocaleString()} /> traders
            </span>
          )}

          {/* Resolved: winning outcome */}
          {isResolved && (
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-xs font-700 px-2.5 py-1 text-white"
                style={{ background: '#2A6B3A', borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: BV_DK }}
              >
                ✓ {market.winner}
              </span>
              <span style={{ color: `${NAVY}35` }} className="text-[10px]">Final result</span>
            </div>
          )}

          {/* Action buttons */}
          {!isResolved && (
            <div className="flex gap-1.5 ml-auto shrink-0">
              {isMulti ? (
                <div
                  role="button"
                  onClick={e => handlePositionClick(e, market.outcomes![0]!.label, market.outcomes![0]!.odds)}
                  style={{ borderRadius: 3, boxShadow: BV_UP, background: NAVY, color: WARM, fontFamily: 'Barlow Condensed, sans-serif' }}
                  className="px-3 py-1.5 text-xs font-700 hover:brightness-110 cursor-pointer select-none active:scale-95 transition-all"
                >
                  {comboMode ? '+ Combo' : 'Predict →'}
                </div>
              ) : (
                <>
                  <div
                    role="button"
                    onClick={e => handlePositionClick(e, 'YES', market.yesOdds)}
                    style={{ borderRadius: 3, boxShadow: BV_UP, background: NAVY, color: WARM, fontFamily: 'Barlow Condensed, sans-serif' }}
                    className="px-3 py-1.5 min-w-[44px] text-center text-xs font-700 hover:brightness-110 cursor-pointer select-none active:scale-95 transition-all"
                  >
                    YES
                  </div>
                  <div
                    role="button"
                    onClick={e => handlePositionClick(e, 'NO', market.noOdds)}
                    style={{ borderRadius: 3, boxShadow: BV_IN, background: `${WARM}99`, color: `${NAVY}80`, border: `1px solid ${NAVY}25`, fontFamily: 'Barlow Condensed, sans-serif' }}
                    className="px-3 py-1.5 min-w-[44px] text-center text-xs font-700 hover:brightness-95 cursor-pointer select-none active:scale-95 transition-all"
                  >
                    NO
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Multi-outcome pills — only when not resolved */}
        {isMulti && !isResolved && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {market.outcomes!.map((o, i) => (
              <div
                key={i}
                role="button"
                onClick={e => handlePositionClick(e, o.label, o.odds)}
                style={{ background: o.color, borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: BV_DK }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-white hover:brightness-110 cursor-pointer select-none active:scale-95 transition-all"
              >
                <span className="text-xs font-600 whitespace-nowrap">{o.label}</span>
                <span className="text-[11px] font-700 opacity-75 whitespace-nowrap">{o.odds}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Market Detail — standalone page ─────────────────────────────────────────

type MarketDetailProps = {
  market: Market
  onClose: () => void
  comboPositions: ComboPosition[]
  onAddToCombo: (m: Market, position: string, odds: number, amount?: number) => void
  onConfirm: (m: Market, position: string, odds: number, amount: number) => void
  myTrades: PortfolioTrade[]
}

const QUICK_AMOUNTS = [99, 199, 999, 9999]

function MarketDetail({ market: baseMarket, onClose, comboPositions, onAddToCombo, onConfirm, myTrades }: MarketDetailProps) {
  const market = useLiveMarket(baseMarket)
  const [tab, setTab] = useState<'overview' | 'activity'>('overview')
  const [position, setPosition] = useState<string>(market.outcomes ? market.outcomes[0]!.label : 'YES')
  const [amount, setAmount] = useState('99')
  const isMulti = Boolean(market.outcomes?.length)
  const isResolved = Boolean(market.isResolved)
  const alreadyInCombo = comboPositions.some(p => p.marketId === market.id)
  const hideStats = shouldHideStats(market.volume, market.participants)

  const existing = myTrades.find(t => t.marketId === market.id && t.status === 'open')
  const locked = existing?.position
  const conflicting = Boolean(locked && locked !== position)

  const selectedOdds = isMulti
    ? (market.outcomes!.find(o => o.label === position)?.odds ?? 50)
    : (position === 'YES' ? market.yesOdds : market.noOdds)

  const numAmount = Number(amount) || 0
  const estimated = Math.round(estimatePayout(numAmount, selectedOdds))

  const statusLabel = marketStatus(market)
  const { push } = useToasts()
  const [drawer, setDrawer] = useState<{ position?: string | undefined } | null>(null)
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?market=${market.id}` : ''
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Trade on Polka: ${market.question} — ${shareUrl}`)}`, '_blank', 'noopener,noreferrer')
  }
  const copyLink = () => {
    if (!navigator.clipboard) { push('Could not copy link', 'warn'); return }
    navigator.clipboard.writeText(shareUrl).then(() => push('Link copied!'), () => push('Could not copy link', 'warn'))
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: MINERAL }}>
      {/* Page bar */}
      <div className="shrink-0 px-3 sm:px-4 py-3 flex items-center gap-3" style={{ background: NAVY, boxShadow: BV_DK }}>
        <button
          onClick={onClose}
          style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, border: '1px solid rgba(255,255,255,0.2)' }}
          className="px-2.5 py-1.5 text-xs font-700 uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          ← Markets
        </button>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/35 font-600 truncate">
          {market.category} · {statusLabel}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl p-3 sm:p-4 pb-24 lg:pb-4 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] gap-3 sm:gap-4 items-start">

          {/* ── Trade panel (first on mobile, right column on desktop) ── */}
          <div className="order-1 lg:order-2 w-full lg:sticky lg:top-4">
            {!isResolved ? (
              <div className="border p-4" style={{ background: SKY, borderRadius: 4, borderColor: `${NAVY}15`, boxShadow: BV_IN }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}50` }} className="text-[10px] uppercase tracking-widest font-600 mb-3">Place a prediction</div>

                {isMulti ? (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {market.outcomes!.map((o, i) => (
                      <button
                        key={i}
                        onClick={() => setPosition(o.label)}
                        style={{
                          borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif',
                          background: position === o.label ? o.color : 'transparent',
                          color: position === o.label ? '#fff' : NAVY,
                          border: `1.5px solid ${position === o.label ? o.color : NAVY + '20'}`,
                          boxShadow: position === o.label ? BV_DK : 'none',
                        }}
                        className="px-3 py-2 text-sm font-700 transition-all hover:brightness-105"
                      >
                        {o.label} <span className="opacity-70">{o.odds}%</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 mb-3">
                    {(['YES', 'NO'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setPosition(p)}
                        style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: position === p ? BV_DK : BV_IN, background: position === p ? NAVY : `${WARM}70`, border: `1px solid ${position === p ? NAVY : NAVY + '25'}`, color: position === p ? WARM : NAVY }}
                        className="flex-1 py-3 text-base font-700 uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        {p} · <OddsNumber value={p === 'YES' ? market.yesOdds : market.noOdds} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Amount */}
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}50` }} className="text-[10px] uppercase tracking-widest font-600 mb-1.5">Amount to enter</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_AMOUNTS.map(a => (
                    <button
                      key={a}
                      onClick={() => setAmount(String(a))}
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: amount === String(a) ? BV_DK : BV_UP, background: amount === String(a) ? NAVY : WARM, color: amount === String(a) ? WARM : `${NAVY}70`, border: `1px solid ${amount === String(a) ? NAVY : NAVY + '18'}` }}
                      className="px-3 py-1.5 text-sm font-700 transition-all"
                    >
                      {a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-600 pointer-events-none" style={{ color: `${NAVY}45` }}>KES</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border pl-10 pr-3 py-3 text-base outline-none"
                    style={{ borderRadius: 3, fontFamily: 'Geist Mono, monospace', boxShadow: BV_IN, background: WARM, color: NAVY, borderColor: `${NAVY}20` }}
                  />
                </div>

                {/* Estimated payout */}
                <div className="mt-3 border p-3" style={{ background: '#EBF7EE', borderColor: '#2A6B3A33', borderRadius: 3 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#2A6B3A' }} className="text-[10px] uppercase tracking-widest font-700">Estimated payout</div>
                  <FlipNumber
                    value={formatKES(estimated)}
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#1F6B45', fontSize: 34, fontWeight: 800, lineHeight: 1.05 }}
                  />
                  <p className="text-[10px] leading-relaxed mt-1" style={{ color: `${NAVY}55` }}>
                    Estimate only. Payouts are parimutuel — the final amount depends on the winning pool at resolution.
                  </p>
                </div>

                {conflicting && (
                  <p className="text-[11px] mt-2" style={{ color: ORANGE }}>
                    You already hold <strong>{locked}</strong> on this market. You can add to that position, but not the opposite one.
                  </p>
                )}

                <button
                  onClick={() => { if (numAmount > 0 && !conflicting) onConfirm(baseMarket, position, selectedOdds, numAmount) }}
                  disabled={numAmount <= 0 || conflicting}
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: ORANGE }}
                  className="w-full mt-3 py-3 text-sm font-800 uppercase tracking-wider text-white hover:brightness-110 transition-all active:scale-[0.99] disabled:opacity-40"
                >
                  Confirm prediction
                </button>
                <button
                  onClick={() => onAddToCombo(baseMarket, position, selectedOdds, numAmount || undefined)}
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: alreadyInCombo ? '#4C0F8F' : '#6B21A8' }}
                  className="w-full mt-2 py-2.5 text-xs font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all active:scale-[0.99]"
                >
                  {alreadyInCombo ? '✓ In combo' : 'Add to combo'}
                </button>
                <p className="text-[10px] mt-2 leading-relaxed" style={{ color: `${NAVY}40` }}>
                  A combo groups separate predictions into one checkout. Each one still settles on its own market.
                </p>
              </div>
            ) : (
              <div className="border p-4 space-y-2" style={{ background: '#EBF7EE', borderColor: '#2A6B3A33', borderRadius: 4 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#2A6B3A' }} className="text-xs uppercase tracking-widest font-700">Market resolved</div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-xl font-700">Winner: {market.winner}</div>
                <p className="text-xs leading-relaxed" style={{ color: `${NAVY}70` }}>
                  Winning positions received parimutuel payouts from the {formatVolume(market.volume)} pool, less a 2% platform fee.
                </p>
              </div>
            )}

            {existing && (
              <div className="border p-3 mt-3" style={{ background: WARM, borderRadius: 3, borderColor: `${NAVY}15` }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-[10px] uppercase tracking-widest font-600">Your position</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-700 px-2 py-0.5 text-white" style={{ background: NAVY, borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif' }}>{existing.position}</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-sm font-600">{formatKES(existing.stake)}</span>
                  <span className="text-[10px]" style={{ color: `${NAVY}40` }}>held until resolution</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Market body ── */}
          <div className="order-2 lg:order-1 w-full space-y-3">
            <div className="border p-4" style={{ background: WARM, borderRadius: 4, borderColor: `${NAVY}15` }}>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill market={market} />
                {isResolved ? <ResolvedBadge winner={market.winner!} /> : market.isLive ? <LiveDot /> : null}
                <span className="text-[11px]" style={{ color: `${NAVY}45` }}>Resolves {market.endsAt}</span>
              </div>
              <h1 className="text-base sm:text-xl font-600 mt-2 leading-snug" style={{ color: NAVY }}>{market.question}</h1>
              <div className="flex gap-2 mt-2">
                <button onClick={shareWhatsApp} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#1F8A4C', boxShadow: BV_DK }} className="px-3 py-1.5 text-xs font-700 uppercase tracking-wider text-white hover:brightness-110 flex items-center gap-1.5">
                  <MessageCircle size={13} /> Share to WhatsApp
                </button>
                <button onClick={copyLink} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: WARM, border: `1px solid ${NAVY}22`, boxShadow: BV_UP, color: NAVY }} className="px-3 py-1.5 text-xs font-700 uppercase tracking-wider hover:brightness-95 flex items-center gap-1.5">
                  <Link2 size={13} /> Copy Link
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="border p-3" style={{ background: MINERAL, borderRadius: 3, borderColor: `${NAVY}12`, boxShadow: BV_IN }}>
                  <OddsNumber
                    value={isMulti ? market.outcomes![0]!.odds : market.yesOdds}
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY, fontSize: 30, fontWeight: 700 }}
                  />
                  <div className="text-[11px] mt-0.5" style={{ color: `${NAVY}50` }}>{isMulti ? `${market.outcomes![0]!.label} leads` : 'Chance YES'}</div>
                  <div className="mt-2"><OddsBar yes={market.yesOdds} outcomes={isResolved ? undefined : market.outcomes} /></div>
                </div>
                <div className="border p-3" style={{ background: MINERAL, borderRadius: 3, borderColor: `${NAVY}12`, boxShadow: BV_IN }}>
                  {!hideStats ? (
                    <>
                      <div style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-sm font-600">
                        <FlipNumber value={formatVolume(market.volume)} /><VolumeFCT marketId={market.id} />
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: `${NAVY}50` }}>Total volume</div>
                      <div className="text-[11px] mt-2" style={{ color: `${NAVY}40` }}>
                        <FlipNumber value={market.participants.toLocaleString()} /> traders
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px]" style={{ color: `${NAVY}40` }}>Stats unlock at 1K KES volume</div>
                  )}
                </div>
              </div>

              {isMulti && (
                <div className="space-y-1.5 mt-3">
                  {market.outcomes!.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: o.color }} />
                      <span className="text-xs flex-1" style={{ color: NAVY, fontWeight: market.winner === o.label ? 700 : 400 }}>{o.label}</span>
                      <div className="w-20 h-1.5 overflow-hidden shrink-0" style={{ background: SKY }}>
                        <div className="h-full" style={{ width: `${o.odds}%`, background: o.color }} />
                      </div>
                      <OddsNumber value={o.odds} style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY, fontWeight: 700 }} className="text-sm w-12 text-right shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="border overflow-hidden" style={{ background: WARM, borderRadius: 4, borderColor: `${NAVY}15` }}>
              <div className="flex border-b" style={{ borderColor: `${NAVY}15` }}>
                {(['overview', 'activity'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    className={`flex-1 py-2.5 text-sm font-600 uppercase tracking-wider border-b-2 transition-colors ${tab === t ? 'border-[#E15B36] text-[#152B43]' : 'border-transparent text-[#152B43]/40 hover:text-[#152B43]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === 'overview' ? (
                <div className="p-4 space-y-3">
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}40` }} className="text-[10px] uppercase tracking-widest font-600 mb-1">Resolves YES if</div>
                    <p className="text-xs leading-relaxed" style={{ color: `${NAVY}75` }}>{market.description}</p>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}40` }} className="text-[10px] uppercase tracking-widest font-600 mb-1">Resolves NO if</div>
                    <p className="text-xs leading-relaxed" style={{ color: `${NAVY}75` }}>None of the YES conditions above are met by {market.endsAt}.</p>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}40` }} className="text-[10px] uppercase tracking-widest font-600 mb-1">Sources</div>
                    <p className="text-xs leading-relaxed" style={{ color: `${NAVY}75` }}>Official public announcements and at least two established Kenyan news outlets.</p>
                  </div>
                  <p className="text-[10px] leading-relaxed pt-1" style={{ color: `${NAVY}30` }}>
                    Polka.trade is a prediction market, not a sportsbook. Payouts are parimutuel — winners share the pool less a 2% platform fee. 18+ only.
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: `${NAVY}08` }}>
                  {RECENT_BETS.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ background: i % 2 === 0 ? WARM : SKY }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white font-600 shrink-0" style={{ background: NAVY }}>{b.user[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-500" style={{ color: NAVY }}>{b.user}</div>
                        <div className="text-[11px] truncate" style={{ color: `${NAVY}45` }}>{b.market}</div>
                      </div>
                      <div className="text-xs font-700 px-2 py-0.5 text-white shrink-0" style={{ background: NAVY, borderRadius: 2, fontFamily: 'Barlow Condensed, sans-serif' }}>{b.action}</div>
                      <div className="text-xs shrink-0" style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }}>{b.amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ── Mobile sticky trade bar ── */}
      {!isResolved && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-3 shadow-lg" style={{ borderColor: `${NAVY}18` }}>
          {isMulti ? (
            <button
              onClick={() => setDrawer({})}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: NAVY, boxShadow: BV_DK }}
              className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white active:scale-[0.99]"
            >
              Select Outcome · ({market.outcomes!.length} options)
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDrawer({ position: 'YES' })} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#1F6B45', boxShadow: BV_DK }} className="py-3 text-sm font-700 uppercase tracking-wider text-white flex items-center justify-center gap-1 active:scale-[0.99]">
                Buy YES · <OddsNumber value={market.yesOdds} />
              </button>
              <button onClick={() => setDrawer({ position: 'NO' })} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: ORANGE, boxShadow: BV_DK }} className="py-3 text-sm font-700 uppercase tracking-wider text-white flex items-center justify-center gap-1 active:scale-[0.99]">
                Buy NO · <OddsNumber value={market.noOdds} />
              </button>
            </div>
          )}
        </div>
      )}
      {drawer && (
        <TradeDrawer
          market={market}
          initialPosition={drawer.position}
          onClose={() => setDrawer(null)}
          onConfirm={(pos, odds, amt) => {
            if (locked && locked !== pos) { push(`You already hold ${locked} on this market`, 'warn'); return }
            setDrawer(null)
            onConfirm(baseMarket, pos, odds, amt)
          }}
        />
      )}
    </div>
  )
}


// ─── Create Market ────────────────────────────────────────────────────────────

const OUTCOME_COLORS = ['#152B43', '#E15B36', '#2A7B6F', '#6B21A8', '#B7791F', '#2563A8']
const SEED_CHIPS = [100, 250, 500, 1000]

type CreateMarketProps = { onClose: () => void; balance: number; onPublish: (market: Market, seed: number) => void }

function CreateMarket({ onClose, balance, onPublish }: CreateMarketProps) {
  const [step, setStep] = useState(1)
  const [marketId] = useState(() => Date.now())
  const [form, setForm] = useState({ question: '', criteria: '', source: '', category: 'Kenya' as CategoryId, endDate: '', startingOdds: 50 })
  const [marketType, setMarketType] = useState<'binary' | 'multiple'>('binary')
  const [outcomes, setOutcomes] = useState<{ label: string; odds: number }[]>([
    { label: '', odds: 34 }, { label: '', odds: 33 }, { label: '', odds: 33 },
  ])
  const [seedInput, setSeedInput] = useState('100')
  const isMulti = marketType === 'multiple'
  const seedAmount = Math.floor(Number(seedInput) || 0)
  const oddsTotal = isMulti ? outcomes.reduce((s, o) => s + o.odds, 0) : 100
  const setOutcome = (i: number, patch: Partial<{ label: string; odds: number }>) =>
    setOutcomes(os => os.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  const splitEvenly = () => setOutcomes(os => {
    const base = Math.floor(100 / os.length)
    return os.map((o, i) => ({ ...o, odds: base + (i < 100 - base * os.length ? 1 : 0) }))
  })
  const allCats = BASE_CATEGORIES.filter(c => c.id !== 'All')

  const step1Ok = form.question.trim().length >= 10 && form.criteria.trim().length >= 10 && form.source.trim().length >= 4 && Boolean(form.endDate)
    && (!isMulti || outcomes.every(o => o.label.trim().length > 0))
  const step2Ok = seedAmount >= 100 && oddsTotal === 100 && (!isMulti || outcomes.every(o => o.odds >= 1))
  const split = seedSplit(isMulti ? outcomes.map(o => o.odds) : form.startingOdds, isMulti ? outcomes.length : 2, seedAmount)
  const poolLabels = isMulti ? outcomes.map((o, i) => o.label || `Outcome ${i + 1}`) : ['YES', 'NO']
  const insufficient = balance < seedAmount

  const preview: Market = {
    id: marketId,
    question: form.question.trim() || 'Your question here',
    category: form.category,
    yesOdds: isMulti ? (outcomes[0]?.odds ?? 50) : form.startingOdds,
    noOdds: isMulti ? 100 - (outcomes[0]?.odds ?? 50) : 100 - form.startingOdds,
    outcomes: isMulti ? outcomes.map((o, i) => ({ label: o.label.trim() || `Outcome ${i + 1}`, odds: o.odds, color: OUTCOME_COLORS[i % OUTCOME_COLORS.length]! })) : undefined,
    volume: seedAmount,
    endsAt: form.endDate || 'TBD',
    isLive: false,
    trending: false,
    participants: 1,
    description: `${form.criteria.trim()} Official source: ${form.source.trim()}`,
    seedPool: seedAmount,
  }

  const label = (text: string) => (
    <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>{text}</label>
  )
  const inputStyle = { borderRadius: 3, boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}15` }
  const canContinue = step === 1 ? step1Ok : step2Ok

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: `${NAVY}50` }} onClick={onClose}>
      <div className="w-full sm:max-w-xl overflow-hidden" style={{ background: WARM, borderRadius: 4, border: `1px solid ${NAVY}18`, boxShadow: '0 24px 64px rgba(21,43,67,0.18)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="border-b px-4 py-4 flex items-center justify-between shrink-0" style={{ background: NAVY, boxShadow: BV_DK, borderColor: `${NAVY}18` }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Create Market · Step {step} of 3</div>
            <div className="text-sm font-600 text-white mt-0.5">{step === 1 ? 'Details & type' : step === 2 ? 'Probabilities & seed' : 'Preview & deduct'}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="h-0.5" style={{ background: `${NAVY}15` }}><div className="h-full transition-all" style={{ width: `${(step / 3) * 100}%`, background: ORANGE }} /></div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {step === 1 && (
            <>
              <div>
                {label('Market Question')}
                <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Will [event] happen by [date]?" rows={3} className="w-full border p-3 text-sm resize-none outline-none" style={inputStyle} />
              </div>
              <div>
                {label('Category')}
                <div className="flex flex-wrap gap-1.5">
                  {allCats.map(c => (
                    <button key={String(c.id)} onClick={() => setForm({ ...form, category: c.id })} style={{ borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: form.category === c.id ? BV_DK : BV_UP, background: form.category === c.id ? NAVY : WARM, color: form.category === c.id ? WARM : `${NAVY}60`, border: `1px solid ${form.category === c.id ? NAVY : NAVY + '15'}` }} className="px-2.5 py-1.5 text-xs font-600 uppercase tracking-wider transition-all flex items-center gap-1">
                      <span className="flex items-center">{c.icon}</span><span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                {label('Market Type')}
                <div className="grid grid-cols-2 gap-1.5">
                  {([{ id: 'binary', label: 'Binary (Yes/No)' }, { id: 'multiple', label: 'Multiple Choice' }] as const).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setMarketType(t.id)}
                      style={{ borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: marketType === t.id ? BV_DK : BV_UP, background: marketType === t.id ? NAVY : WARM, color: marketType === t.id ? WARM : `${NAVY}60`, border: `1px solid ${marketType === t.id ? NAVY : NAVY + '15'}` }}
                      className="py-2 text-xs font-700 uppercase tracking-wider transition-all"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {isMulti && (
                <div>
                  {label(`Outcome labels (${outcomes.length} of 6)`)}
                  <div className="space-y-1.5">
                    {outcomes.map((o, i) => (
                      <div key={i} className="flex gap-1.5 items-center">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: OUTCOME_COLORS[i] }} />
                        <input value={o.label} onChange={e => setOutcome(i, { label: e.target.value })} placeholder={`Outcome ${i + 1}`} className="flex-1 min-w-0 border px-2.5 py-2 text-sm outline-none" style={inputStyle} />
                        {outcomes.length > 2 && (
                          <button onClick={() => setOutcomes(os => os.filter((_, idx) => idx !== i))} aria-label="Remove outcome" className="w-7 h-7 shrink-0" style={{ color: `${NAVY}50` }}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                  {outcomes.length < 6 && (
                    <button onClick={() => setOutcomes(os => [...os, { label: '', odds: 0 }])} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_UP, border: `1px solid ${NAVY}15`, color: `${NAVY}60` }} className="mt-2 px-2.5 py-1.5 text-[11px] font-700 uppercase tracking-wider">+ Add outcome</button>
                  )}
                </div>
              )}
              <div>
                {label('Resolution Criteria (required)')}
                <textarea value={form.criteria} onChange={e => setForm({ ...form, criteria: e.target.value })} placeholder={isMulti ? 'Explain exactly how the winning outcome is decided.' : 'Describe exactly what must happen for YES to win.'} rows={3} className="w-full border p-3 text-sm resize-none outline-none" style={inputStyle} />
              </div>
              <div>
                {label('Official Source URL / Proof (required)')}
                <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="https://www.iebc.or.ke/…" className="w-full border px-3 py-2.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: 'Geist Mono, monospace' }} />
              </div>
              <div>
                {label('End Date')}
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="border p-2.5 text-sm outline-none w-full" style={inputStyle} />
              </div>
              {!step1Ok && <p className="text-[11px]" style={{ color: `${NAVY}50` }}>Fill in the question, {isMulti ? 'every outcome label, ' : ''}resolution criteria, official source and end date to continue.</p>}
            </>
          )}
          {step === 2 && (
            <>
              {isMulti ? (
                <div>
                  {label('Starting probabilities')}
                  <div className="space-y-1.5">
                    {outcomes.map((o, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: OUTCOME_COLORS[i] }} />
                        <span className="flex-1 min-w-0 truncate text-sm" style={{ color: NAVY }}>{o.label}</span>
                        <input type="number" min={1} max={99} value={o.odds} onChange={e => setOutcome(i, { odds: Math.max(0, Math.min(99, Math.round(Number(e.target.value) || 0))) })} className="w-16 border px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: 'Geist Mono, monospace' }} />
                        <span className="text-[11px]" style={{ color: `${NAVY}40` }}>%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={splitEvenly} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_UP, border: `1px solid ${NAVY}15`, color: `${NAVY}60` }} className="px-2.5 py-1.5 text-[11px] font-700 uppercase tracking-wider">Split evenly</button>
                    <span style={{ fontFamily: 'Geist Mono, monospace', color: oddsTotal === 100 ? '#1F6B45' : ORANGE }} className="text-[11px] font-700">{oddsTotal}% / 100%</span>
                  </div>
                </div>
              ) : (
                <div>
                  {label(`Starting probability — ${form.startingOdds}% YES / ${100 - form.startingOdds}% NO`)}
                  <input type="range" min={5} max={95} value={form.startingOdds} onChange={e => setForm({ ...form, startingOdds: Number(e.target.value) })} className="w-full accent-[#152B43]" />
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: `${NAVY}35` }}><span>Unlikely</span><span>50/50</span><span>Likely</span></div>
                </div>
              )}
              <div>
                {label('Seed liquidity (min KES 100)')}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SEED_CHIPS.map(a => (
                    <button key={a} onClick={() => setSeedInput(String(a))} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: seedAmount === a ? BV_DK : BV_UP, background: seedAmount === a ? NAVY : WARM, color: seedAmount === a ? WARM : `${NAVY}70`, border: `1px solid ${seedAmount === a ? NAVY : NAVY + '18'}` }} className="px-3 py-1.5 text-sm font-700">KES {a.toLocaleString()}</button>
                  ))}
                </div>
                <input type="number" min={100} value={seedInput} onChange={e => setSeedInput(e.target.value)} className="w-full border px-3 py-2.5 text-sm outline-none" style={{ ...inputStyle, fontFamily: 'Geist Mono, monospace' }} />
                {seedAmount < 100 && <p className="text-[11px] mt-1" style={{ color: ORANGE }}>Minimum seed is KES 100.</p>}
              </div>
              <div className="border p-3 space-y-1.5" style={{ background: SKY, borderRadius: 3, borderColor: `${NAVY}15`, boxShadow: BV_IN }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}50` }} className="text-[10px] uppercase tracking-widest font-600">Seed split — {formatKES(split.seed)}</div>
                {split.pools.map((pool, i) => (
                  <div key={i} className="flex justify-between text-xs" style={{ color: NAVY }}>
                    <span className="truncate">{poolLabels[i]} pool</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace' }} className="font-700 shrink-0">{formatKES(pool)}</span>
                  </div>
                ))}
              </div>
              {oddsTotal !== 100 && <p className="text-[11px]" style={{ color: ORANGE }}>Probabilities must add up to exactly 100% to continue.</p>}
            </>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-[10px] uppercase tracking-widest font-600">Live preview</div>
              <div className="border overflow-hidden pointer-events-none" style={{ borderRadius: 3, borderColor: `${NAVY}15` }}>
                <MarketRow market={preview} index={0} onSelect={() => {}} comboMode={false} comboPositions={[]} onAddToCombo={() => {}} customCategories={[]} />
              </div>
              <div className="border p-3 space-y-1.5" style={{ background: insufficient ? '#FBEAEA' : '#EBF7EE', borderRadius: 3, borderColor: insufficient ? '#8B1A1A33' : '#2A6B3A33' }}>
                <p className="text-sm font-600" style={{ color: NAVY }}><strong>{formatKES(seedAmount)}</strong> will be deducted from your wallet to fund this market.</p>
                <div className="flex justify-between text-xs" style={{ color: `${NAVY}70` }}><span>Wallet balance</span><span style={{ fontFamily: 'Geist Mono, monospace' }}>{formatKES(balance)}</span></div>
                <div className="flex justify-between text-xs" style={{ color: `${NAVY}70` }}><span>Balance after publishing</span><span style={{ fontFamily: 'Geist Mono, monospace' }}>{formatKES(balance - seedAmount)}</span></div>
                {insufficient && <p className="text-[11px]" style={{ color: '#8B1A1A' }}>Not enough balance — publishing will open M-Pesa deposit first.</p>}
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: `${NAVY}50` }}>By publishing you agree to the Market Creation Guidelines. Resolution follows your stated criteria and source.</p>
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3 flex justify-between items-center shrink-0" style={{ background: MINERAL, borderColor: `${NAVY}15` }}>
          {step > 1 ? <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 min-w-[80px] text-sm border transition-colors" style={{ borderRadius: 3, boxShadow: BV_UP, color: `${NAVY}55`, borderColor: `${NAVY}15` }}>← Back</button> : <div />}
          {step < 3
            ? <button onClick={() => canContinue && setStep(s => s + 1)} disabled={!canContinue} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: NAVY }} className="px-5 py-2.5 min-w-[120px] text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-40">Continue →</button>
            : <button onClick={() => onPublish(preview, seedAmount)} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: ORANGE }} className="px-5 py-2.5 min-w-[140px] text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all">{insufficient ? 'Deposit to publish' : `Publish · ${formatKES(seedAmount)}`}</button>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Custom Category Creator ──────────────────────────────────────────────────

function CustomCategoryModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: CustomCategory) => void }) {
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('🔷')
  const EMOJIS = ['🔷','⭐','🎯','🌟','💡','🔥','📌','🏅','🗓','💬','🧪','🎪','🛒','🌱','🎵']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: `${NAVY}50` }} onClick={onClose}>
      <div className="w-full max-w-xs overflow-hidden" style={{ background: WARM, borderRadius: 4, border: `1px solid ${NAVY}18`, boxShadow: '0 16px 48px rgba(21,43,67,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: SKY, borderBottom: `1px solid ${NAVY}15` }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-sm font-700 uppercase tracking-wider">New Category</span>
          <button onClick={onClose} className="text-[#152B43]/40 hover:text-[#152B43] text-xl w-7 h-7 flex items-center justify-center">×</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>Category Name</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Local Nairobi" className="w-full border px-3 py-2 text-sm outline-none" style={{ borderRadius: 3, boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}15` }} />
          </div>
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className="w-8 h-8 flex items-center justify-center text-lg transition-all" style={{ borderRadius: 3, background: emoji === e ? SKY : 'transparent', border: `1px solid ${emoji === e ? NAVY : NAVY + '10'}`, boxShadow: emoji === e ? BV_IN : 'none' }}>{e}</button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { if (label.trim()) { onCreate({ id: label.toLowerCase().replace(/\s+/g, '-'), label: label.trim(), emoji }); onClose() } }}
            disabled={!label.trim()}
            style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: NAVY }}
            className="w-full py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-40"
          >
            Create Category
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Portfolio Page ───────────────────────────────────────────────────────────

type PortfolioPageProps = {
  trades: PortfolioTrade[]
  balance: number
  isSignedIn: boolean
  onNavigate: (v: View) => void
  onSignIn: () => void
  onOpenCombo: () => void
}

function PortfolioPage({ trades, balance, isSignedIn, onNavigate, onSignIn, onOpenCombo }: PortfolioPageProps) {
  const open = trades.filter(t => t.status === 'open')
  const resolved = trades.filter(t => t.status !== 'open')
  const totalStaked = trades.reduce((s, t) => s + t.stake, 0)
  const totalWon = resolved.filter(t => t.status === 'won').reduce((s, t) => s + (t.payout ?? 0), 0)

  if (!isSignedIn) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY, opacity: 0.08, fontSize: 60, fontWeight: 800 }}>PORTFOLIO</div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}40` }} className="text-lg font-700 uppercase tracking-wide -mt-4">Your trades live here</div>
        <p className="text-sm max-w-xs" style={{ color: `${NAVY}35` }}>Sign in to view open positions, resolved markets, and your full trading history.</p>
        <div className="flex gap-3 flex-wrap justify-center mt-2">
          <button onClick={() => onNavigate('markets')} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_UP, background: WARM, border: `1px solid ${NAVY}20`, color: NAVY }} className="px-5 py-2.5 text-sm font-700 uppercase tracking-wider hover:brightness-95 transition-all">Trade Markets</button>
          <button onClick={onSignIn} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: NAVY }} className="px-5 py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all">Sign In</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Balance card */}
      <div className="border-b p-4" style={{ background: NAVY, borderColor: `${NAVY}22` }}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Wallet Balance</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F7D000' }} className="text-3xl font-700 mt-1">{formatKES(balance)}</div>
          </div>
          <button onClick={() => onNavigate('wallet')} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: `${WARM}15`, border: `1px solid ${WARM}20`, color: WARM }} className="px-3 py-2 text-xs font-700 uppercase tracking-wider hover:brightness-110 transition-all shrink-0">Wallet & Ledger →</button>
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: `${WARM}10` }}>
          <div><div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm font-600 text-white">{open.length}</div><div className="text-[10px] text-white/35 mt-0.5">Open positions</div></div>
          <div><div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm font-600 text-white">{formatKES(totalStaked)}</div><div className="text-[10px] text-white/35 mt-0.5">Total staked</div></div>
          <div><div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm font-600 text-white">{formatKES(totalWon)}</div><div className="text-[10px] text-white/35 mt-0.5">Total won</div></div>
          <div><div style={{ fontFamily: 'Geist Mono, monospace', color: totalWon - totalStaked >= 0 ? '#4ADE80' : ORANGE }} className="text-sm font-600">{totalWon - totalStaked >= 0 ? '+' : ''}{formatKES(totalWon - totalStaked)}</div><div className="text-[10px] text-white/35 mt-0.5">Net P&L</div></div>
        </div>
      </div>
      <PortfolioTable trades={trades} onNavigate={onNavigate} onOpenCombo={onOpenCombo} />
    </div>
  )
}

type PortfolioFilter = 'all' | 'open' | 'won' | 'lost' | 'combos'

const PORTFOLIO_FILTERS: { id: PortfolioFilter; label: string; match: (t: PortfolioTrade) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'open', label: 'Open', match: t => t.status === 'open' },
  { id: 'won', label: 'Won', match: t => t.status === 'won' },
  { id: 'lost', label: 'Lost', match: t => t.status === 'lost' },
  { id: 'combos', label: 'Combos', match: t => Boolean(t.isCombo) },
]

const TRADE_STATUS: Record<PortfolioTrade['status'], { label: string; bg: string; fg: string }> = {
  open: { label: 'Open', bg: SKY, fg: NAVY },
  won: { label: 'Won', bg: '#EBF7EE', fg: '#1F6B45' },
  lost: { label: 'Lost', bg: '#FBEAEA', fg: '#8B1A1A' },
  resolved: { label: 'Resolved', bg: MINERAL, fg: `${NAVY}80` },
}

function potentialReturn(t: PortfolioTrade): number {
  if (t.status === 'won') return t.payout ?? 0
  if (t.status === 'lost') return 0
  return Math.round(estimatePayout(t.stake, t.odds))
}

function TradeStatusPill({ status }: { status: PortfolioTrade['status'] }) {
  const s = TRADE_STATUS[status]
  return (
    <span className="inline-block px-2 py-0.5 text-[10px] font-700 uppercase tracking-wider whitespace-nowrap" style={{ background: s.bg, color: s.fg, borderRadius: 2, border: `1px solid ${s.fg}25`, fontFamily: 'Barlow Condensed, sans-serif' }}>{s.label}</span>
  )
}

function PortfolioTable({ trades, onNavigate, onOpenCombo }: { trades: PortfolioTrade[]; onNavigate: (v: View) => void; onOpenCombo: () => void }) {
  const [filter, setFilter] = useState<PortfolioFilter>('all')
  const active = PORTFOLIO_FILTERS.find(f => f.id === filter)!
  const rows = trades.filter(active.match)
  const head = 'text-[10px] uppercase tracking-widest font-600 text-white/45 px-3 py-2'

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto px-3 sm:px-4 py-3 border-b" style={{ background: WARM, borderColor: `${NAVY}12` }}>
        {PORTFOLIO_FILTERS.map(f => {
          const count = trades.filter(f.match).length
          const on = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 999, background: on ? NAVY : WARM, color: on ? WARM : `${NAVY}70`, border: `1px solid ${on ? NAVY : NAVY + '22'}`, boxShadow: on ? BV_DK : BV_UP }}
              className="px-3.5 py-1.5 text-xs font-700 uppercase tracking-wider whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all"
            >
              {f.label}
              <span className="px-1.5 text-[10px] font-700" style={{ borderRadius: 999, background: on ? ORANGE : `${NAVY}12`, color: on ? '#fff' : `${NAVY}70` }}>{count}</span>
            </button>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm" style={{ color: `${NAVY}50` }}>{filter === 'all' ? 'No trades yet. Start predicting!' : `No ${active.label.toLowerCase()} trades.`}</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => onNavigate('markets')} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_UP, background: WARM, border: `1px solid ${NAVY}20`, color: NAVY }} className="px-4 py-2 text-xs font-700 uppercase tracking-wider">Browse Markets</button>
            <button onClick={onOpenCombo} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: '#6B21A8' }} className="px-4 py-2 text-xs font-700 uppercase tracking-wider text-white">Start Combo</button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <table className="hidden md:table w-full text-left border-collapse">
            <thead style={{ background: NAVY, fontFamily: 'Barlow Condensed, sans-serif' }}>
              <tr>
                <th className={head}>Market</th>
                <th className={head}>Position / Outcome</th>
                <th className={`${head} text-right`}>Entry Odds</th>
                <th className={`${head} text-right`}>Stake (KES)</th>
                <th className={`${head} text-right`}>Potential Return (KES)</th>
                <th className={head}>Status</th>
                <th className={`${head} text-right`}>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr key={t.id} className="border-b" style={{ background: i % 2 === 0 ? WARM : SKY, borderColor: `${NAVY}10` }}>
                  <td className="px-3 py-2.5 text-xs max-w-[320px]" style={{ color: NAVY }}>
                    <div className="truncate">{t.market}</div>
                    {t.isCombo && <div className="text-[10px] mt-0.5" style={{ color: '#6B21A8' }}>Combo · {t.comboLegs} legs</div>}
                  </td>
                  <td className="px-3 py-2.5"><span className="text-xs font-700 px-2 py-0.5 text-white" style={{ background: t.isCombo ? '#6B21A8' : NAVY, borderRadius: 2, fontFamily: 'Barlow Condensed, sans-serif' }}>{t.position}</span></td>
                  <td className="px-3 py-2.5 text-xs text-right" style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }}>{t.isCombo ? '—' : `${t.odds}%`}</td>
                  <td className="px-3 py-2.5 text-xs text-right" style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }}>{t.stake.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs text-right font-700" style={{ fontFamily: 'Geist Mono, monospace', color: t.status === 'lost' ? `${NAVY}45` : '#1F6B45' }}>{potentialReturn(t).toLocaleString()}</td>
                  <td className="px-3 py-2.5"><TradeStatusPill status={t.status} /></td>
                  <td className="px-3 py-2.5 text-[11px] text-right whitespace-nowrap" style={{ color: `${NAVY}55` }}>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="md:hidden p-3 space-y-2">
            {rows.map(t => (
              <div key={t.id} className="border p-3" style={{ background: WARM, borderRadius: 4, borderColor: `${NAVY}15` }}>
                <div className="flex items-start gap-2">
                  <div className="text-xs font-500 flex-1 min-w-0 leading-snug" style={{ color: NAVY }}>{t.market}</div>
                  <div className="shrink-0"><TradeStatusPill status={t.status} /></div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2.5 pt-2.5 border-t" style={{ borderColor: `${NAVY}10` }}>
                  {[
                    ['Position', t.isCombo ? `${t.position} · ${t.comboLegs} legs` : t.position],
                    ['Entry odds', t.isCombo ? '—' : `${t.odds}%`],
                    ['Stake', formatKES(t.stake)],
                    ['Potential return', formatKES(potentialReturn(t))],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <div className="text-[9px] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }}>{label}</div>
                      <div className="text-xs font-600 truncate" style={{ fontFamily: 'Geist Mono, monospace', color: label === 'Potential return' && t.status !== 'lost' ? '#1F6B45' : NAVY }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] mt-2" style={{ color: `${NAVY}45` }}>{t.date}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Wallet Page ──────────────────────────────────────────────────────────────

type WalletFilter = 'all' | 'deposits' | 'withdrawals' | 'trades' | 'winnings' | 'pending'

const WALLET_FILTERS: { id: WalletFilter; label: string; match: (e: WalletEntry) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'deposits', label: 'Deposits', match: e => e.type === 'deposit' },
  { id: 'withdrawals', label: 'Withdrawals', match: e => e.type === 'withdrawal' },
  { id: 'trades', label: 'Trades', match: e => e.type === 'bet' || e.type === 'combo' || e.type === 'seed' },
  { id: 'winnings', label: 'Winnings', match: e => e.type === 'win' },
  { id: 'pending', label: 'Pending', match: e => e.status === 'pending' },
]

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit', withdrawal: 'Withdrawal', bet: 'Prediction',
  win: 'Winnings', seed: 'Market seed', combo: 'Multi-prediction', loss: 'Loss',
}

function WalletPage({ balance, entries, onDeposit, onWithdraw }: { balance: number; entries: WalletEntry[]; onDeposit: () => void; onWithdraw: () => void }) {
  const [filter, setFilter] = useState<WalletFilter>('all')
  const rows = entries.filter(e => (WALLET_FILTERS.find(f => f.id === filter) ?? WALLET_FILTERS[0]!).match(e))

  const statusPill = (status: WalletEntry['status']) => (
    <span
      style={{
        fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3,
        background: status === 'completed' ? '#2A6B3A18' : `${ORANGE}18`,
        color: status === 'completed' ? '#2A6B3A' : ORANGE,
        border: `1px solid ${status === 'completed' ? '#2A6B3A' : ORANGE}35`,
      }}
      className="px-2 py-0.5 text-[10px] font-700 uppercase tracking-wider"
    >
      {status === 'completed' ? 'Completed' : 'Pending'}
    </span>
  )

  const amountEl = (e: WalletEntry) => (
    <span style={{ fontFamily: 'Geist Mono, monospace', color: e.sign === '+' ? '#2A6B3A' : ORANGE, fontWeight: 700 }} className="text-sm whitespace-nowrap">
      {e.sign}{formatKES(e.amount)}
    </span>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b p-4" style={{ background: NAVY }}>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Available Balance</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F7D000' }} className="text-3xl font-700 mt-1">{formatKES(balance)}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={onDeposit} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: '#2A7B6F' }} className="px-4 py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all">+ Deposit</button>
            <button onClick={onWithdraw} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: ORANGE }} className="px-4 py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all">Withdraw</button>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-3 py-2.5 border-b overflow-x-auto" style={{ background: MINERAL, borderColor: `${NAVY}15` }}>
        <div className="flex gap-1.5 min-w-max">
          {WALLET_FILTERS.map(f => {
            const count = entries.filter(f.match).length
            const active = filter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3,
                  boxShadow: active ? BV_DK : BV_UP,
                  background: active ? NAVY : WARM,
                  color: active ? WARM : `${NAVY}65`,
                  border: `1px solid ${active ? NAVY : NAVY + '18'}`,
                }}
                className="px-3 py-1.5 text-xs font-700 uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                {f.label}
                <span style={{ fontFamily: 'Geist Mono, monospace', opacity: 0.7 }} className="text-[10px]">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <div className="grid px-4 py-2 border-b" style={{ gridTemplateColumns: '110px minmax(0,1fr) 130px 110px 120px', background: SKY, borderColor: `${NAVY}12` }}>
          {['Date', 'Transaction', 'Type', 'Status', 'Amount'].map((h, i) => (
            <div key={h} style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}55` }} className={`text-[10px] uppercase tracking-widest font-700 ${i === 4 ? 'text-right' : ''}`}>{h}</div>
          ))}
        </div>
        {rows.map((e, i) => (
          <div key={e.id} className="grid items-center px-4 py-3 border-b" style={{ gridTemplateColumns: '110px minmax(0,1fr) 130px 110px 120px', background: i % 2 === 0 ? WARM : `${SKY}60`, borderColor: `${NAVY}08` }}>
            <div className="text-[11px]" style={{ color: `${NAVY}50`, fontFamily: 'Geist Mono, monospace' }}>{e.date}</div>
            <div className="text-xs font-500 truncate pr-3" style={{ color: NAVY }}>{e.description}</div>
            <div className="text-[11px] font-600" style={{ color: `${NAVY}70` }}>{TYPE_LABELS[e.type] ?? e.type}</div>
            <div>{statusPill(e.status)}</div>
            <div className="text-right">{amountEl(e)}</div>
          </div>
        ))}
      </div>

      {/* Mobile records */}
      <div className="sm:hidden">
        {rows.map((e, i) => (
          <div key={e.id} className="px-4 py-3 border-b space-y-2" style={{ background: i % 2 === 0 ? WARM : `${SKY}60`, borderColor: `${NAVY}08` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-600" style={{ color: NAVY }}>{e.description}</div>
                <div className="text-[10px] mt-0.5" style={{ color: `${NAVY}45`, fontFamily: 'Geist Mono, monospace' }}>{e.date}</div>
              </div>
              {amountEl(e)}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}55` }} className="text-[10px] uppercase tracking-widest font-700">{TYPE_LABELS[e.type] ?? e.type}</span>
              {statusPill(e.status)}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-xs" style={{ color: `${NAVY}45` }}>No transactions in this filter yet.</div>
          <button onClick={onDeposit} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#2A7B6F', boxShadow: BV_DK }} className="mt-3 px-4 py-2 text-xs font-700 uppercase tracking-wider text-white">Deposit funds</button>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton pages (Profile, Account, Settings, Notifications, Language) ─────

function SkeletonPage({ title, icon, children }: { title: string; icon: string; children?: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b px-4 py-4" style={{ background: NAVY }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Polka.trade</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xl">{icon}</span>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-lg font-700 text-white uppercase tracking-wide">{title}</div>
        </div>
      </div>
      {children ?? (
        <div className="p-6 space-y-3">
          {[80, 60, 95, 70, 50].map((w, i) => (
            <div key={i} className="h-10 rounded animate-pulse" style={{ width: `${w}%`, background: `${NAVY}08` }} />
          ))}
          <div className="mt-6 p-4 border rounded" style={{ borderColor: `${NAVY}10`, background: MINERAL, borderRadius: 3 }}>
            <div className="text-xs" style={{ color: `${NAVY}35` }}>This section is coming soon.</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfilePage({ profile, onSave }: { profile: PolkaProfile; onSave: (p: PolkaProfile) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [error, setError] = useState('')
  const save = () => {
    if (!draft.name.trim() || !/\S+@\S+\.\S+/.test(draft.email) || !/^254\d{9}$/.test(draft.phone.replace(/\D/g, ''))) { setError('Enter a name, valid email and Safaricom number (254XXXXXXXXX).'); return }
    onSave({ ...profile, name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.replace(/\D/g, '') })
    setError(''); setEditing(false)
  }
  return (
    <SkeletonPage title="My Profile" icon="👤">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4 p-4 border" style={{ background: SKY, borderColor: `${NAVY}15`, borderRadius: 3 }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-700 text-white shrink-0" style={{ background: ORANGE, boxShadow: BV_DK }}>{profile.name[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-base font-700 uppercase">{profile.name}</div>
            <div className="text-xs mt-0.5" style={{ color: `${NAVY}50` }}>Member since {profile.joined}</div>
            {profile.verified && <div className="text-[10px] font-600 mt-1" style={{ color: '#2A7B6F' }}>✓ KYC Verified</div>}
          </div>
        </div>
        {(['name', 'phone', 'email'] as const).map(field => <label key={field} className="block text-xs font-600 capitalize" style={{ color: NAVY }}>{field === 'name' ? 'Display Name' : field}
          {editing ? <input aria-label={field === 'name' ? 'Display Name' : field} value={draft[field]} onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))} className="block w-full border px-3 py-2 mt-1" style={{ borderColor: `${NAVY}20`, background: WARM, borderRadius: 3 }} /> : <span className="block border px-3 py-3 mt-1 font-400" style={{ borderColor: `${NAVY}10`, background: WARM, borderRadius: 3 }}>{profile[field]}</span>}
        </label>)}
        {error && <p role="alert" className="text-xs" style={{ color: ORANGE }}>{error}</p>}
        {editing ? <div className="flex gap-2"><button onClick={save} className="flex items-center gap-1 px-4 py-2 text-white" style={{ background: '#2A7B6F', borderRadius: 3 }}><Check size={15} /> Save Changes</button><button onClick={() => { setDraft(profile); setError(''); setEditing(false) }} className="flex items-center gap-1 px-4 py-2 border" style={{ borderRadius: 3 }}><X size={15} /> Cancel</button></div> : <button onClick={() => { setDraft(profile); setEditing(true) }} className="flex items-center gap-1 px-4 py-2 border" style={{ borderRadius: 3 }}><Pencil size={15} /> Edit Profile</button>}
      </div>
    </SkeletonPage>
  )
}

function AccountPage({ profile, onPasswordChange }: { profile: PolkaProfile; onPasswordChange: (current: string, next: string) => boolean }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const save = () => {
    if (!current || next.length < 8 || next !== confirm) { setError('Enter your current password and a matching new password of at least 8 characters.'); return }
    if (!onPasswordChange(current, next)) { setError('Current password does not match.'); return }
    setOpen(false); setCurrent(''); setNext(''); setConfirm(''); setError('')
  }
  return (
    <SkeletonPage title="My Account" icon="⚙️">
      <div className="p-4 space-y-3">
        {[
          { label: 'Login Email', value: profile.email },
          { label: 'Phone Number', value: profile.phone ? `•••• ${profile.phone.slice(-4)}` : 'Not set' },
          { label: 'KYC Status', value: profile.verified ? 'Verified ✓' : 'Not verified' },
          { label: 'Active Sessions', value: '1 active session' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-3 py-3 border" style={{ background: WARM, borderColor: `${NAVY}10`, borderRadius: 3 }}>
            <span className="text-xs" style={{ color: `${NAVY}50`, fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-500" style={{ color: NAVY, fontFamily: 'Geist Mono, monospace' }}>{value}</span>
            </div>
          </div>
        ))}
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 border text-sm" style={{ color: NAVY, borderRadius: 3 }}><Lock size={15} /> Change Password</button>
        {open && <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" style={{ background: `${NAVY}90` }} onClick={() => setOpen(false)}><div role="dialog" aria-label="Change Password" className="w-full max-w-sm p-5 space-y-3" style={{ background: WARM, borderRadius: 4 }} onClick={e => e.stopPropagation()}><div className="flex justify-between"><h2 className="font-700" style={{ color: NAVY }}>Change Password</h2><button aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button></div>{[[current, setCurrent, 'Current Password'], [next, setNext, 'New Password'], [confirm, setConfirm, 'Confirm New Password']].map(([value, setter, label]) => <label key={label as string} className="block text-xs" style={{ color: NAVY }}>{label as string}<input type="password" value={value as string} onChange={e => (setter as (value: string) => void)(e.target.value)} className="w-full border px-3 py-2 mt-1" style={{ borderRadius: 3 }} /></label>)}{error && <p role="alert" className="text-xs" style={{ color: ORANGE }}>{error}</p>}<button onClick={save} className="w-full py-2 text-white" style={{ background: '#2A7B6F', borderRadius: 3 }}>Save Password</button></div></div>}
      </div>
    </SkeletonPage>
  )
}

function SettingsPage({ settings, onChange, oddsFormat, onOddsChange, onAccount }: { settings: PolkaSettings; onChange: (s: PolkaSettings) => void; oddsFormat: PolkaProfile['oddsFormat']; onOddsChange: (mode: PolkaProfile['oddsFormat']) => void; onAccount: () => void }) {
  return (
    <SkeletonPage title="Settings" icon="⚙️">
      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between gap-3 border-b py-3 text-sm" style={{ color: NAVY }}><span>Default Odds Display</span><div className="flex border" style={{ borderRadius: 3 }}>{(['percent', 'multiplier'] as const).map(m => <button key={m} onClick={() => onOddsChange(m)} aria-pressed={oddsFormat === m} className="px-3 py-2 text-xs" style={{ background: oddsFormat === m ? NAVY : WARM, color: oddsFormat === m ? WARM : NAVY }}>{m === 'percent' ? '40%' : '2.50x'}</button>)}</div></div>
        {([['confirmTrade', 'Trade Confirmation Prompt'], ['autoAddToMultiSlip', 'Auto-add to Multi-Slip'], ['leaderboardPublic', 'Leaderboard Privacy · Public']] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3 border-b py-3 text-sm" style={{ color: NAVY }}><span>{label}</span><input type="checkbox" checked={settings[key]} onChange={e => onChange({ ...settings, [key]: e.target.checked })} className="w-5 h-5 accent-[#2A7B6F]" /></label>)}
        <button onClick={onAccount} className="flex items-center gap-2 text-sm underline" style={{ color: NAVY }}>Security & password <span aria-hidden>→</span></button>
      </div>
    </SkeletonPage>
  )
}

function NotificationsPage() {
  const NOTIFS = [
    { icon: '⚡', title: 'Combo confirmed', body: 'Combo #1 — 3 positions · KES 103', time: '2h ago', read: false },
    { icon: '✅', title: 'Market resolved — WIN', body: 'AFCON 2025 · Morocco · +KES 1,100', time: '15d ago', read: true },
    { icon: '✅', title: 'Market resolved — WIN', body: 'Premier League · Arsenal · +KES 616', time: '20d ago', read: true },
    { icon: '🔔', title: 'Market closing soon', body: 'GPT-5 before July 2025 · 3 days left', time: '1d ago', read: false },
    { icon: '💼', title: 'Deposit confirmed', body: 'KES 5,000 received via M-PESA', time: '12d ago', read: true },
  ]
  return (
    <SkeletonPage title="Notifications" icon="🔔">
      <div className="divide-y" style={{ borderColor: `${NAVY}08` }}>
        {NOTIFS.map((n, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ background: n.read ? (i % 2 === 0 ? WARM : SKY) : `${SKY}`, borderLeft: n.read ? 'none' : `3px solid ${ORANGE}` }}>
            <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-600" style={{ color: NAVY }}>{n.title}</div>
                <div className="text-[10px] shrink-0" style={{ color: `${NAVY}35` }}>{n.time}</div>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: `${NAVY}55` }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </SkeletonPage>
  )
}

function LanguagePage() {
  const LANGS = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧', active: true },
    { code: 'sw', label: 'Swahili', native: 'Kiswahili', flag: '🇰🇪', active: false },
    { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', active: false },
    { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦', active: false },
  ]
  return (
    <SkeletonPage title="Language" icon="🌐">
      <div className="p-4 space-y-2">
        <p className="text-xs mb-4" style={{ color: `${NAVY}45` }}>More languages coming soon. Kiswahili support is in development.</p>
        {LANGS.map((l, i) => (
          <div key={l.code} className="flex items-center gap-3 px-3 py-3 border cursor-pointer" style={{ background: l.active ? SKY : WARM, borderColor: l.active ? `${NAVY}30` : `${NAVY}10`, borderRadius: 3, borderWidth: l.active ? 2 : 1 }}>
            <span className="text-2xl">{l.flag}</span>
            <div className="flex-1">
              <div className="text-sm font-500" style={{ color: NAVY }}>{l.label}</div>
              <div className="text-[11px]" style={{ color: `${NAVY}45` }}>{l.native}</div>
            </div>
            {l.active && <span className="text-xs font-700" style={{ color: '#2A7B6F' }}>✓ Active</span>}
            {!l.active && <span className="text-[10px] px-2 py-0.5 border" style={{ color: `${NAVY}40`, borderColor: `${NAVY}15`, borderRadius: 2 }}>Soon</span>}
          </div>
        ))}
      </div>
    </SkeletonPage>
  )
}

// ─── Terms ────────────────────────────────────────────────────────────────────

function TermsView({ onClose }: { onClose: () => void }) {
  const TERMS = [
    { title: '1. Nature of Service — Prediction Market, Not a Sportsbook', body: `Polka.trade is a peer-to-peer prediction market platform. It is not a sportsbook, casino, lottery, or bookmaker. Users trade shares representing the probability that a specified future event will occur. Polka.trade does not set odds, does not act as a bookmaker, and does not take positions against users. All trades occur between users on an open market. The price of a YES or NO share reflects the collective market belief in the probability of an outcome — not a fixed payout offered by Polka.trade.` },
    { title: '2. Parimutuel Payout Structure', body: `All markets on Polka.trade resolve using parimutuel math. The total pool of bets is collected. At resolution, winners receive: (their stake ÷ total winning pool) × total pool × 98%. The platform retains 2% of every resolved pool as its fee. This structure guarantees the platform never pays out more than was collected, and that winners are always paid from losers' contributions.` },
    { title: '3. Eligibility', body: `You must be at least 18 years of age to use Polka.trade. Polka.trade is operated for and by Kenyan users but is not affiliated with, licensed by, or operating under the Betting Control and Licensing Board (BCLB) of Kenya, as it does not constitute betting under applicable Kenyan law.` },
    { title: '4. Market Creation & Seeding', body: `Any verified user may create a market by paying a KES 149 seed. This seed initialises the YES and NO pools according to the creator's chosen starting probability. The seed participates in the market like any other position. Creators may not trade in their own markets in the first 24 hours after creation.` },
    { title: '5. Combo Bets', body: `The Combo feature allows users to stack multiple market positions into a single checkout. Each position is treated as an independent prediction. The Combo function is a convenience tool — it does not create a traditional parlay. Payouts are calculated individually per position, and the combo total is split evenly across legs.` },
    { title: '6. Responsible Participation', body: `Prediction markets involve financial risk. You may lose the full value of your invested amount. Polka.trade provides spending limits, cooling-off periods, and self-exclusion. If you believe you have a problem, contact the Kenya Responsible Gambling Foundation.` },
    { title: '7. KYC & AML Compliance', body: `Polka.trade complies with Kenya's POCAMLA. KYC is required before withdrawing funds. Suspicious transactions are reported to the Financial Reporting Centre (FRC) of Kenya.` },
    { title: '8. Dispute Resolution', body: `Disputes must be submitted within 72 hours of resolution. Unresolved disputes go to binding arbitration under NCIA rules. Governed by the laws of Kenya.` },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ background: `${NAVY}50` }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[88dvh] flex flex-col overflow-hidden" style={{ background: WARM, borderRadius: 4, border: `1px solid ${NAVY}18` }} onClick={e => e.stopPropagation()}>
        <div className="border-b px-4 py-4 flex items-center justify-between shrink-0" style={{ background: SKY, borderColor: `${NAVY}15`, boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset' }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-[10px] uppercase tracking-widest font-600">Legal Document</div>
            <div className="text-sm font-600 mt-0.5" style={{ color: NAVY }}>Terms & Conditions — Polka.trade</div>
          </div>
          <button onClick={onClose} className="text-[#152B43]/40 hover:text-[#152B43] text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          {TERMS.map(({ title, body }) => (
            <div key={title}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-sm font-700 uppercase tracking-wide mb-1.5">{title}</div>
              <p className="text-xs leading-relaxed" style={{ color: `${NAVY}65` }}>{body}</p>
            </div>
          ))}
          <p className="text-[10px] pt-4 border-t" style={{ color: `${NAVY}35`, borderColor: `${NAVY}10` }}>Last updated: January 2025 · Polka.trade · Nairobi, Kenya</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function BrandSplash() {
  const [hidden, setHidden] = useState(false)
  const [fading, setFading] = useState(false)
  useEffect(() => {
    const a = setTimeout(() => setFading(true), 1100)
    const b = setTimeout(() => setHidden(true), 1750)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  if (hidden) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700"
      style={{ background: NAVY, opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src={polkaLogo.url}
          alt="Polka"
          className="h-16 w-auto object-contain animate-in fade-in zoom-in-95 duration-700"
        />
        <div className="h-[2px] w-24 overflow-hidden" style={{ background: `${WARM}25` }}>
          <div className="h-full w-full origin-left animate-in slide-in-from-left duration-1000" style={{ background: ORANGE }} />
        </div>
      </div>
    </div>
  )
}

function PolkaAppInner() {
  const { push } = useToasts()
  const { bump } = useLive()
  const [showTutorial, setShowTutorial] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  // Auth & balance
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userPhone, setUserPhone] = useState('')
  const [authPrompt, setAuthPrompt] = useState<string | null>(null)
  const requireAuth = (reason: string, fn: () => void) => {
    if (!isSignedIn) { setAuthPrompt(reason); return }
    fn()
  }
  const [balance, setBalance] = useState(MOCK_PROFILE.balance)
  const [markets, setMarkets] = useState<Market[]>(MARKETS)
  const [infoTab, setInfoTab] = useState<InfoTab | null>(null)

  // Navigation
  const [activeView, setActiveView] = useState<View>('markets')
  const [activeCategory, setActiveCategory] = useState<CategoryId>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'trending' | 'volume'>('trending')

  // Modals & overlays
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCustomCat, setShowCustomCat] = useState(false)

  // Combo
  const [comboOpen, setComboOpen] = useState(false)
  const [comboMode, setComboMode] = useState(false)
  const [comboPositions, setComboPositions] = useState<ComboPosition[]>([])
  const [newlyAdded, setNewlyAdded] = useState<number[]>([])

  // Portfolio & wallet
  const [portfolio, setPortfolio] = useState<PortfolioTrade[]>(INITIAL_PORTFOLIO)
  const [walletEntries, setWalletEntries] = useState<WalletEntry[]>(INITIAL_WALLET)

  const goTo = (v: View) => {
    if (PRIVATE_VIEWS.includes(v)) requireAuth(`Sign in to open your ${v}`, () => setActiveView(v))
    else setActiveView(v)
  }
  useEffect(() => {
    if (!isSignedIn && PRIVATE_VIEWS.includes(activeView)) setActiveView('markets')
  }, [isSignedIn, activeView])
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('market'))
    const m = MARKETS.find(x => x.id === id)
    if (m) setSelectedMarket(m)
  }, [])

  // Custom categories
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])

  // ── Derived data
  const allCategories: (CatDef & { custom?: boolean })[] = [
    ...BASE_CATEGORIES,
    ...customCategories.map(c => ({ id: c.id, label: c.label, icon: c.emoji, custom: true })),
  ]

  const myMarketIds = new Set(
    portfolio.map(t => t.marketId).filter((v): v is number => typeof v === 'number'),
  )
  const feedFilter = FEED_FILTERS.some(f => f.id === activeCategory) ? String(activeCategory) : null
  const filterCounts: Record<string, number> = {
    my: markets.filter(m => myMarketIds.has(m.id)).length,
    closed: markets.filter(m => !m.isResolved && marketStatus(m) === 'closed').length,
    resolved: markets.filter(m => Boolean(m.isResolved)).length,
    disputed: 0,
  }

  const filteredMarkets = markets
    .filter(m => {
      if (feedFilter === 'my') return myMarketIds.has(m.id)
      if (feedFilter === 'closed') return !m.isResolved && marketStatus(m) === 'closed'
      if (feedFilter === 'resolved') return Boolean(m.isResolved)
      if (feedFilter === 'disputed') return false
      if (activeCategory === 'All') return !myMarketIds.has(m.id)
      return m.category === activeCategory
    })
    .filter(m => m.question.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isResolved && !b.isResolved) return 1
      if (!a.isResolved && b.isResolved) return -1
      if (sortBy === 'trending') return ((b.trending ? 1 : 0) + (b.isLive ? 1 : 0)) - ((a.trending ? 1 : 0) + (a.isLive ? 1 : 0))
      return b.volume - a.volume
    })

  const liveCount = markets.filter(m => m.isLive && !m.isResolved).length

  // ── Combo actions
  const addToCombo = (market: Market, position: string, odds: number, customAmount?: number) => {
    const existing = comboPositions.find(p => p.marketId === market.id)
    if (existing) {
      setComboPositions(ps => ps.map(p => p.marketId === market.id ? { ...p, position, odds, customAmount, isNew: true } : p))
    } else {
      setComboPositions(ps => [...ps, { marketId: market.id, marketQuestion: market.question, position, odds, customAmount, isNew: true }])
    }
    setNewlyAdded(ids => [...ids, market.id])
    setTimeout(() => setNewlyAdded(ids => ids.filter(id => id !== market.id)), 1500)
    setComboOpen(true)
    setComboMode(true)
  }

  const removeFromCombo = (marketId: number) => {
    setComboPositions(ps => ps.filter(p => p.marketId !== marketId))
  }

  const clearCombo = () => {
    setComboPositions([])
    setComboMode(false)
  }

  const checkoutCombo = (addedAmount: number) => {
    if (comboPositions.length === 0) return
    const { totalStake } = comboMath(comboPositions.length, addedAmount, comboPositions)
    const newEntry: WalletEntry = {
      id: `w${Date.now()}`,
      type: 'combo',
      amount: totalStake,
      description: `Combo — ${comboPositions.length} positions`,
      date: 'Just now',
      status: 'completed',
      sign: '-',
    }
    const newTrade: PortfolioTrade = {
      id: `c${Date.now()}`,
      market: `Combo — ${comboPositions.length} markets`,
      position: 'Multi-position',
      stake: totalStake,
      odds: 0,
      status: 'open',
      date: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
      isCombo: true,
      comboLegs: comboPositions.length,
    }
    setBalance(b => b - totalStake)
    setWalletEntries(ws => [newEntry, ...ws])
    setPortfolio(ps => [newTrade, ...ps])
    clearCombo()
    setComboOpen(false)
    setActiveView('portfolio')
  }

  const confirmTrade = (market: Market, position: string, odds: number, amount: number) => {
    const entry: WalletEntry = {
      id: `w${Date.now()}`,
      type: 'bet',
      amount,
      description: `${position} — ${market.question}`,
      date: 'Just now',
      status: 'completed',
      sign: '-',
    }
    const trade: PortfolioTrade = {
      id: `t${Date.now()}`,
      marketId: market.id,
      market: market.question,
      position,
      stake: amount,
      odds,
      status: 'open',
      date: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    }
    setBalance(b => b - amount)
    setWalletEntries(ws => [entry, ...ws])
    setPortfolio(ps => [trade, ...ps])
    bump(market.id, position === 'NO' ? -1 : 1, amount)
    push('Prediction recorded — added to portfolio')
    setSelectedMarket(null)
    setActiveView('portfolio')
  }

  const publishMarket = (market: Market, seed: number) => {
    if (balance < seed) {
      push(`Insufficient balance — deposit at least ${formatKES(seed - balance)} to fund this market`, 'warn')
      setShowDeposit(true)
      return
    }
    const entry: WalletEntry = {
      id: `w${Date.now()}`,
      type: 'seed',
      amount: seed,
      description: `Market seed — ${market.question}`,
      date: 'Just now',
      status: 'completed',
      sign: '-',
    }
    setBalance(b => b - seed)
    setWalletEntries(ws => [entry, ...ws])
    setMarkets(ms => [market, ...ms])
    setShowCreate(false)
    setActiveCategory('All')
    setActiveView('markets')
    push('Market published — now live in the feed')
  }

  const handleDeposit = (amount: number) => {
    const entry: WalletEntry = {
      id: `w${Date.now()}`,
      type: 'deposit',
      amount,
      description: `M-PESA Deposit`,
      date: 'Just now',
      status: 'completed',
      sign: '+',
    }
    setBalance(b => b + amount)
    setWalletEntries(ws => [entry, ...ws])
  }

  const handleWithdraw = (amount: number, phone: string) => {
    const digits = phone.replace(/\D/g, '')
    const maskedPhone = digits.length >= 4 ? `•••• ${digits.slice(-4)}` : 'M-PESA'
    const entry: WalletEntry = {
      id: `w${Date.now()}`,
      type: 'withdrawal',
      amount,
      description: `M-PESA withdrawal to ${maskedPhone}`,
      date: 'Just now',
      status: 'pending',
      sign: '-',
    }
    setBalance(current => current - amount)
    setWalletEntries(current => [entry, ...current])
    push('Withdrawal queued in your ledger', 'info')
  }

  // Page content for secondary views
  const isSecondaryView = !['markets', 'portfolio', 'leaderboard'].includes(activeView)

  return (
    <div className="min-h-full flex flex-col" style={{ background: MINERAL, fontFamily: 'Geist, Inter, system-ui, sans-serif' }}>

      <BrandSplash />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b" style={{ background: NAVY, borderColor: `${NAVY}22`, boxShadow: '0 2px 8px rgba(21,43,67,0.25)' }}>
        <div className="flex items-center h-16 px-3 sm:px-4 gap-2">
          {/* Logo */}
          <button onClick={() => setActiveView('markets')} className="shrink-0 mr-2 sm:mr-4 hover:opacity-80 transition-opacity">
            <img src={polkaLogo.url} alt="Polka" className="block h-9 sm:h-11 w-auto object-contain" />
          </button>


          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1">
            {([
              { key: 'markets', label: 'Markets' },
              { key: 'portfolio', label: 'Portfolio' },
              { key: 'leaderboard', label: 'Leaderboard' },
            ] as { key: View; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => goTo(key)}
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 2 }}
                className={`px-3 py-1.5 text-sm font-600 uppercase tracking-wider whitespace-nowrap transition-colors ${activeView === key ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
            {/* Combo link — desktop */}
            <button
              onClick={() => { setComboOpen(o => !o); setComboMode(true) }}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#F7D000', boxShadow: BV_DK, color: '#6B21A8', marginLeft: 4 }}
              className="px-3 py-1.5 text-sm font-800 uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 flex items-center gap-1.5"
            >
              {comboPositions.length > 0 && (
                <span className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center text-white font-700" style={{ background: '#6B21A8' }}>{comboPositions.length}</span>
              )}
              <NavIcons.combo size={14} /> Combo
            </button>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <OddsToggle />
            {isSignedIn && (
              <button
                onClick={() => setActiveView('wallet')}
                style={{ fontFamily: 'Geist Mono, monospace', borderRadius: 3, boxShadow: BV_DK, background: '#F7D000', color: '#6B21A8' }}
                className="px-3 py-1.5 text-xs sm:text-sm font-700 whitespace-nowrap hover:brightness-110 transition-all active:scale-95"
              >
                Bal. {balance.toFixed(2)} KSH
              </button>
            )}
            {isSignedIn ? (
              <button
                onClick={() => setShowDeposit(true)}
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: '#2A7B6F' }}
                className="px-3 py-1.5 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all hidden sm:block"
              >
                Deposit
              </button>
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: ORANGE }}
                className="px-4 py-1.5 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all"
              >
                Sign In
              </button>
            )}
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 text-white/70 hover:text-white transition-colors"
            >
              <span className="w-5 h-0.5 bg-current rounded-full" />
              <span className="w-5 h-0.5 bg-current rounded-full" />
              <span className="w-5 h-0.5 bg-current rounded-full" />
            </button>
          </div>
        </div>

        {/* Mobile bottom nav strip */}
        <div className="sm:hidden flex border-t" style={{ background: '#0f2035', borderColor: 'rgba(255,255,255,0.06)' }}>
          {([
            { key: 'markets', label: 'Markets', Icon: NavIcons.markets },
            { key: 'portfolio', label: 'Portfolio', Icon: NavIcons.portfolio },
            { key: 'leaderboard', label: 'Scores', Icon: NavIcons.leaderboard },
            { key: 'wallet', label: 'Wallet', Icon: NavIcons.wallet },
          ] as { key: View; label: string; Icon: typeof NavIcons.markets }[]).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => goTo(key)}
              className="flex-1 flex flex-col items-center py-2 transition-colors"
              style={{ color: activeView === key ? '#F7D000' : 'rgba(255,255,255,0.35)' }}
            >
              <Icon size={17} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[9px] font-600 uppercase tracking-wider mt-0.5">{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Live ticker ── */}
      {activeView === 'markets' && (
        <div className="border-b overflow-hidden" style={{ background: SKY, borderColor: `${NAVY}15` }}>
          <div className="flex items-center gap-3 px-3 sm:px-4 py-1.5 overflow-x-auto">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ORANGE }} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: ORANGE }} className="text-[11px] font-700 uppercase tracking-widest whitespace-nowrap">{liveCount} Live</span>
            </span>
            {markets.filter(m => m.isLive && !m.isResolved).map(m => (
              <button key={m.id} onClick={() => setSelectedMarket(m)} className="shrink-0 flex items-center gap-1.5 text-[11px] hover:text-[#152B43] transition-colors whitespace-nowrap" style={{ color: `${NAVY}65` }}>
                <span className="max-w-[130px] truncate">{m.question}</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY, fontWeight: 600 }}>{m.yesOdds}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar — desktop only, markets view only */}
        {activeView === 'markets' && (
          <aside className="hidden md:flex flex-col w-40 lg:w-44 shrink-0 border-r" style={{ background: WARM, borderColor: `${NAVY}12` }}>
            <div className="p-2.5 flex-1 overflow-y-auto">
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}35` }} className="text-[10px] uppercase tracking-widest font-600 mb-1.5 px-1">Categories</div>
              {allCategories.map(cat => (
                <button
                  key={String(cat.id)}
                  onClick={() => setActiveCategory(cat.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs font-500 text-left transition-colors"
                  style={{ borderRadius: 2, background: activeCategory === cat.id ? SKY : 'transparent', color: activeCategory === cat.id ? NAVY : `${NAVY}55` }}
                >
                  <span className="flex items-center shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                  {activeCategory === cat.id && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ORANGE }} />}
                </button>
              ))}
              <button
                onClick={() => setShowCustomCat(true)}
                className="w-full flex items-center gap-2 px-2 py-2 text-xs font-500 text-left transition-colors mt-1 border-t"
                style={{ borderColor: `${NAVY}10`, color: `${NAVY}35` }}
              >
                <span>＋</span><span>New category</span>
              </button>
            </div>
            <div className="p-2.5 border-t" style={{ borderColor: `${NAVY}10` }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}35` }} className="text-[10px] uppercase tracking-widest font-600 mb-1.5 px-1">Platform</div>
              {[{ label: 'Markets', val: markets.length }, { label: 'Live', val: liveCount }, { label: 'Traders', val: '14.2K' }].map(({ label, val }) => (
                <div key={label} className="flex justify-between px-2 py-1.5 text-xs">
                  <span style={{ color: `${NAVY}45` }}>{label}</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', color: NAVY, fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col">

          {/* Markets view */}
          {activeView === 'markets' && (
            <>
              {/* Mobile categories */}
              <div className="md:hidden flex gap-1.5 px-3 py-2 overflow-x-auto border-b" style={{ background: WARM, borderColor: `${NAVY}10` }}>
                {allCategories.map(cat => (
                  <button
                    key={String(cat.id)}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{ borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: activeCategory === cat.id ? BV_DK : BV_UP, background: activeCategory === cat.id ? NAVY : WARM, color: activeCategory === cat.id ? WARM : `${NAVY}55`, border: `1px solid ${activeCategory === cat.id ? NAVY : NAVY + '15'}` }}
                    className="shrink-0 px-2.5 py-1.5 text-[11px] font-600 uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1"
                  >
                    <span className="flex items-center">{cat.icon}</span><span>{cat.label}</span>
                  </button>
                ))}
                <button onClick={() => setShowCustomCat(true)} style={{ borderRadius: 3, boxShadow: BV_UP, border: `1px solid ${NAVY}15`, color: `${NAVY}35`, background: WARM, fontFamily: 'Barlow Condensed, sans-serif' }} className="shrink-0 px-2.5 py-1.5 text-[11px] font-600 uppercase whitespace-nowrap">＋</button>
              </div>

              {/* Toolbar */}
              <div className="border-b px-3 sm:px-4 py-2 flex items-center gap-2" style={{ background: WARM, borderColor: `${NAVY}12` }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search markets…"
                  className="flex-1 min-w-0 border px-3 py-2 text-xs outline-none"
                  style={{ borderRadius: 3, boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}12`, maxWidth: 280 }}
                />
                <div className="flex items-center gap-1 shrink-0">
                  {(['trending', 'volume'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: sortBy === s ? BV_DK : BV_UP, background: sortBy === s ? NAVY : WARM, color: sortBy === s ? WARM : `${NAVY}45`, border: `1px solid ${sortBy === s ? NAVY : NAVY + '15'}` }}
                      className="px-2 sm:px-2.5 py-1.5 text-[11px] font-600 uppercase tracking-wider border transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {/* Combo mode toggle */}
                <button
                  onClick={() => setComboMode(m => !m)}
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: comboMode ? BV_DK : BV_UP, background: comboMode ? '#6B21A8' : WARM, color: comboMode ? '#F7D000' : `${NAVY}45`, border: `1px solid ${comboMode ? '#6B21A8' : NAVY + '15'}` }}
                  className="shrink-0 px-2 py-1.5 text-[11px] font-700 uppercase tracking-wider transition-all"
                >
                  {comboMode ? '⚡ ON' : '⚡'}
                </button>
              </div>

              {/* Column header desktop */}
              <div className="hidden md:flex items-center px-4 py-2 border-b" style={{ background: NAVY, borderColor: `${NAVY}22` }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="flex-1 text-[10px] uppercase tracking-widest text-white/35 font-600">Market</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/35 font-600 w-28 text-right hidden lg:block">Volume</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/35 font-600 w-20 text-right">Predict</span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredMarkets.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-sm" style={{ color: `${NAVY}30` }}>No markets found.</div>
                ) : (
                  filteredMarkets.map((m, i) => (
                    <MarketRow
                      key={m.id}
                      market={m}
                      index={i}
                      onSelect={setSelectedMarket}
                      comboMode={comboMode}
                      comboPositions={comboPositions}
                      onAddToCombo={(market, position, odds) => addToCombo(market, position, odds)}
                      customCategories={customCategories}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* Portfolio view */}
          {activeView === 'portfolio' && (
            <PortfolioPage
              trades={portfolio}
              balance={balance}
              isSignedIn={isSignedIn}
              onNavigate={setActiveView}
              onSignIn={() => setShowSignIn(true)}
              onOpenCombo={() => { setComboOpen(true); setComboMode(true) }}
            />
          )}

          {/* Leaderboard */}
          {activeView === 'leaderboard' && (
            <div className="flex-1 overflow-y-auto">
              <div className="border-b px-4 py-3" style={{ background: NAVY, borderColor: `${NAVY}22` }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-xs uppercase tracking-widest text-white/40 font-600">Top Traders — September 2025</div>
              </div>
              {[
                { rank: 1, name: 'Njeri K.', profit: 'KES 142,300', accuracy: '73%', markets: 84 },
                { rank: 2, name: 'Ochieng M.', profit: 'KES 98,100', accuracy: '69%', markets: 121 },
                { rank: 3, name: 'Wanjiku A.', profit: 'KES 76,500', accuracy: '71%', markets: 56 },
                { rank: 4, name: 'Kamau B.', profit: 'KES 55,200', accuracy: '65%', markets: 203 },
                { rank: 5, name: 'Adhiambo L.', profit: 'KES 44,900', accuracy: '68%', markets: 77 },
                { rank: 6, name: 'Muthoni R.', profit: 'KES 38,400', accuracy: '62%', markets: 145 },
                { rank: 7, name: 'Otieno J.', profit: 'KES 29,100', accuracy: '60%', markets: 92 },
                { rank: 8, name: 'Chebet F.', profit: 'KES 21,700', accuracy: '58%', markets: 67 },
              ].map(({ rank, name, profit, accuracy, markets }, i) => (
                <div key={rank} className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: i % 2 === 0 ? WARM : SKY, borderColor: `${NAVY}10` }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: rank <= 3 ? ORANGE : `${NAVY}25` }} className="text-lg font-700 w-5 shrink-0">{rank}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-600 shrink-0" style={{ background: NAVY, boxShadow: BV_DK }}>{name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-600" style={{ color: NAVY }}>{name}</div>
                    <div className="text-[11px]" style={{ color: `${NAVY}40` }}>{markets} markets · {accuracy} accuracy</div>
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-sm font-500 shrink-0">{profit}</div>
                </div>
              ))}
            </div>
          )}

          {/* Wallet */}
          {activeView === 'wallet' && (
            <WalletPage
              balance={balance}
              entries={walletEntries}
              onDeposit={() => requireAuth("Sign in to deposit funds", () => setShowDeposit(true))}
              onWithdraw={() => setShowWithdraw(true)}
            />
          )}

          {/* Profile & account pages */}
          {activeView === 'profile' && <ProfilePage profile={MOCK_PROFILE} />}
          {activeView === 'account' && <AccountPage profile={MOCK_PROFILE} />}
          {activeView === 'settings' && <SettingsPage />}
          {activeView === 'notifications' && <NotificationsPage />}
          {activeView === 'language' && <LanguagePage />}
        </main>

        {/* Right rail */}
        {activeView === 'markets' && (
          <aside className="hidden xl:flex flex-col w-52 shrink-0 border-l" style={{ background: WARM, borderColor: `${NAVY}12` }}>
            <div className="border-b" style={{ borderColor: `${NAVY}10` }}>
              <div className="px-3 py-2 border-b" style={{ background: SKY, borderColor: `${NAVY}10` }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-[10px] uppercase tracking-widest font-600">Top Movers (24h)</span>
              </div>
              {TOP_MOVERS.map((m, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ background: i % 2 === 0 ? WARM : MINERAL, borderColor: `${NAVY}08` }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] truncate" style={{ color: NAVY }}>{m.question}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', color: `${NAVY}35` }} className="text-[10px] mt-0.5">{m.yes}% YES</div>
                  </div>
                  <span style={{ fontFamily: 'Geist Mono, monospace', color: m.change.startsWith('+') ? '#2A6B3A' : ORANGE, fontWeight: 600 }} className="text-[11px] shrink-0">{m.change}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="px-3 py-2 border-b" style={{ background: SKY, borderColor: `${NAVY}10` }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-[10px] uppercase tracking-widest font-600">Recent Activity</span>
              </div>
              {RECENT_BETS.map((b, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2.5 border-b" style={{ background: i % 2 === 0 ? WARM : MINERAL, borderColor: `${NAVY}08` }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-600 shrink-0 mt-0.5" style={{ background: NAVY }}>{b.user[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] truncate" style={{ color: `${NAVY}45` }}>{b.user} · <span className="font-600" style={{ color: NAVY }}>{b.action}</span></div>
                    <div className="text-[10px] truncate" style={{ color: `${NAVY}35` }}>{b.market}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-[10px] mt-0.5">{b.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t px-3 sm:px-5 py-3" style={{ background: NAVY, borderColor: `${NAVY}25` }}>
        <div className="flex flex-wrap items-center gap-3">
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${WARM}70` }} className="text-xs font-700 tracking-wider">POLKA<span style={{ color: ORANGE }}>.TRADE</span></span>
          <span className="text-xs hidden sm:block" style={{ color: `${WARM}20` }}>· Nairobi, Kenya</span>
          <div className="flex gap-3 ml-auto flex-wrap">
            {[
              { label: 'Terms', action: () => setShowTerms(true) },
              { label: 'How It Works', action: () => setInfoTab('how') },
              { label: 'FAQ', action: () => setInfoTab('how') },
              { label: 'Responsible Trading', action: () => setInfoTab('responsible') },
              { label: 'Privacy', action: () => setInfoTab('terms') },
              { label: 'Support', action: () => setInfoTab('support') },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors hover:opacity-80" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${WARM}35` }}>
                {label}
              </button>
            ))}
            <a
              href="https://wa.me/254741301508"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider whitespace-nowrap hover:opacity-80"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#25D366' }}
            >
              <MessageCircle size={11} /> WhatsApp Support
            </a>
          </div>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1" style={{ borderRadius: 3, border: `1px solid ${WARM}25`, color: `${WARM}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>
          <ShieldCheck size={12} />
          <span className="text-[10px] uppercase tracking-wider font-700">18+ · Participate responsibly</span>
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: `${WARM}18` }}>
          Prediction market — not a sportsbook, casino, or bookmaker · Parimutuel payouts · 2% platform fee · 18+ · © 2025 Polka.trade
        </p>
      </footer>

      {/* ── Combo Slip ── */}
      <ComboSlip
        positions={comboPositions}
        open={comboOpen}
        onToggle={() => setComboOpen(o => !o)}
        onRemove={removeFromCombo}
        onClear={clearCombo}
        onCheckout={checkoutCombo}
        newlyAdded={newlyAdded}
      />

      {/* ── Side Menu ── */}
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isSignedIn={isSignedIn}
        balance={balance}
        onNavigate={goTo}
        onSignIn={() => setShowSignIn(true)}
        onSignOut={() => { setIsSignedIn(false); setActiveView('markets') }}
        onInfo={() => setInfoTab('how')}
        onDeposit={() => requireAuth("Sign in to deposit funds", () => setShowDeposit(true))}
        onCreate={() => requireAuth("Sign in to create a market", () => setShowCreate(true))}
        activeView={activeView}
      />

      {/* ── Modals ── */}
      {selectedMarket && (
        <MarketDetail
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
          comboPositions={comboPositions}
          onAddToCombo={(market, position, odds, amount) => addToCombo(market, position, odds, amount)}
          onConfirm={(...a: Parameters<typeof confirmTrade>) => requireAuth("Sign in to place a prediction", () => confirmTrade(...a))}
          myTrades={portfolio}
        />
      )}
      {showCreate && <CreateMarket balance={balance} onClose={() => setShowCreate(false)} onPublish={publishMarket} />}
      {infoTab && (
        <InfoModal
          initialTab={infoTab}
          onClose={() => setInfoTab(null)}
          onOpenTutorial={() => { setInfoTab(null); setShowTutorial(true) }}
        />
      )}
      {showTerms && <TermsView onClose={() => setShowTerms(false)} />}
      {(showSignIn || authPrompt !== null) && (
        <AuthModal
          reason={authPrompt ?? undefined}
          onClose={() => { setShowSignIn(false); setAuthPrompt(null) }}
          onSuccess={p => { setIsSignedIn(true); setUserPhone(p.phone); setShowSignIn(false); setAuthPrompt(null); push(`Welcome, ${p.name}`) }}
        />
      )}
      {showDeposit && (
        <DepositModal
          savedPhone={userPhone || undefined}
          onClose={() => setShowDeposit(false)}
          onDeposit={(amount, phone) => { setUserPhone(phone); handleDeposit(amount); push('Deposit confirmed — balance updated') }}
        />
      )}
      {showWithdraw && <WithdrawModal balance={balance} onClose={() => setShowWithdraw(false)} onWithdraw={handleWithdraw} />}
      {showTutorial && (
        <Tutorial
          onClose={() => setShowTutorial(false)}
          onRegister={() => { setShowTutorial(false); setShowSignIn(true) }}
          onBrowse={() => { setShowTutorial(false); setActiveView('markets') }}
        />
      )}
      {showCustomCat && <CustomCategoryModal onClose={() => setShowCustomCat(false)} onCreate={c => setCustomCategories(cs => [...cs, c])} />}
    </div>
  )
}

export function PolkaApp() {
  return (
    <OddsProvider>
      <LiveProvider>
        <ToastProvider>
          <DisplayKeyframes />
          <PolkaAppInner />
        </ToastProvider>
      </LiveProvider>
    </OddsProvider>
  )
}
