import polkaLogo from '@/assets/polka-logo.png.asset.json'
import { useState, useEffect, useRef } from 'react'
import type { CategoryId, Market, ComboPosition, PortfolioTrade, WalletEntry, View, CustomCategory, Outcome } from './types'
import { MARKETS, MOCK_PROFILE, INITIAL_PORTFOLIO, INITIAL_WALLET, TOP_MOVERS, RECENT_BETS } from './data'
import { formatVolume, formatKES, shouldHideStats, estimatePayout, comboMath, seedSplit } from './utils'
import {
  OddsProvider, OddsToggle, OddsNumber, FlipNumber, LiveProvider, ToastProvider, useToasts,
  useLive, useLiveMarket, VolumeFCT, StatusPill, marketStatus, DisplayKeyframes,
  CatIcon, catIconFor, NavIcons,
} from './display'
import { Tutorial } from './Tutorial'
import { WithdrawModal } from './WithdrawModal'

// ─── Style constants ──────────────────────────────────────────────────────────
const BV_UP   = '0 1px 0 rgba(255,255,255,0.55) inset, 0 -1px 0 rgba(0,0,0,0.10) inset'
const BV_IN   = '0 1px 3px rgba(21,43,67,0.10) inset, 0 1px 0 rgba(255,255,255,0.40)'
const BV_DK   = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'
const NAVY    = '#152B43'
const ORANGE  = '#E15B36'
const SKY     = '#DCE7EF'
const WARM    = '#FAF9F6'
const MINERAL = '#F2F0EA'


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
  activeView: View
}

