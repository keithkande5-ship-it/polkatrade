import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'All' | 'Sports' | 'Politics' | 'Crypto' | 'Entertainment' | 'Kenya' | 'Global' | 'Business' | 'Science'

type Outcome = { label: string; odds: number; color: string; textColor?: string }

type Market = {
  id: number
  question: string
  category: Category
  yesOdds: number
  noOdds: number
  outcomes?: Outcome[]
  volume: string
  endsAt: string
  isLive: boolean
  trending?: boolean
  participants: number
  description: string
}

type View = 'markets' | 'portfolio' | 'leaderboard'

// ─── Soft bevel helper ────────────────────────────────────────────────────────
// Applied to buttons + panels for a subtle raised feel
const BEVEL_RAISED = '0 1px 0 rgba(255,255,255,0.55) inset, 0 -1px 0 rgba(0,0,0,0.10) inset'
const BEVEL_INSET  = '0 1px 3px rgba(21,43,67,0.10) inset, 0 1px 0 rgba(255,255,255,0.40)'
const BEVEL_DARK   = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'

// ─── Colour palette ───────────────────────────────────────────────────────────
const OUTCOME_PALETTE: string[] = [
  '#2A5C84', // deep teal-blue
  '#6B4C2A', // warm umber
  '#3A6B4A', // forest green
  '#7A3A5C', // dusty plum
  '#5C5A2A', // olive
  '#2A4C6B', // midnight
]

// ─── Data ─────────────────────────────────────────────────────────────────────

const MARKETS: Market[] = [
  {
    id: 1, question: 'Will Ruto complete his full term as President through 2027?', category: 'Kenya',
    yesOdds: 72, noOdds: 28, volume: 'KES 4.2M', endsAt: 'Dec 2027', isLive: true, trending: true, participants: 3241,
    description: 'Resolves YES if William Ruto serves as President of Kenya until the 2027 general election without resignation, impeachment, or incapacitation.',
  },
  {
    id: 2, question: 'Will Bitcoin exceed $150,000 before end of 2025?', category: 'Crypto',
    yesOdds: 54, noOdds: 46, volume: 'KES 8.9M', endsAt: 'Dec 31 2025', isLive: true, trending: true, participants: 7812,
    description: 'Resolves YES if BTC/USD closing price on any day exceeds $150,000 before Dec 31 2025 per CoinGecko.',
  },
  {
    id: 3, question: 'Who will win the 2024/25 Premier League?', category: 'Sports',
    yesOdds: 31, noOdds: 69, volume: 'KES 5.4M', endsAt: 'May 25 2025', isLive: true, participants: 4820,
    description: 'Resolves to the club that finishes top of the Premier League table at the end of the 2024/25 season.',
    outcomes: [
      { label: 'Arsenal', odds: 31, color: '#8B1A1A' },
      { label: 'Man City', odds: 28, color: '#5C80B8' },
      { label: 'Liverpool', odds: 24, color: '#B83232' },
      { label: 'Chelsea', odds: 10, color: '#1A3A8B' },
      { label: 'Other', odds: 7, color: '#6B6B5C' },
    ],
  },
  {
    id: 4, question: "Will Kenya's inflation drop below 3% in 2025?", category: 'Kenya',
    yesOdds: 44, noOdds: 56, volume: 'KES 1.3M', endsAt: 'Dec 2025', isLive: false, participants: 892,
    description: 'Resolves YES if the Kenya National Bureau of Statistics reports headline inflation below 3% in any month of 2025.',
  },
  {
    id: 5, question: 'Who will win AFCON 2025?', category: 'Sports',
    yesOdds: 23, noOdds: 77, volume: 'KES 2.8M', endsAt: 'Feb 2025', isLive: false, participants: 3340,
    description: 'Resolves to the national team crowned Africa Cup of Nations champion in February 2025.',
    outcomes: [
      { label: 'Morocco', odds: 26, color: '#8B1A1A' },
      { label: 'Egypt', odds: 19, color: '#B87B2A' },
      { label: 'Nigeria', odds: 16, color: '#2A6B3A' },
      { label: 'Senegal', odds: 14, color: '#2A4A8B' },
      { label: 'Ivory Coast', odds: 12, color: '#6B8B2A' },
      { label: 'Other', odds: 13, color: '#6B6B5C' },
    ],
  },
  {
    id: 6, question: 'Who will win the 2024 US Presidential Election?', category: 'Politics',
    yesOdds: 55, noOdds: 45, volume: 'KES 12.4M', endsAt: 'Nov 5 2024', isLive: false, participants: 14220,
    description: 'Resolves to the candidate who wins the 2024 US Presidential election per official Electoral College results.',
    outcomes: [
      { label: 'Donald Trump', odds: 55, color: '#8B2A1A' },
      { label: 'Kamala Harris', odds: 43, color: '#2A3A8B' },
      { label: 'Other', odds: 2, color: '#6B6B5C' },
    ],
  },
  {
    id: 7, question: 'Will Ethereum flip Bitcoin by market cap in 2025?', category: 'Crypto',
    yesOdds: 12, noOdds: 88, volume: 'KES 3.7M', endsAt: 'Dec 31 2025', isLive: false, participants: 4401,
    description: 'Resolves YES if ETH market cap exceeds BTC market cap at any point in 2025 per CoinGecko.',
  },
  {
    id: 8, question: 'Will Sauti Sol release a new studio album in 2025?', category: 'Entertainment',
    yesOdds: 61, noOdds: 39, volume: 'KES 340K', endsAt: 'Dec 31 2025', isLive: false, participants: 512,
    description: 'Resolves YES if Sauti Sol officially releases a full studio album in 2025.',
  },
  {
    id: 9, question: 'Who will win the 2025 Kenyan Premier League?', category: 'Sports',
    yesOdds: 35, noOdds: 65, volume: 'KES 1.2M', endsAt: 'Aug 2025', isLive: true, participants: 1890,
    description: 'Resolves to the club that wins the Football Kenya Federation Premier League 2024/25 season.',
    outcomes: [
      { label: 'Gor Mahia', odds: 35, color: '#2A6B3A' },
      { label: 'AFC Leopards', odds: 27, color: '#2A3A8B' },
      { label: 'Tusker FC', odds: 18, color: '#B87B2A' },
      { label: 'KCB FC', odds: 12, color: '#2A5C84' },
      { label: 'Other', odds: 8, color: '#6B6B5C' },
    ],
  },
  {
    id: 10, question: 'Will OpenAI release GPT-5 before July 2025?', category: 'Science',
    yesOdds: 67, noOdds: 33, volume: 'KES 5.1M', endsAt: 'Jul 1 2025', isLive: true, trending: true, participants: 9034,
    description: 'Resolves YES if OpenAI officially announces and releases a model labelled GPT-5 before July 1 2025.',
  },
  {
    id: 11, question: 'Will M-PESA process over 1 trillion KES per month in 2025?', category: 'Business',
    yesOdds: 80, noOdds: 20, volume: 'KES 1.8M', endsAt: 'Dec 2025', isLive: false, participants: 1204,
    description: 'Resolves YES if Safaricom reports M-PESA monthly transaction value exceeding KES 1 trillion in any month of 2025.',
  },
  {
    id: 12, question: 'Will Solana (SOL) exceed $500 in 2025?', category: 'Crypto',
    yesOdds: 38, noOdds: 62, volume: 'KES 2.6M', endsAt: 'Dec 31 2025', isLive: false, participants: 3301,
    description: 'Resolves YES if SOL/USD closing price exceeds $500 on any day before Dec 31 2025.',
  },
  {
    id: 13, question: 'Who will win Formula 1 World Championship 2025?', category: 'Sports',
    yesOdds: 42, noOdds: 58, volume: 'KES 3.1M', endsAt: 'Nov 2025', isLive: false, participants: 2770,
    description: 'Resolves to the F1 driver crowned World Drivers Champion at the end of the 2025 season.',
    outcomes: [
      { label: 'Max Verstappen', odds: 42, color: '#2A3A8B' },
      { label: 'Lando Norris', odds: 28, color: '#B87B2A' },
      { label: 'Charles Leclerc', odds: 14, color: '#8B1A1A' },
      { label: 'George Russell', odds: 9, color: '#1A6B4A' },
      { label: 'Other', odds: 7, color: '#6B6B5C' },
    ],
  },
  {
    id: 14, question: "Will Kenya's GDP growth exceed 6% in 2025?", category: 'Kenya',
    yesOdds: 38, noOdds: 62, volume: 'KES 670K', endsAt: 'Dec 2025', isLive: false, participants: 730,
    description: 'Resolves YES if the World Bank or Kenya National Treasury confirms GDP growth above 6% for full year 2025.',
  },
  {
    id: 15, question: 'Will a major Kenyan bank launch a crypto product in 2025?', category: 'Business',
    yesOdds: 52, noOdds: 48, volume: 'KES 990K', endsAt: 'Dec 2025', isLive: false, participants: 1140,
    description: 'Resolves YES if KCB, Equity, NCBA, or Co-op Bank officially launches a publicly available crypto wallet, exchange, or savings product in 2025.',
  },
]