function SideMenu({ open, onClose, isSignedIn, balance, onNavigate, onSignIn, onSignOut, onDeposit, onCreate, activeView }: SideMenuProps) {
  if (!open) return null
  const nav = (v: View, label: string, icon: string) => (
    <button
      onClick={() => { onNavigate(v); onClose() }}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:brightness-95"
      style={{ background: activeView === v ? SKY : 'transparent', borderLeft: activeView === v ? `3px solid ${ORANGE}` : '3px solid transparent' }}
    >
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <span className="font-500" style={{ color: NAVY }}>{label}</span>
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
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-700 text-white mb-2" style={{ background: ORANGE, boxShadow: BV_DK }}>N</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-white font-700 text-base">NJERI KAMAU</div>
              <div className="text-white/40 text-xs">njeri.k@email.com</div>
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
          {isSignedIn && (
            <>
              {nav('profile', 'My Profile', '👤')}
              {nav('account', 'My Account', '⚙️')}
              {nav('portfolio', 'Portfolio', '📊')}
              {nav('wallet', 'Wallet & Ledger', '💼')}
              <div className="my-1 mx-4 h-px" style={{ background: `${NAVY}12` }} />
            </>
          )}
          {nav('markets', 'Markets', '📋')}
          {nav('leaderboard', 'Leaderboard', '🏆')}
          <button
            onClick={() => { onCreate(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:brightness-95"
            style={{ borderLeft: '3px solid transparent' }}
          >
            <span className="text-base w-5 text-center shrink-0" style={{ color: ORANGE }}>＋</span>
            <span className="font-600" style={{ color: ORANGE }}>Create Market</span>
          </button>
          <div className="my-1 mx-4 h-px" style={{ background: `${NAVY}12` }} />
          {nav('notifications', 'Notifications', '🔔')}
          {nav('settings', 'Settings', '⚙️')}
          {nav('language', 'Language', '🌐')}
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
        <div className="mx-auto w-full max-w-6xl p-3 sm:p-4 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] gap-3 sm:gap-4 items-start">

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
    </div>
  )
}


// ─── Sign-In Modal ────────────────────────────────────────────────────────────

function SignInModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const TEAL = '#1A5C52'; const TEAL_L = '#2A7B6F'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: `${NAVY}60` }} onClick={onClose}>
      <div className="w-full sm:max-w-sm overflow-hidden" style={{ background: '#fff', borderRadius: 4, border: `1px solid ${TEAL}33`, boxShadow: '0 24px 64px rgba(21,43,67,0.22)' }} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-5" style={{ background: TEAL, boxShadow: BV_DK }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest font-600 text-white/50">POLKA<span style={{ color: '#F7D000' }}>.TRADE</span></div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-xl font-700 text-white mt-1">{mode === 'signin' ? 'Welcome back' : 'Join Polka.trade'}</div>
              <div className="text-white/50 text-xs mt-0.5">{mode === 'signin' ? 'Sign in to trade' : 'Start predicting in minutes'}</div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white text-2xl w-8 h-8 flex items-center justify-center">×</button>
          </div>
          <div className="flex mt-4 p-0.5" style={{ borderRadius: 4, background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: mode === m ? BV_DK : 'none', background: mode === m ? '#fff' : 'transparent', color: mode === m ? TEAL : 'rgba(255,255,255,0.6)' }} className="flex-1 py-1.5 text-sm font-700 uppercase tracking-wider transition-all">
                {m === 'signin' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 space-y-3" style={{ background: '#FAFDFB' }}>
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Njeri Kamau" className="w-full border px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BV_IN, background: '#fff', color: NAVY }} />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Phone / Email</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" className="w-full border px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BV_IN, background: '#fff', color: NAVY, fontFamily: 'Geist Mono, monospace' }} />
          </div>
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full border px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BV_IN, background: '#fff', color: NAVY, fontFamily: 'Geist Mono, monospace' }} />
          </div>
          {mode === 'signin' && <div className="text-right"><button className="text-[11px] hover:underline" style={{ color: TEAL_L }}>Forgot password?</button></div>}
          <button onClick={onSuccess} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: TEAL, boxShadow: BV_DK }} className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all mt-1">{mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
          <div className="flex items-center gap-2 my-1"><div className="flex-1 h-px bg-gray-200" /><span className="text-[10px] text-gray-400 uppercase tracking-wider">or</span><div className="flex-1 h-px bg-gray-200" /></div>
          <button style={{ color: NAVY, borderRadius: 3, border: `1.5px solid ${TEAL}33`, boxShadow: BV_IN }} className="w-full py-2.5 text-sm font-600 bg-white hover:bg-[#E8F2F0] transition-colors flex items-center justify-center gap-2">
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: TEAL_L }} className="font-700 text-base">M</span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="font-600">M-PESA OTP</span>
          </button>
          {mode === 'signup' && <p className="text-[10px] text-gray-400 text-center leading-relaxed pt-1">18+ only · Prediction market, not a bookmaker</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Deposit Modal ────────────────────────────────────────────────────────────

function DepositModal({ onClose, onDeposit }: { onClose: () => void; onDeposit: (amount: number) => void }) {
  const [amount, setAmount] = useState('')
  const PRESETS = [500, 1000, 2000, 5000]
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: `${NAVY}60` }} onClick={onClose}>
      <div className="w-full sm:max-w-sm overflow-hidden" style={{ background: WARM, borderRadius: 4, border: `1px solid ${NAVY}18`, boxShadow: '0 24px 64px rgba(21,43,67,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-4 flex items-center justify-between" style={{ background: NAVY, boxShadow: BV_DK }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Wallet</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-lg font-700 text-white mt-0.5">Deposit Funds</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(String(p))} style={{ borderRadius: 3, boxShadow: amount === String(p) ? BV_DK : BV_UP, background: amount === String(p) ? NAVY : WARM, color: amount === String(p) ? WARM : NAVY, border: `1px solid ${NAVY}${amount === String(p) ? 'ff' : '18'}`, fontFamily: 'Barlow Condensed, sans-serif' }} className="px-3 py-1.5 text-sm font-700 transition-all">
                {formatKES(p)}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-600 pointer-events-none" style={{ color: `${NAVY}45` }}>KES</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className="w-full border pl-10 pr-3 py-3 text-sm outline-none" style={{ borderRadius: 3, fontFamily: 'Geist Mono, monospace', boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}20` }} />
          </div>
          <button onClick={() => { if (Number(amount) > 0) { onDeposit(Number(amount)); onClose() } }} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#2A7B6F', boxShadow: BV_DK }} className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all">
            Deposit via M-PESA
          </button>
          <p className="text-[10px] text-center" style={{ color: `${NAVY}35` }}>You will receive an M-PESA STK push to confirm.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Create Market ────────────────────────────────────────────────────────────

function CreateMarket({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ question: '', description: '', category: 'Kenya' as CategoryId, endDate: '', startingOdds: 50 })
  const [marketType, setMarketType] = useState<'binary' | 'multiple' | 'custom'>('binary')
  const [outcomes, setOutcomes] = useState<{ label: string; odds: number }[]>([
    { label: '', odds: 50 },
    { label: '', odds: 50 },
  ])
  const oddsTotal = outcomes.reduce((s, o) => s + o.odds, 0)
  const setOutcome = (i: number, patch: Partial<{ label: string; odds: number }>) =>
    setOutcomes(os => os.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  const { seed, yesPool, noPool } = seedSplit(form.startingOdds)
  const allCats = BASE_CATEGORIES.filter(c => c.id !== 'All')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: `${NAVY}50` }} onClick={onClose}>
      <div className="w-full sm:max-w-xl overflow-hidden" style={{ background: WARM, borderRadius: 4, border: `1px solid ${NAVY}18`, boxShadow: '0 24px 64px rgba(21,43,67,0.18)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="border-b px-4 py-4 flex items-center justify-between shrink-0" style={{ background: NAVY, boxShadow: BV_DK, borderColor: `${NAVY}18` }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Create Market · Step {step} of 3</div>
            <div className="text-sm font-600 text-white mt-0.5">{step === 1 ? 'Define your question' : step === 2 ? 'Set resolution & seed' : 'Review & publish'}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="h-0.5" style={{ background: `${NAVY}15` }}><div className="h-full transition-all" style={{ width: `${(step / 3) * 100}%`, background: ORANGE }} /></div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {step === 1 && (
            <>
              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>Market Question</label>
                <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Will [event] happen by [date]?" rows={3} className="w-full border p-3 text-sm resize-none outline-none" style={{ borderRadius: 3, boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}15` }} />
              </div>
              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {allCats.map(c => (
                    <button key={String(c.id)} onClick={() => setForm({ ...form, category: c.id })} style={{ borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: form.category === c.id ? BV_DK : BV_UP, background: form.category === c.id ? NAVY : WARM, color: form.category === c.id ? WARM : `${NAVY}60`, border: `1px solid ${form.category === c.id ? NAVY : NAVY + '15'}` }} className="px-2.5 py-1.5 text-xs font-600 uppercase tracking-wider transition-all flex items-center gap-1">
                      <span className="flex items-center">{c.icon}</span><span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Market type */}
              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>Market Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { id: 'binary', label: 'Yes / No' },
                    { id: 'multiple', label: 'Multiple outcomes' },
                    { id: 'custom', label: 'Custom' },
                  ] as const).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setMarketType(t.id)}
                      style={{ borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: marketType === t.id ? BV_DK : BV_UP, background: marketType === t.id ? NAVY : WARM, color: marketType === t.id ? WARM : `${NAVY}60`, border: `1px solid ${marketType === t.id ? NAVY : NAVY + '15'}` }}
                      className="px-2.5 py-1.5 text-xs font-600 uppercase tracking-wider transition-all"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: `${NAVY}45` }}>
                  {marketType === 'binary'
                    ? 'Two outcomes — YES or NO.'
                    : marketType === 'multiple'
                      ? 'Several named outcomes, each with a starting probability. They must add up to 100%.'
                      : 'Free-form outcomes you name yourself — useful for scores, ranges or league winners.'}
                </p>
              </div>

              {/* Outcome editor */}
              {marketType !== 'binary' && (
                <div>
                  <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>Outcomes</label>
                  <div className="space-y-1.5">
                    {outcomes.map((o, i) => (
                      <div key={i} className="flex gap-1.5 items-center">
                        <input
                          value={o.label}
                          onChange={e => setOutcome(i, { label: e.target.value })}
                          placeholder={`Outcome ${i + 1}`}
                          className="flex-1 min-w-0 border px-2.5 py-2 text-sm outline-none"
                          style={{ borderRadius: 3, boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}15` }}
                        />
                        <input
                          type="number" min={1} max={99} value={o.odds}
                          onChange={e => setOutcome(i, { odds: Math.max(1, Math.min(99, Number(e.target.value))) })}
                          className="w-16 border px-2 py-2 text-sm outline-none"
                          style={{ borderRadius: 3, boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}15`, fontFamily: 'Geist Mono, monospace' }}
                        />
                        <span className="text-[11px]" style={{ color: `${NAVY}40` }}>%</span>
                        {outcomes.length > 2 && (
                          <button onClick={() => setOutcomes(os => os.filter((_, idx) => idx !== i))} className="w-7 h-7 shrink-0" style={{ color: `${NAVY}40` }}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setOutcomes(os => [...os, { label: '', odds: 10 }])}
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_UP, border: `1px solid ${NAVY}15`, color: `${NAVY}55` }}
                      className="px-2.5 py-1.5 text-[11px] font-700 uppercase tracking-wider"
                    >
                      Add outcome
                    </button>
                    <span style={{ fontFamily: 'Geist Mono, monospace', color: oddsTotal === 100 ? '#1F6B45' : ORANGE }} className="text-[11px] font-700">
                      {oddsTotal}% / 100%
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="border p-2.5 text-sm outline-none w-full" style={{ borderRadius: 3, boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}15` }} />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>Resolution Criteria</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe exactly what must happen for YES to win. Be specific about your verification source." rows={4} className="w-full border p-3 text-sm resize-none outline-none" style={{ borderRadius: 3, boxShadow: BV_IN, background: MINERAL, color: NAVY, borderColor: `${NAVY}15` }} />
              </div>
              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: `${NAVY}55`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Starting Position — {form.startingOdds}% YES
                </label>
                <input type="range" min={5} max={95} value={form.startingOdds} onChange={e => setForm({ ...form, startingOdds: Number(e.target.value) })} className="w-full accent-[#152B43]" />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: `${NAVY}35` }}>
                  <span>Unlikely</span><span>50/50</span><span>Likely</span>
                </div>
              </div>
              {/* Seed breakdown */}
              <div className="border p-4 space-y-2" style={{ background: SKY, borderRadius: 3, borderColor: `${NAVY}15`, boxShadow: BV_IN }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}50` }} className="text-[10px] uppercase tracking-widest font-600">Market Seed — KES {seed}</div>
                <p className="text-xs" style={{ color: `${NAVY}60` }}>To start your market, you seed <strong>KES {seed}</strong> from your balance. This creates the initial YES/NO liquidity pool.</p>
                <div className="flex gap-4 mt-2 pt-2 border-t" style={{ borderColor: `${NAVY}15` }}>
                  <div><div style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-sm font-700">KES {yesPool}</div><div className="text-[10px]" style={{ color: `${NAVY}45` }}>YES pool</div></div>
                  <div><div style={{ fontFamily: 'Geist Mono, monospace', color: `${NAVY}55` }} className="text-sm font-700">KES {noPool}</div><div className="text-[10px]" style={{ color: `${NAVY}35` }}>NO pool</div></div>
                  <div className="ml-auto"><div style={{ fontFamily: 'Geist Mono, monospace', color: ORANGE }} className="text-sm font-700">2%</div><div className="text-[10px]" style={{ color: `${NAVY}35` }}>Platform fee</div></div>
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <div className="border p-4" style={{ background: SKY, borderRadius: 3, borderColor: `${NAVY}15`, boxShadow: BV_IN }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-[10px] uppercase tracking-widest font-600 mb-2">Preview</div>
                <p className="text-sm font-600" style={{ color: NAVY }}>{form.question || 'Your question here'}</p>
                <div className="flex gap-4 mt-3">
                  <div><span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-2xl font-700">{form.startingOdds}%</span><span className="text-[11px] ml-1" style={{ color: `${NAVY}45` }}>YES</span></div>
                  <div><span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-2xl font-700">{100 - form.startingOdds}%</span><span className="text-[11px] ml-1" style={{ color: `${NAVY}30` }}>NO</span></div>
                </div>
                <div className="flex gap-3 mt-2 text-[11px]" style={{ color: `${NAVY}45` }}>
                  <span>{form.category}</span>{form.endDate && <span>· Ends {form.endDate}</span>}
                </div>
              </div>
              <div className="border p-3 text-xs leading-relaxed" style={{ background: MINERAL, borderRadius: 3, borderColor: `${NAVY}10`, color: `${NAVY}50` }}>
                Publishing deducts <strong>KES {seed}</strong> from your balance as the market seed. By publishing you agree to the Market Creation Guidelines.
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3 flex justify-between items-center shrink-0" style={{ background: MINERAL, borderColor: `${NAVY}15` }}>
          {step > 1 ? <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 min-w-[80px] text-sm border transition-colors" style={{ borderRadius: 3, boxShadow: BV_UP, color: `${NAVY}55`, borderColor: `${NAVY}15` }}>← Back</button> : <div />}
          {step < 3
            ? <button onClick={() => setStep(s => s + 1)} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: NAVY }} className="px-5 py-2.5 min-w-[120px] text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all">Continue →</button>
            : <button style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: ORANGE }} className="px-5 py-2.5 min-w-[140px] text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all">Publish · KES {seed}</button>
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

  const isEmpty = trades.length === 0

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Balance card */}
      <div className="border-b p-4" style={{ background: NAVY, borderColor: `${NAVY}22` }}>
        <div className="flex items-end justify-between">
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Wallet Balance</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F7D000' }} className="text-3xl font-700 mt-1">{formatKES(balance)}</div>
          </div>
          <button onClick={() => onNavigate('wallet')} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: `${WARM}15`, border: `1px solid ${WARM}20`, color: WARM }} className="px-3 py-2 text-xs font-700 uppercase tracking-wider hover:brightness-110 transition-all">Wallet & Ledger →</button>
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t" style={{ borderColor: `${WARM}10` }}>
          <div><div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm font-600 text-white">{formatKES(totalStaked)}</div><div className="text-[10px] text-white/35 mt-0.5">Total traded</div></div>
          <div><div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm font-600 text-white">{formatKES(totalWon)}</div><div className="text-[10px] text-white/35 mt-0.5">Total won</div></div>
          <div><div style={{ fontFamily: 'Geist Mono, monospace', color: totalWon - totalStaked >= 0 ? '#4ADE80' : ORANGE }} className="text-sm font-600">{totalWon - totalStaked >= 0 ? '+' : ''}{formatKES(totalWon - totalStaked)}</div><div className="text-[10px] text-white/35 mt-0.5">Net P&L</div></div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}10`, fontSize: 48, fontWeight: 800 }}>EMPTY</div>
          <p className="text-sm" style={{ color: `${NAVY}35` }}>No active trades yet. Start predicting!</p>
          <div className="flex gap-3 flex-wrap justify-center mt-1">
            <button onClick={() => onNavigate('markets')} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_UP, background: WARM, border: `1px solid ${NAVY}20`, color: NAVY }} className="px-5 py-2.5 text-sm font-700 uppercase tracking-wider hover:brightness-95 transition-all">Trade Markets</button>
            <button onClick={onOpenCombo} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_DK, background: '#6B21A8' }} className="px-5 py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all flex items-center gap-2">
              <span style={{ color: '#F7D000' }}>⚡</span> Start Combo
            </button>
          </div>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <>
              <div className="px-4 py-2 border-b" style={{ background: NAVY, borderColor: `${NAVY}22` }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Open Positions ({open.length})</span>
              </div>
              {open.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: i % 2 === 0 ? WARM : SKY, borderColor: `${NAVY}10` }}>
                  {t.isCombo
                    ? <span className="text-lg shrink-0">🔗</span>
                    : <span className="text-lg shrink-0">📋</span>}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-500 truncate" style={{ color: NAVY }}>{t.market}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs font-700 px-2 py-0.5 text-white" style={{ background: t.isCombo ? '#6B21A8' : NAVY, borderRadius: 2, fontFamily: 'Barlow Condensed, sans-serif' }}>{t.position}</span>
                      {!t.isCombo && <span className="text-[10px]" style={{ color: `${NAVY}45` }}>{t.odds}% odds</span>}
                      {t.isCombo && <span className="text-[10px]" style={{ color: '#6B21A8' }}>{t.comboLegs} legs</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div style={{ fontFamily: 'Geist Mono, monospace', color: NAVY }} className="text-sm font-600">{formatKES(t.stake)}</div>
                    <div className="text-[10px]" style={{ color: `${NAVY}40` }}>{t.date}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {resolved.length > 0 && (
            <>
              <div className="px-4 py-2 border-b" style={{ background: '#1A3A2A', borderColor: `${NAVY}22` }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-white/40 font-600">Resolved ({resolved.length})</span>
              </div>
              {resolved.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: i % 2 === 0 ? WARM : SKY, borderColor: `${NAVY}10` }}>
                  <span className="text-lg shrink-0">{t.status === 'won' ? '✅' : '❌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-500 truncate" style={{ color: NAVY }}>{t.market}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-700 px-2 py-0.5 text-white" style={{ background: t.status === 'won' ? '#2A6B3A' : '#6B1A1A', borderRadius: 2, fontFamily: 'Barlow Condensed, sans-serif' }}>{t.position}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div style={{ fontFamily: 'Geist Mono, monospace', color: t.status === 'won' ? '#2A6B3A' : `${NAVY}40`, fontWeight: 700 }} className="text-sm">{t.status === 'won' ? '+' : '-'}{formatKES(t.status === 'won' ? (t.payout ?? 0) : t.stake)}</div>
                    <div className="text-[10px]" style={{ color: `${NAVY}35` }}>{t.status === 'won' ? 'Won' : 'Lost'} · {t.date}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Wallet Page ──────────────────────────────────────────────────────────────

function WalletPage({ balance, entries, onDeposit, onWithdraw }: { balance: number; entries: WalletEntry[]; onDeposit: () => void; onWithdraw: () => void }) {
  const TYPE_ICONS: Record<string, string> = { deposit: '↓', withdrawal: '↑', bet: '→', win: '★', seed: '⊞', combo: '≡', loss: '✗' }
  const TYPE_COLORS: Record<string, string> = { deposit: '#2A6B3A', win: '#2A6B3A', withdrawal: ORANGE, bet: NAVY, seed: NAVY, combo: '#6B21A8', loss: ORANGE }
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b p-4" style={{ background: NAVY }}>
        <div className="flex items-end justify-between">
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
      <div className="px-4 py-2 border-b" style={{ background: MINERAL, borderColor: `${NAVY}15` }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}45` }} className="text-[10px] uppercase tracking-widest font-600">Transaction Ledger</span>
      </div>
      {entries.map((e, i) => (
        <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: i % 2 === 0 ? WARM : SKY, borderColor: `${NAVY}08` }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-700 shrink-0" style={{ background: `${TYPE_COLORS[e.type] ?? NAVY}18`, color: TYPE_COLORS[e.type] ?? NAVY }}>
            {TYPE_ICONS[e.type] ?? '·'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-500 truncate" style={{ color: NAVY }}>{e.description}</div>
            <div className="text-[10px] mt-0.5" style={{ color: `${NAVY}40` }}>{e.date} · {e.status}</div>
          </div>
          <div className="text-right shrink-0">
            <div style={{ fontFamily: 'Geist Mono, monospace', color: e.sign === '+' ? '#2A6B3A' : `${NAVY}70`, fontWeight: 700 }} className="text-sm">
              {e.sign}{formatKES(e.amount)}
            </div>
          </div>
        </div>
      ))}
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

function ProfilePage({ profile }: { profile: typeof MOCK_PROFILE }) {
  return (
    <SkeletonPage title="My Profile" icon="👤">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4 p-4 border" style={{ background: SKY, borderColor: `${NAVY}15`, borderRadius: 3 }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-700 text-white shrink-0" style={{ background: ORANGE, boxShadow: BV_DK }}>{profile.name[0]}</div>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-base font-700 uppercase">{profile.name}</div>
            <div className="text-xs mt-0.5" style={{ color: `${NAVY}50` }}>Member since {profile.joined}</div>
            {profile.verified && <div className="text-[10px] font-600 mt-1" style={{ color: '#2A7B6F' }}>✓ KYC Verified</div>}
          </div>
        </div>
        {[
          { label: 'Phone', value: profile.phone },
          { label: 'Email', value: profile.email },
          { label: 'Account Status', value: 'Active — Verified' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-3 py-3 border" style={{ background: WARM, borderColor: `${NAVY}10`, borderRadius: 3 }}>
            <span className="text-xs" style={{ color: `${NAVY}50`, fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
            <span className="text-xs font-500" style={{ color: NAVY, fontFamily: 'Geist Mono, monospace' }}>{value}</span>
          </div>
        ))}
        <button style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_UP, border: `1px solid ${NAVY}18`, color: `${NAVY}60` }} className="w-full py-2.5 text-sm font-600 uppercase tracking-wider bg-transparent hover:brightness-95 transition-all">Edit Profile</button>
      </div>
    </SkeletonPage>
  )
}