const CATEGORIES: Category[] = ['All', 'Kenya', 'Sports', 'Politics', 'Crypto', 'Entertainment', 'Business', 'Science', 'Global']

const CATEGORY_ICONS: Record<Category, string> = {
  All: '⊞', Kenya: '🇰🇪', Sports: '⚽', Politics: '🏛', Crypto: '₿',
  Entertainment: '🎬', Business: '📈', Science: '🔬', Global: '🌍',
}

const TOP_MOVERS = [
  { question: 'GPT-5 before July 2025?', change: '+14%', yes: 67 },
  { question: 'BTC > $150k 2025?', change: '+9%', yes: 54 },
  { question: 'Ruto full term 2027?', change: '-6%', yes: 72 },
  { question: 'Sauti Sol album 2025?', change: '+5%', yes: 61 },
  { question: 'SOL > $500?', change: '+11%', yes: 38 },
]

const RECENT_BETS = [
  { user: 'Njeri K.', action: 'YES', market: 'GPT-5 before July 2025', amount: 'KES 5,000' },
  { user: 'Ochieng M.', action: 'NO', market: 'ETH flips BTC', amount: 'KES 12,000' },
  { user: 'Wanjiru A.', action: 'YES', market: 'BTC > $150k', amount: 'KES 3,200' },
  { user: 'Kamau B.', action: 'Arsenal', market: 'Who wins PL?', amount: 'KES 8,500' },
  { user: 'Adhiambo L.', action: 'Morocco', market: 'AFCON 2025', amount: 'KES 1,800' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <span className="w-2 h-2 rounded-full bg-[#E15B36] animate-pulse inline-block" />
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] font-600 tracking-wider text-[#E15B36] uppercase">Live</span>
    </span>
  )
}

function OddsBar({ yes, outcomes }: { yes: number; outcomes?: Outcome[] }) {
  if (outcomes) {
    return (
      <div className="flex w-full h-1.5 overflow-hidden rounded-none gap-px">
        {outcomes.map((o, i) => (
          <div key={i} className="h-full" style={{ width: `${o.odds}%`, background: o.color, opacity: 0.75 }} />
        ))}
      </div>
    )
  }
  return (
    <div className="w-full h-1.5 bg-[#DCE7EF] overflow-hidden">
      <div className="h-full bg-[#152B43]" style={{ width: `${yes}%`, transition: 'width 0.4s ease' }} />
    </div>
  )
}