function AccountPage({ profile }: { profile: typeof MOCK_PROFILE }) {
  return (
    <SkeletonPage title="My Account" icon="⚙️">
      <div className="p-4 space-y-3">
        {[
          { label: 'Login Email', value: profile.email },
          { label: 'Phone Number', value: profile.phone },
          { label: 'Password', value: '••••••••••' },
          { label: 'Two-Factor Auth', value: 'Enabled via M-PESA OTP' },
          { label: 'KYC Status', value: 'Verified ✓' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-3 py-3 border" style={{ background: WARM, borderColor: `${NAVY}10`, borderRadius: 3 }}>
            <span className="text-xs" style={{ color: `${NAVY}50`, fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-500" style={{ color: NAVY, fontFamily: 'Geist Mono, monospace' }}>{value}</span>
              <button className="text-[10px] px-2 py-0.5 border" style={{ color: `${NAVY}50`, borderColor: `${NAVY}20`, borderRadius: 2 }}>Edit</button>
            </div>
          </div>
        ))}
        <div className="pt-2">
          <button style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BV_UP, border: `1px solid #8B1A1A33`, color: '#8B1A1A' }} className="w-full py-2.5 text-sm font-600 uppercase tracking-wider hover:brightness-95 transition-all">Close Account</button>
        </div>
      </div>
    </SkeletonPage>
  )
}

function SettingsPage() {
  const SETTINGS = [
    { group: 'Trading', items: ['Default stake amount', 'Confirm before trade', 'Combo auto-add on click'] },
    { group: 'Privacy', items: ['Show on leaderboard', 'Public profile', 'Trading history visibility'] },
    { group: 'Security', items: ['Change password', 'Two-factor authentication', 'Active sessions'] },
  ]
  return (
    <SkeletonPage title="Settings" icon="⚙️">
      <div className="p-4 space-y-5">
        {SETTINGS.map(({ group, items }) => (
          <div key={group}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${NAVY}40` }} className="text-[10px] uppercase tracking-widest font-600 mb-2">{group}</div>
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-3 border-b" style={{ background: i % 2 === 0 ? WARM : SKY, borderColor: `${NAVY}08` }}>
                <span className="text-xs" style={{ color: NAVY }}>{item}</span>
                <div className="w-9 h-5 rounded-full flex items-center relative" style={{ background: `${NAVY}20`, cursor: 'pointer' }}>
                  <div className="w-4 h-4 rounded-full absolute left-0.5" style={{ background: NAVY, boxShadow: BV_DK }} />
                </div>
              </div>
            ))}
          </div>
        ))}
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
  const [isSignedIn, setIsSignedIn] = useState(true) // mock signed in
  const [balance, setBalance] = useState(MOCK_PROFILE.balance)

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
    my: MARKETS.filter(m => myMarketIds.has(m.id)).length,
    closed: MARKETS.filter(m => !m.isResolved && marketStatus(m) === 'closed').length,
    resolved: MARKETS.filter(m => Boolean(m.isResolved)).length,
    disputed: 0,
  }

  const filteredMarkets = MARKETS
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

  const liveCount = MARKETS.filter(m => m.isLive && !m.isResolved).length

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
                onClick={() => setActiveView(key)}
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
            <button
              onClick={() => setActiveView('wallet')}
              style={{ fontFamily: 'Geist Mono, monospace', borderRadius: 3, boxShadow: BV_DK, background: '#F7D000', color: '#6B21A8' }}
              className="px-3 py-1.5 text-xs sm:text-sm font-700 whitespace-nowrap hover:brightness-110 transition-all active:scale-95"
            >
              Bal. {balance.toFixed(2)} KSH
            </button>
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
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, border: '1px solid rgba(255,255,255,0.18)' }}
                className="px-3 py-1.5 text-sm font-600 text-white hover:bg-white/10 transition-colors"
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
              onClick={() => setActiveView(key)}
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
            {MARKETS.filter(m => m.isLive && !m.isResolved).map(m => (
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
              {[{ label: 'Markets', val: MARKETS.length }, { label: 'Live', val: liveCount }, { label: 'Traders', val: '14.2K' }].map(({ label, val }) => (
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
            <WalletPage balance={balance} entries={walletEntries} onDeposit={() => setShowDeposit(true)} />
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
              { label: 'How It Works', action: () => {} },
              { label: 'FAQ', action: () => {} },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors hover:opacity-80" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: `${WARM}35` }}>
                {label}
              </button>
            ))}
          </div>
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
        onNavigate={setActiveView}
        onSignIn={() => setShowSignIn(true)}
        onSignOut={() => setIsSignedIn(false)}
        onDeposit={() => setShowDeposit(true)}
        onCreate={() => setShowCreate(true)}
        activeView={activeView}
      />

      {/* ── Modals ── */}
      {selectedMarket && (
        <MarketDetail
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
          comboPositions={comboPositions}
          onAddToCombo={(market, position, odds, amount) => addToCombo(market, position, odds, amount)}
          onConfirm={confirmTrade}
          myTrades={portfolio}
        />
      )}
      {showCreate && <CreateMarket onClose={() => setShowCreate(false)} />}
      {showTerms && <TermsView onClose={() => setShowTerms(false)} />}
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} onSuccess={() => { setIsSignedIn(true); setShowSignIn(false) }} />}
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} onDeposit={handleDeposit} />}
      {showCustomCat && <CustomCategoryModal onClose={() => setShowCustomCat(false)} onCreate={c => setCustomCategories(cs => [...cs, c])} />}
    </div>
  )
}