// Multi-outcome pills — rendered below the question
function OutcomePills({ outcomes, onSelect }: { outcomes: Outcome[]; onSelect: (o: Outcome) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {outcomes.map((o, i) => (
        <button
          key={i}
          onClick={e => { e.stopPropagation(); onSelect(o) }}
          style={{
            background: o.color,
            borderRadius: 3,
            fontFamily: 'Barlow Condensed, sans-serif',
            boxShadow: BEVEL_DARK,
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-white hover:brightness-110 transition-all active:scale-95"
        >
          <span className="text-xs font-600 whitespace-nowrap">{o.label}</span>
          <span className="text-[11px] font-700 opacity-80 whitespace-nowrap">{o.odds}%</span>
        </button>
      ))}
    </div>
  )
}

// ─── MarketRow ────────────────────────────────────────────────────────────────

function MarketRow({ market, index, onSelect }: { market: Market; index: number; onSelect: (m: Market) => void }) {
  const bg = index % 2 === 0 ? '#FAF9F6' : '#DCE7EF'
  const isMulti = Boolean(market.outcomes?.length)

  return (
    <div
      onClick={() => onSelect(market)}
      className="w-full border-b border-[#152B43]/10 hover:brightness-[0.97] transition-all cursor-pointer"
      style={{ background: bg }}
    >
      <div className="px-3 py-3 md:px-4">
        {/* Top row: category + status + meta */}
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] font-600 uppercase tracking-widest text-[#152B43]/45 shrink-0">
            {CATEGORY_ICONS[market.category]} {market.category}
          </span>
          {market.isLive && <LiveDot />}
          {market.trending && !market.isLive && (
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-wider text-[#152B43]/40 font-600">↑ Trending</span>
          )}
          <span className="ml-auto text-[10px] text-[#152B43]/35 shrink-0 hidden sm:block">Ends {market.endsAt}</span>
        </div>

        {/* Question */}
        <p className="text-sm font-500 text-[#152B43] leading-snug">{market.question}</p>

        {/* Multi-outcome pills or odds bar */}
        {isMulti ? (
          <OutcomePills outcomes={market.outcomes!} onSelect={() => onSelect(market)} />
        ) : (
          <div className="mt-2">
            <OddsBar yes={market.yesOdds} />
          </div>
        )}

        {/* Bottom row: odds (binary only) + volume + buttons */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {!isMulti && (
            <div className="flex items-center gap-2 mr-1">
              <div className="text-center">
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-base font-700 text-[#152B43]">{market.yesOdds}%</span>
                <span className="text-[10px] text-[#152B43]/45 ml-1">YES</span>
              </div>
              <div className="w-px h-4 bg-[#152B43]/20" />
              <div className="text-center">
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-base font-700 text-[#152B43]/50">{market.noOdds}%</span>
                <span className="text-[10px] text-[#152B43]/35 ml-1">NO</span>
              </div>
            </div>
          )}

          <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-[10px] text-[#152B43]/40">{market.volume} · {market.participants.toLocaleString()} traders</span>

          {!isMulti && (
            <div className="flex gap-1.5 ml-auto">
              <div
                role="button"
                onClick={e => { e.stopPropagation(); onSelect(market) }}
                style={{ borderRadius: 3, boxShadow: BEVEL_RAISED }}
                className="px-3 py-1.5 min-w-[44px] text-center text-xs font-700 bg-[#152B43] text-[#FAF9F6] hover:brightness-110 transition-all cursor-pointer select-none active:scale-95"
              >
                YES
              </div>
              <div
                role="button"
                onClick={e => { e.stopPropagation(); onSelect(market) }}
                style={{ borderRadius: 3, boxShadow: BEVEL_INSET }}
                className="px-3 py-1.5 min-w-[44px] text-center text-xs font-700 border border-[#152B43]/25 text-[#152B43]/60 hover:border-[#152B43]/60 hover:text-[#152B43] transition-all cursor-pointer select-none active:scale-95 bg-[#FAF9F6]/60"
              >
                NO
              </div>
            </div>
          )}
          {isMulti && (
            <div
              role="button"
              onClick={e => { e.stopPropagation(); onSelect(market) }}
              style={{ borderRadius: 3, boxShadow: BEVEL_RAISED }}
              className="ml-auto px-3 py-1.5 text-xs font-700 bg-[#152B43] text-[#FAF9F6] hover:brightness-110 transition-all cursor-pointer select-none active:scale-95"
            >
              View all →
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MarketDetail ─────────────────────────────────────────────────────────────

function MarketDetail({ market, onClose }: { market: Market; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'activity'>('overview')
  const [position, setPosition] = useState<string>(market.outcomes ? market.outcomes[0].label : 'YES')
  const [amount, setAmount] = useState('')
  const isMulti = Boolean(market.outcomes?.length)

  const selectedOdds = isMulti
    ? (market.outcomes!.find(o => o.label === position)?.odds ?? 50)
    : (position === 'YES' ? market.yesOdds : market.noOdds)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#152B43]/50 p-0 md:p-4" onClick={onClose}>
      <div
        className="w-full md:max-w-2xl bg-[#FAF9F6] md:rounded max-h-[92dvh] flex flex-col overflow-hidden"
        style={{ borderRadius: 4, border: '1px solid rgba(21,43,67,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[#152B43]/15 px-4 py-4 flex items-start justify-between gap-3 shrink-0" style={{ background: '#DCE7EF', boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset' }}>
          <div className="min-w-0">
            {market.isLive && <LiveDot />}
            <h2 className="text-sm font-600 text-[#152B43] mt-1 leading-snug">{market.question}</h2>
            <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-[#152B43]/50">
              <span>{CATEGORY_ICONS[market.category]} {market.category}</span>
              <span>·</span>
              <span>Ends {market.endsAt}</span>
              <span>·</span>
              <span>{market.participants.toLocaleString()} traders</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#152B43]/40 hover:text-[#152B43] text-2xl leading-none shrink-0 w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#152B43]/15 shrink-0" style={{ background: '#FAF9F6' }}>
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

        <div className="overflow-y-auto flex-1">
          {tab === 'overview' && (
            <div className="p-4 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#152B43]/12 p-3" style={{ background: '#F2F0EA', borderRadius: 3, boxShadow: BEVEL_INSET }}>
                  {isMulti ? (
                    <>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-3xl font-700 text-[#152B43]">{market.outcomes![0].odds}%</div>
                      <div className="text-[11px] text-[#152B43]/50 mt-0.5">{market.outcomes![0].label} leads</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-3xl font-700 text-[#152B43]">{market.yesOdds}%</div>
                      <div className="text-[11px] text-[#152B43]/50 mt-0.5">Chance YES</div>
                    </>
                  )}
                  <div className="mt-2"><OddsBar yes={market.yesOdds} outcomes={market.outcomes} /></div>
                </div>
                <div className="border border-[#152B43]/12 p-3" style={{ background: '#F2F0EA', borderRadius: 3, boxShadow: BEVEL_INSET }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm font-600 text-[#152B43]">{market.volume}</div>
                  <div className="text-[11px] text-[#152B43]/50 mt-0.5">Total volume</div>
                  <div className="text-[11px] text-[#152B43]/40 mt-2">{market.participants.toLocaleString()} traders</div>
                </div>
              </div>

              {/* Multi-outcome detail */}
              {isMulti && (
                <div className="space-y-1.5">
                  {market.outcomes!.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: o.color }} />
                      <span className="text-xs text-[#152B43] flex-1">{o.label}</span>
                      <div className="w-24 h-1.5 bg-[#DCE7EF] overflow-hidden shrink-0">
                        <div className="h-full" style={{ width: `${o.odds}%`, background: o.color }} />
                      </div>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-sm font-700 text-[#152B43] w-9 text-right shrink-0">{o.odds}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Resolution */}
              <div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/40 font-600 mb-1.5">Resolution Criteria</div>
                <p className="text-xs text-[#152B43]/75 leading-relaxed">{market.description}</p>
              </div>

              {/* Place prediction */}
              <div className="border border-[#152B43]/15 p-4" style={{ background: '#DCE7EF', borderRadius: 3, boxShadow: BEVEL_INSET }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/50 font-600 mb-3">Place Prediction</div>

                {isMulti ? (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {market.outcomes!.map((o, i) => (
                      <button
                        key={i}
                        onClick={() => setPosition(o.label)}
                        style={{
                          borderRadius: 3,
                          fontFamily: 'Barlow Condensed, sans-serif',
                          background: position === o.label ? o.color : 'transparent',
                          color: position === o.label ? '#fff' : '#152B43',
                          border: `1.5px solid ${position === o.label ? o.color : 'rgba(21,43,67,0.2)'}`,
                          boxShadow: position === o.label ? BEVEL_DARK : 'none',
                        }}
                        className="px-2.5 py-1.5 text-xs font-700 transition-all hover:brightness-105"
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
                        style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: position === p ? BEVEL_DARK : BEVEL_INSET }}
                        className={`flex-1 py-2 text-sm font-700 uppercase tracking-wider border transition-all ${position === p ? 'bg-[#152B43] text-[#FAF9F6] border-[#152B43]' : 'bg-[#FAF9F6]/70 text-[#152B43] border-[#152B43]/25 hover:border-[#152B43]'}`}
                      >
                        {p} · {p === 'YES' ? market.yesOdds : market.noOdds}%
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#152B43]/45 font-600 pointer-events-none">KES</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#FAF9F6] border border-[#152B43]/20 pl-10 pr-3 py-2.5 text-sm text-[#152B43] placeholder-[#152B43]/25 outline-none focus:border-[#152B43]"
                      style={{ borderRadius: 3, fontFamily: 'Geist Mono, monospace', boxShadow: BEVEL_INSET }}
                    />
                  </div>
                  <button
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BEVEL_DARK }}
                    className="px-5 py-2.5 bg-[#E15B36] text-white text-sm font-700 uppercase tracking-wider hover:bg-[#c94d2e] transition-colors active:scale-95 shrink-0"
                  >
                    Confirm
                  </button>
                </div>
                {amount && (
                  <div className="mt-2 text-[11px] text-[#152B43]/50">
                    Potential return: <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-[#152B43] font-600">KES {Math.round(Number(amount) / selectedOdds * 100).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-[#152B43]/30 leading-relaxed">
                Polka.trade is a prediction market, not a sportsbook. You trade on probability. Must be 18+. Trade responsibly.
              </p>
            </div>
          )}

          {tab === 'activity' && (
            <div className="divide-y divide-[#152B43]/8">
              {RECENT_BETS.map((b, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ background: i % 2 === 0 ? '#FAF9F6' : '#DCE7EF' }}>
                  <div className="w-8 h-8 rounded-full bg-[#152B43] flex items-center justify-center text-[11px] text-white font-600 shrink-0">{b.user[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-500 text-[#152B43]">{b.user}</div>
                    <div className="text-[11px] text-[#152B43]/45 truncate">{b.market}</div>
                  </div>
                  <div className="text-xs font-700 px-2 py-0.5 bg-[#152B43] text-white shrink-0" style={{ borderRadius: 2, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {b.action}
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-xs text-[#152B43] shrink-0">{b.amount}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sign-In Modal ────────────────────────────────────────────────────────────

function SignInModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  // Teal-green accent — different from the navy main palette
  const TEAL = '#1A5C52'
  const TEAL_LIGHT = '#2A7B6F'
  const TEAL_BG = '#E8F2F0'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#152B43]/60 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-white sm:rounded overflow-hidden"
        style={{ border: `1px solid ${TEAL}33`, boxShadow: '0 24px 64px rgba(21,43,67,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header band */}
        <div style={{ background: TEAL, boxShadow: BEVEL_DARK }} className="px-5 py-5 relative">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-white/60 text-[10px] uppercase tracking-widest font-600">POLKA<span style={{ color: '#E15B36' }}>.TRADE</span></div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-white text-xl font-700 mt-1 tracking-wide">
                {mode === 'signin' ? 'Welcome back' : 'Join Polka.trade'}
              </div>
              <div className="text-white/50 text-xs mt-0.5">
                {mode === 'signin' ? 'Sign in to trade on any outcome' : 'Start predicting in minutes'}
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white text-2xl w-8 h-8 flex items-center justify-center shrink-0">×</button>
          </div>

          {/* Mode toggle */}
          <div className="flex mt-4 border border-white/20 p-0.5" style={{ borderRadius: 4, background: 'rgba(0,0,0,0.15)' }}>
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: mode === m ? BEVEL_DARK : 'none' }}
                className={`flex-1 py-1.5 text-sm font-600 uppercase tracking-wider transition-all ${mode === m ? 'bg-white text-[#1A5C52]' : 'text-white/60 hover:text-white'}`}
              >
                {m === 'signin' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3" style={{ background: '#FAFDFB' }}>
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Njeri Kamau"
                className="w-full border px-3 py-2.5 text-sm outline-none placeholder-gray-300"
                style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BEVEL_INSET, background: '#fff', color: '#152B43', fontFamily: 'Geist, sans-serif' }}
                onFocus={e => (e.target.style.borderColor = TEAL)}
                onBlur={e => (e.target.style.borderColor = `${TEAL}33`)}
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Phone / Email</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={mode === 'signin' ? '0700 000 000 or email' : '+254 700 000 000'}
              className="w-full border px-3 py-2.5 text-sm outline-none placeholder-gray-300"
              style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BEVEL_INSET, background: '#fff', color: '#152B43', fontFamily: 'Geist Mono, monospace' }}
              onFocus={e => (e.target.style.borderColor = TEAL)}
              onBlur={e => (e.target.style.borderColor = `${TEAL}33`)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1" style={{ color: TEAL, fontFamily: 'Barlow Condensed, sans-serif' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: `${TEAL}33`, borderRadius: 3, boxShadow: BEVEL_INSET, background: '#fff', color: '#152B43', fontFamily: 'Geist Mono, monospace' }}
              onFocus={e => (e.target.style.borderColor = TEAL)}
              onBlur={e => (e.target.style.borderColor = `${TEAL}33`)}
            />
          </div>

          {mode === 'signin' && (
            <div className="text-right">
              <button className="text-[11px] hover:underline" style={{ color: TEAL_LIGHT }}>Forgot password?</button>
            </div>
          )}

          <button
            style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: TEAL, boxShadow: BEVEL_DARK }}
            className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 transition-all active:scale-[0.99] mt-1"
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          {/* M-PESA / Google divider */}
          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            style={{ borderRadius: 3, border: `1.5px solid ${TEAL}33`, boxShadow: BEVEL_INSET }}
            className="w-full py-2.5 text-sm font-600 text-[#152B43] bg-white hover:bg-[#E8F2F0] transition-colors flex items-center justify-center gap-2"
          >
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#2A7B6F' }} className="font-700 text-base tracking-tight">M</span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="font-600 text-sm tracking-wide">M-PESA OTP</span>
          </button>

          {mode === 'signup' && (
            <p className="text-[10px] text-gray-400 text-center leading-relaxed pt-1">
              By registering you confirm you are 18+ and agree to our{' '}
              <span className="underline cursor-pointer" style={{ color: TEAL_LIGHT }}>Terms & Conditions</span>.
              Polka.trade is a prediction market, not a bookmaker.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CreateMarket ─────────────────────────────────────────────────────────────

function CreateMarket({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ question: '', description: '', category: 'Kenya' as Category, endDate: '', startingOdds: 50 })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#152B43]/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-xl bg-[#FAF9F6] sm:rounded overflow-hidden"
        style={{ border: '1px solid rgba(21,43,67,0.18)', boxShadow: '0 24px 64px rgba(21,43,67,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b border-[#152B43]/15 px-4 py-4 flex items-center justify-between shrink-0" style={{ background: '#152B43', boxShadow: BEVEL_DARK }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#FAF9F6]/45 font-600">Create Market · Step {step} of 3</div>
            <div className="text-sm font-600 text-[#FAF9F6] mt-0.5">
              {step === 1 ? 'Define your question' : step === 2 ? 'Set resolution criteria' : 'Review & publish'}
            </div>
          </div>
          <button onClick={onClose} className="text-[#FAF9F6]/40 hover:text-[#FAF9F6] text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-[#DCE7EF]">
          <div className="h-full bg-[#E15B36] transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60dvh]">
          {step === 1 && (
            <>
              <div>
                <label className="block text-[11px] font-600 text-[#152B43]/55 mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Market Question</label>
                <textarea
                  value={form.question}
                  onChange={e => setForm({ ...form, question: e.target.value })}
                  placeholder="Will [event] happen by [date]?"
                  rows={3}
                  className="w-full bg-[#F2F0EA] border border-[#152B43]/15 p-3 text-sm text-[#152B43] placeholder-[#152B43]/25 outline-none focus:border-[#152B43] resize-none"
                  style={{ borderRadius: 3, boxShadow: BEVEL_INSET }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-600 text-[#152B43]/55 mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, category: c })}
                      style={{ borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: form.category === c ? BEVEL_DARK : BEVEL_RAISED }}
                      className={`px-2.5 py-1.5 text-xs font-600 uppercase tracking-wider border transition-all ${form.category === c ? 'bg-[#152B43] text-white border-[#152B43]' : 'bg-[#FAF9F6] text-[#152B43]/60 border-[#152B43]/15 hover:border-[#152B43]'}`}
                    >
                      {CATEGORY_ICONS[c]} {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-600 text-[#152B43]/55 mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="bg-[#F2F0EA] border border-[#152B43]/15 p-2.5 text-sm text-[#152B43] outline-none focus:border-[#152B43] w-full"
                  style={{ borderRadius: 3, boxShadow: BEVEL_INSET }}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-[11px] font-600 text-[#152B43]/55 mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Resolution Criteria</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe exactly what needs to happen for this market to resolve YES. Be specific — include sources you'll use to verify the outcome."
                  rows={5}
                  className="w-full bg-[#F2F0EA] border border-[#152B43]/15 p-3 text-sm text-[#152B43] placeholder-[#152B43]/25 outline-none focus:border-[#152B43] resize-none"
                  style={{ borderRadius: 3, boxShadow: BEVEL_INSET }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-600 text-[#152B43]/55 mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Starting Probability — {form.startingOdds}% YES</label>
                <input type="range" min={5} max={95} value={form.startingOdds} onChange={e => setForm({ ...form, startingOdds: Number(e.target.value) })} className="w-full accent-[#152B43]" />
                <div className="flex justify-between text-[10px] text-[#152B43]/35 mt-1">
                  <span>Unlikely</span><span>50/50</span><span>Likely</span>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="border border-[#152B43]/12 p-4" style={{ background: '#DCE7EF', borderRadius: 3, boxShadow: BEVEL_INSET }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/45 font-600 mb-2">Preview</div>
                <p className="text-sm font-600 text-[#152B43]">{form.question || 'Your question here'}</p>
                <div className="flex gap-4 mt-3">
                  <div><span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-2xl font-700 text-[#152B43]">{form.startingOdds}%</span><span className="text-[11px] text-[#152B43]/45 ml-1">YES</span></div>
                  <div><span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-2xl font-700 text-[#152B43]/45">{100 - form.startingOdds}%</span><span className="text-[11px] text-[#152B43]/35 ml-1">NO</span></div>
                </div>
                <div className="flex gap-3 mt-2 text-[11px] text-[#152B43]/45">
                  <span>{CATEGORY_ICONS[form.category]} {form.category}</span>
                  {form.endDate && <span>· Ends {form.endDate}</span>}
                </div>
              </div>
              <div className="text-xs text-[#152B43]/50 leading-relaxed p-3 border border-[#152B43]/10" style={{ background: '#F2F0EA', borderRadius: 3 }}>
                By publishing this market you agree to our Market Creation Guidelines. Markets must be verifiable and have a clear resolution source.
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#152B43]/15 px-4 py-3 flex justify-between items-center" style={{ background: '#F2F0EA' }}>
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 min-w-[80px] text-sm text-[#152B43]/55 border border-[#152B43]/15 hover:border-[#152B43] transition-colors" style={{ borderRadius: 3, boxShadow: BEVEL_RAISED }}>← Back</button>
            : <div />
          }
          {step < 3
            ? <button onClick={() => setStep(s => s + 1)} style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BEVEL_DARK }} className="px-5 py-2.5 min-w-[120px] bg-[#152B43] text-white text-sm font-700 uppercase tracking-wider hover:brightness-110 transition-all">Continue →</button>
            : <button style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BEVEL_DARK }} className="px-5 py-2.5 min-w-[140px] bg-[#E15B36] text-white text-sm font-700 uppercase tracking-wider hover:bg-[#c94d2e] transition-colors">Publish Market</button>
          }
        </div>
      </div>
    </div>
  )
}

// ─── TermsView ────────────────────────────────────────────────────────────────

function TermsView({ onClose }: { onClose: () => void }) {
  const TERMS = [
    { title: '1. Nature of Service — Prediction Market, Not a Sportsbook', body: `Polka.trade is a peer-to-peer prediction market platform. It is not a sportsbook, casino, lottery, or bookmaker. Users trade shares representing the probability that a specified future event will occur. Polka.trade does not set odds, does not act as a bookmaker, and does not take positions against users. All trades occur between users on an open market. The price of a YES or NO share reflects the collective market belief in the probability of an outcome — not a fixed payout offered by Polka.trade.` },
    { title: '2. Eligibility', body: `You must be at least 18 years of age to use Polka.trade. By accessing the platform you confirm you are of legal age in your jurisdiction and that prediction market participation is lawful where you reside. Polka.trade is operated for and by Kenyan users but is not affiliated with, licensed by, or operating under the Betting Control and Licensing Board (BCLB) of Kenya, as it does not constitute betting under applicable Kenyan law.` },
    { title: '3. How Markets Work', body: `Each market poses a binary question that resolves YES or NO on a future date. Users purchase YES or NO shares at the current market price. Share prices move between 1% and 99% based on supply and demand. At resolution, YES shares pay out 1 KES per share if the outcome is YES; NO shares pay out 1 KES per share if the outcome is NO. All other shares expire worthless. Market resolution is determined by the criteria published at market creation and verified by Polka.trade's resolution committee using publicly verifiable sources.` },
    { title: '4. Platform Fees', body: `Polka.trade charges a 2% fee on winnings. This fee funds platform operations, resolution processes, and liquidity provisioning. No fee is charged on losing positions. Fees are deducted automatically at resolution and displayed transparently before you confirm any trade.` },
    { title: '5. Market Creation', body: `Any verified user may create a market. Market creators must provide a clear question, a specific resolution date, and objective resolution criteria. Polka.trade reserves the right to void, pause, or cancel any market that cannot be resolved objectively, is based on private or insider information, violates community guidelines, or poses legal risk to the platform or its users.` },
    { title: '6. Responsible Participation', body: `Prediction markets involve financial risk. You may lose the full value of your invested amount. Never trade more than you can afford to lose. Polka.trade provides tools including spending limits, cooling-off periods, and self-exclusion for users who require them. If you believe you have a problem, contact the Kenya Responsible Gambling Foundation.` },
    { title: '7. KYC & AML Compliance', body: `Polka.trade complies with Kenya's Proceeds of Crime and Anti-Money Laundering Act (POCAMLA). All users must complete identity verification (KYC) before withdrawing funds. We are obligated to report suspicious transactions to the Financial Reporting Centre (FRC) of Kenya.` },
    { title: '8. Dispute Resolution', body: `Any dispute regarding market resolution must be submitted within 72 hours of the resolution decision. Polka.trade's resolution committee will review within 7 business days. Unresolved disputes are subject to binding arbitration under the Nairobi Centre for International Arbitration (NCIA) rules. These terms are governed by the laws of Kenya.` },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#152B43]/50 p-3 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[88dvh] flex flex-col bg-[#FAF9F6] overflow-hidden" style={{ borderRadius: 4, border: '1px solid rgba(21,43,67,0.18)' }} onClick={e => e.stopPropagation()}>
        <div className="border-b border-[#152B43]/15 px-4 py-4 flex items-center justify-between shrink-0" style={{ background: '#DCE7EF', boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset' }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/45 font-600">Legal Document</div>
            <div className="text-sm font-600 text-[#152B43] mt-0.5">Terms & Conditions — Polka.trade</div>
          </div>
          <button onClick={onClose} className="text-[#152B43]/40 hover:text-[#152B43] text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          {TERMS.map(({ title, body }) => (
            <div key={title}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-sm font-700 text-[#152B43] uppercase tracking-wide mb-1.5">{title}</div>
              <p className="text-xs text-[#152B43]/65 leading-relaxed">{body}</p>
            </div>
          ))}
          <p className="text-[10px] text-[#152B43]/35 pt-4 border-t border-[#152B43]/10">Last updated: January 2025 · Polka.trade · Nairobi, Kenya · support@polka.trade</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function PolkaApp() {
  const [activeView, setActiveView] = useState<View>('markets')
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'trending' | 'volume' | 'ending'>('trending')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const filteredMarkets = MARKETS
    .filter(m => activeCategory === 'All' || m.category === activeCategory)
    .filter(m => m.question.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'trending') return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0)
      if (sortBy === 'volume') return parseInt(b.volume.replace(/\D/g, '')) - parseInt(a.volume.replace(/\D/g, ''))
      return 0
    })

  const liveCount = MARKETS.filter(m => m.isLive).length

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#F2F0EA', fontFamily: 'Geist, Inter, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-[#152B43]/20" style={{ background: '#152B43', boxShadow: '0 2px 8px rgba(21,43,67,0.25)' }}>
        <div className="flex items-center h-12 px-3 sm:px-4 gap-2">
          {/* Logo */}
          <div className="shrink-0 mr-2 sm:mr-4">
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '-0.01em' }} className="text-lg sm:text-xl font-700 text-[#FAF9F6]">POLKA</span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-lg sm:text-xl font-500 text-[#E15B36]">.TRADE</span>
          </div>

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
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <button
              onClick={() => setShowCreate(true)}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BEVEL_DARK }}
              className="hidden sm:block px-3 py-1.5 text-sm font-700 uppercase tracking-wider bg-[#E15B36] text-white hover:brightness-110 transition-all active:scale-95"
            >
              + Create
            </button>
            <button
              onClick={() => setShowSignIn(true)}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: '0 1px 0 rgba(255,255,255,0.1) inset, 0 -1px 0 rgba(0,0,0,0.15) inset', border: '1px solid rgba(255,255,255,0.18)' }}
              className="px-3 py-1.5 text-sm font-600 text-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(v => !v)}
              className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-1 text-white/70 hover:text-white"
            >
              <span className="w-5 h-0.5 bg-current" />
              <span className="w-5 h-0.5 bg-current" />
              <span className="w-5 h-0.5 bg-current" />
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {showMobileMenu && (
          <div className="sm:hidden border-t border-white/10 px-3 py-2 flex gap-1" style={{ background: '#0f2035' }}>
            {([
              { key: 'markets', label: 'Markets' },
              { key: 'portfolio', label: 'Portfolio' },
              { key: 'leaderboard', label: 'Leaderboard' },
            ] as { key: View; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setActiveView(key); setShowMobileMenu(false) }}
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 2 }}
                className={`flex-1 py-2 text-sm font-600 uppercase tracking-wider transition-colors ${activeView === key ? 'bg-white/10 text-white' : 'text-white/50'}`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => { setShowCreate(true); setShowMobileMenu(false) }}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 2, boxShadow: BEVEL_DARK }}
              className="flex-1 py-2 text-sm font-700 uppercase tracking-wider bg-[#E15B36] text-white"
            >
              + Create
            </button>
          </div>
        )}
      </header>

      {/* ── Live ticker ── */}
      <div className="border-b border-[#152B43]/15 overflow-hidden" style={{ background: '#DCE7EF' }}>
        <div className="flex items-center gap-3 px-3 sm:px-4 py-1.5 overflow-x-auto">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E15B36] animate-pulse" />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[11px] font-700 uppercase tracking-widest text-[#E15B36] whitespace-nowrap">{liveCount} Live</span>
          </span>
          <div className="flex gap-4 overflow-x-auto">
            {MARKETS.filter(m => m.isLive).map(m => (
              <button key={m.id} onClick={() => setSelectedMarket(m)} className="shrink-0 flex items-center gap-1.5 text-[11px] text-[#152B43]/65 hover:text-[#152B43] transition-colors whitespace-nowrap">
                <span className="max-w-[140px] truncate">{m.question}</span>
                <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-[#152B43] font-600">{m.yesOdds}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar — hidden on mobile */}
        <aside className="hidden md:flex flex-col w-40 lg:w-44 shrink-0 border-r border-[#152B43]/12" style={{ background: '#FAF9F6' }}>
          <div className="p-2.5">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/35 font-600 mb-1.5 px-1">Categories</div>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full flex items-center gap-2 px-2 py-2 text-xs font-500 transition-colors text-left ${activeCategory === cat ? 'bg-[#DCE7EF] text-[#152B43]' : 'text-[#152B43]/55 hover:text-[#152B43] hover:bg-[#F2F0EA]'}`}
                style={{ borderRadius: 2 }}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{cat}</span>
                {activeCategory === cat && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E15B36]" />}
              </button>
            ))}
          </div>
          <div className="p-2.5 mt-auto border-t border-[#152B43]/10">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/35 font-600 mb-1.5 px-1">Platform</div>
            {[
              { label: 'Markets', val: MARKETS.length },
              { label: 'Live Now', val: liveCount },
              { label: 'Traders', val: '14.2K' },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between px-2 py-1.5 text-xs">
                <span className="text-[#152B43]/45">{label}</span>
                <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-[#152B43] font-500">{val}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col">

          {activeView === 'markets' && (
            <>
              {/* Mobile category scroll */}
              <div className="md:hidden flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-[#152B43]/10" style={{ background: '#FAF9F6' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{ borderRadius: 3, fontFamily: 'Barlow Condensed, sans-serif', boxShadow: activeCategory === cat ? BEVEL_DARK : BEVEL_RAISED }}
                    className={`shrink-0 px-2.5 py-1.5 text-[11px] font-600 uppercase tracking-wider border whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#152B43] text-white border-[#152B43]' : 'bg-[#FAF9F6] text-[#152B43]/55 border-[#152B43]/15'}`}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>

              {/* Toolbar */}
              <div className="border-b border-[#152B43]/12 px-3 sm:px-4 py-2 flex items-center gap-2" style={{ background: '#FAF9F6' }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search markets…"
                  className="flex-1 min-w-0 bg-[#F2F0EA] border border-[#152B43]/12 px-3 py-2 text-xs text-[#152B43] placeholder-[#152B43]/25 outline-none focus:border-[#152B43]"
                  style={{ borderRadius: 3, boxShadow: BEVEL_INSET }}
                />
                <div className="flex items-center gap-1 shrink-0">
                  {(['trending', 'volume'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: sortBy === s ? BEVEL_DARK : BEVEL_RAISED }}
                      className={`px-2 sm:px-2.5 py-1.5 text-[11px] font-600 uppercase tracking-wider border transition-all ${sortBy === s ? 'bg-[#152B43] text-white border-[#152B43]' : 'bg-[#FAF9F6] border-[#152B43]/15 text-[#152B43]/45 hover:border-[#152B43]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column header — desktop only */}
              <div className="hidden md:flex items-center px-4 py-2 border-b border-[#152B43]/15" style={{ background: '#152B43' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="flex-1 text-[10px] uppercase tracking-widest text-[#FAF9F6]/35 font-600">Market</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#FAF9F6]/35 font-600 w-24 text-right hidden lg:block">Volume</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#FAF9F6]/35 font-600 w-20 text-right">Predict</span>
              </div>

              {/* Rows */}
              <div className="flex-1 overflow-y-auto">
                {filteredMarkets.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-[#152B43]/30 text-sm">No markets found.</div>
                ) : (
                  filteredMarkets.map((m, i) => (
                    <MarketRow key={m.id} market={m} index={i} onSelect={setSelectedMarket} />
                  ))
                )}
              </div>
            </>
          )}

          {activeView === 'portfolio' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-5xl font-700 text-[#152B43]/8">PORTFOLIO</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-lg font-700 text-[#152B43]/40 uppercase tracking-wide">Your positions appear here</div>
              <p className="text-sm text-[#152B43]/35 max-w-xs">Sign in to view open positions, resolved markets, and your trading history.</p>
              <button
                onClick={() => setShowSignIn(true)}
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, boxShadow: BEVEL_DARK }}
                className="mt-3 px-6 py-2.5 bg-[#152B43] text-[#FAF9F6] text-sm font-700 uppercase tracking-wider hover:brightness-110 transition-all"
              >
                Sign In to Trade
              </button>
            </div>
          )}

          {activeView === 'leaderboard' && (
            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-[#152B43]/15 px-4 py-3" style={{ background: '#152B43' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-xs uppercase tracking-widest text-[#FAF9F6]/50 font-600">Top Traders — September 2025</div>
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
                <div key={rank} className="flex items-center gap-3 px-4 py-3 border-b border-[#152B43]/10" style={{ background: i % 2 === 0 ? '#FAF9F6' : '#DCE7EF' }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className={`text-lg font-700 w-5 shrink-0 ${rank <= 3 ? 'text-[#E15B36]' : 'text-[#152B43]/25'}`}>{rank}</span>
                  <div className="w-8 h-8 rounded-full bg-[#152B43] flex items-center justify-center text-xs text-white font-600 shrink-0" style={{ boxShadow: BEVEL_DARK }}>{name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-600 text-[#152B43]">{name}</div>
                    <div className="text-[11px] text-[#152B43]/40">{markets} markets · {accuracy} accuracy</div>
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm font-500 text-[#152B43] shrink-0 text-right">{profit}</div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right rail — large screens only */}
        <aside className="hidden xl:flex flex-col w-52 shrink-0 border-l border-[#152B43]/12" style={{ background: '#FAF9F6' }}>
          <div className="border-b border-[#152B43]/10">
            <div className="px-3 py-2 border-b border-[#152B43]/10" style={{ background: '#DCE7EF' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/45 font-600">Top Movers (24h)</span>
            </div>
            {TOP_MOVERS.map((m, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b border-[#152B43]/8" style={{ background: i % 2 === 0 ? '#FAF9F6' : '#F2F0EA' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[#152B43] leading-snug truncate">{m.question}</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-[10px] text-[#152B43]/35 mt-0.5">{m.yes}% YES</div>
                </div>
                <span style={{ fontFamily: 'Geist Mono, monospace' }} className={`text-[11px] font-600 shrink-0 ${m.change.startsWith('+') ? 'text-[#2A6B3A]' : 'text-[#E15B36]'}`}>{m.change}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="px-3 py-2 border-b border-[#152B43]/10" style={{ background: '#DCE7EF' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest text-[#152B43]/45 font-600">Recent Activity</span>
            </div>
            {RECENT_BETS.map((b, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2.5 border-b border-[#152B43]/8" style={{ background: i % 2 === 0 ? '#FAF9F6' : '#F2F0EA' }}>
                <div className="w-6 h-6 rounded-full bg-[#152B43] flex items-center justify-center text-[10px] text-white font-600 shrink-0 mt-0.5">{b.user[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#152B43]/45 truncate">{b.user} · <span className="font-600 text-[#152B43]">{b.action}</span></div>
                  <div className="text-[10px] text-[#152B43]/35 truncate">{b.market}</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace' }} className="text-[10px] text-[#152B43] mt-0.5">{b.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#152B43]/25 px-3 sm:px-5 py-3" style={{ background: '#152B43' }}>
        <div className="flex flex-wrap items-center gap-3">
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-xs font-700 text-[#FAF9F6]/70 tracking-wider">POLKA<span className="text-[#E15B36]">.TRADE</span></span>
          <span className="text-[#FAF9F6]/20 text-xs hidden sm:block">·</span>
          <span className="text-[#FAF9F6]/20 text-xs hidden sm:block">Nairobi, Kenya</span>
          <div className="flex gap-3 ml-auto flex-wrap">
            {[
              { label: 'Terms', action: () => setShowTerms(true) },
              { label: 'How It Works', action: () => {} },
              { label: 'FAQ', action: () => {} },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="text-[10px] text-[#FAF9F6]/35 hover:text-[#FAF9F6] transition-colors uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-[#FAF9F6]/18 mt-1.5">
          Polka.trade is a prediction market — not a sportsbook, casino, or bookmaker. 18+ only. Trade responsibly. © 2025 Polka.trade
        </p>
      </footer>

      {/* ── Modals ── */}
      {selectedMarket && <MarketDetail market={selectedMarket} onClose={() => setSelectedMarket(null)} />}
      {showCreate && <CreateMarket onClose={() => setShowCreate(false)} />}
      {showTerms && <TermsView onClose={() => setShowTerms(false)} />}
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  )
}
