import type { Market, PortfolioTrade, WalletEntry } from './types'

export const MARKETS: Market[] = [
  {
    id: 1, question: 'Will Ruto complete his full term as President through 2027?',
    category: 'Kenya', yesOdds: 72, noOdds: 28, volume: 4_200_000, endsAt: 'Dec 2027',
    isLive: true, trending: true, participants: 3241,
    description: 'Resolves YES if William Ruto serves as President of Kenya until the 2027 general election without resignation, impeachment, or incapacitation.',
  },
  {
    id: 2, question: 'Will Bitcoin exceed $150,000 before end of 2025?',
    category: 'Crypto', yesOdds: 54, noOdds: 46, volume: 8_900_000, endsAt: 'Dec 31 2025',
    isLive: true, trending: true, participants: 7812,
    description: 'Resolves YES if BTC/USD closing price on any day exceeds $150,000 before Dec 31 2025 per CoinGecko.',
  },
  {
    id: 3, question: 'Who will win the 2024/25 Premier League?',
    category: 'Sports', yesOdds: 31, noOdds: 69, volume: 5_400_000, endsAt: 'May 25 2025',
    isLive: false, isResolved: true, winner: 'Arsenal',
    participants: 4820,
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
    id: 4, question: "Will Kenya's inflation drop below 3% in 2025?",
    category: 'Kenya', yesOdds: 44, noOdds: 56, volume: 1_300_000, endsAt: 'Dec 2025',
    isLive: false, participants: 892,
    description: 'Resolves YES if the Kenya National Bureau of Statistics reports headline inflation below 3% in any month of 2025.',
  },
  {
    id: 5, question: 'Who will win AFCON 2025?',
    category: 'Sports', yesOdds: 23, noOdds: 77, volume: 2_800_000, endsAt: 'Feb 2025',
    isLive: false, isResolved: true, winner: 'Morocco',
    participants: 3340,
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
    id: 6, question: 'Who will win the 2024 US Presidential Election?',
    category: 'Politics', yesOdds: 55, noOdds: 45, volume: 12_400_000, endsAt: 'Nov 5 2024',
    isLive: false, isResolved: true, winner: 'Donald Trump',
    participants: 14220,
    description: 'Resolves to the candidate who wins the 2024 US Presidential election per official Electoral College results.',
    outcomes: [
      { label: 'Donald Trump', odds: 55, color: '#8B2A1A' },
      { label: 'Kamala Harris', odds: 43, color: '#2A3A8B' },
      { label: 'Other', odds: 2, color: '#6B6B5C' },
    ],
  },
  {
    id: 7, question: 'Will Ethereum flip Bitcoin by market cap in 2025?',
    category: 'Crypto', yesOdds: 12, noOdds: 88, volume: 3_700_000, endsAt: 'Dec 31 2025',
    isLive: false, participants: 4401,
    description: 'Resolves YES if ETH market cap exceeds BTC market cap at any point in 2025 per CoinGecko.',
  },
  {
    id: 8, question: 'Will Sauti Sol release a new studio album in 2025?',
    category: 'Entertainment', yesOdds: 61, noOdds: 39, volume: 340_000, endsAt: 'Dec 31 2025',
    isLive: false, participants: 512,
    description: 'Resolves YES if Sauti Sol officially releases a full studio album in 2025.',
  },
  {
    id: 9, question: 'Who will win the 2025 Kenyan Premier League?',
    category: 'Sports', yesOdds: 35, noOdds: 65, volume: 1_200_000, endsAt: 'Aug 2025',
    isLive: true, participants: 1890,
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
    id: 10, question: 'Will OpenAI release GPT-5 before July 2025?',
    category: 'Science', yesOdds: 67, noOdds: 33, volume: 5_100_000, endsAt: 'Jul 1 2025',
    isLive: true, trending: true, participants: 9034,
    description: 'Resolves YES if OpenAI officially announces and releases a model labelled GPT-5 before July 1 2025.',
  },
  {
    id: 11, question: 'Will M-PESA process over 1 trillion KES per month in 2025?',
    category: 'Business', yesOdds: 80, noOdds: 20, volume: 1_800_000, endsAt: 'Dec 2025',
    isLive: false, participants: 1204,
    description: 'Resolves YES if Safaricom reports M-PESA monthly transaction value exceeding KES 1 trillion in any month of 2025.',
  },
  {
    id: 12, question: 'Will Solana (SOL) exceed $500 in 2025?',
    category: 'Crypto', yesOdds: 38, noOdds: 62, volume: 2_600_000, endsAt: 'Dec 31 2025',
    isLive: false, participants: 3301,
    description: 'Resolves YES if SOL/USD closing price exceeds $500 on any day before Dec 31 2025.',
  },
  {
    id: 13, question: 'Who will win the F1 World Championship 2025?',
    category: 'Sports', yesOdds: 42, noOdds: 58, volume: 3_100_000, endsAt: 'Nov 2025',
    isLive: false, participants: 2770,
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
    id: 14, question: 'Will Twitter/X reach 1B monthly active users by end of 2025?',
    category: 'Twitter', yesOdds: 29, noOdds: 71, volume: 890_000, endsAt: 'Dec 31 2025',
    isLive: false, participants: 1102,
    description: 'Resolves YES if Elon Musk or X Corp officially reports 1 billion monthly active users by Dec 31 2025.',
  },
  {
    id: 15, question: 'Will TikTok be banned in the US in 2025?',
    category: 'TikTok', yesOdds: 41, noOdds: 59, volume: 6_200_000, endsAt: 'Dec 31 2025',
    isLive: true, trending: true, participants: 8820,
    description: 'Resolves YES if US federal law or executive order results in TikTok being effectively banned for US users in 2025.',
  },
  {
    id: 16, question: 'Will Instagram Threads exceed 500M daily active users in 2025?',
    category: 'Instagram', yesOdds: 52, noOdds: 48, volume: 1_450_000, endsAt: 'Dec 31 2025',
    isLive: false, participants: 1780,
    description: 'Resolves YES if Meta officially reports Threads crossing 500M daily active users at any point in 2025.',
  },
  {
    id: 17, question: 'Will a Kenya Twitter/X trend rank globally Top 10 in 2025?',
    category: 'Twitter', yesOdds: 66, noOdds: 34, volume: 420, endsAt: 'Dec 31 2025',
    isLive: false, participants: 7,
    description: 'Resolves YES if a Kenyan hashtag or trend appears in Twitter/X global Top 10 trending list at any point in 2025.',
  },
  {
    id: 18, question: "Will Kenya's GDP growth exceed 6% in 2025?",
    category: 'Kenya', yesOdds: 38, noOdds: 62, volume: 670_000, endsAt: 'Dec 2025',
    isLive: false, participants: 730,
    description: 'Resolves YES if the World Bank or Kenya National Treasury confirms GDP growth above 6% for full year 2025.',
  },
]

export const MOCK_PROFILE = {
  name: 'Njeri Kamau',
  phone: '+254 712 345 678',
  email: 'njeri.k@email.com',
  balance: 3_720,
  joined: 'March 2025',
  verified: true,
}

export const INITIAL_PORTFOLIO: PortfolioTrade[] = [
  { id: 't1', marketId: 2, market: 'Will Bitcoin exceed $150,000?', position: 'YES', stake: 500, odds: 54, status: 'open', date: '2025-09-10' },
  { id: 't2', marketId: 5, market: 'Who will win AFCON 2025?', position: 'Morocco', stake: 300, odds: 26, status: 'won', payout: 1100, date: '2025-08-15' },
  { id: 't3', marketId: 3, market: 'Who will win Premier League?', position: 'Arsenal', stake: 200, odds: 31, status: 'won', payout: 616, date: '2025-05-25' },
  { id: 't4', marketId: 10, market: 'Will OpenAI release GPT-5?', position: 'YES', stake: 1000, odds: 67, status: 'open', date: '2025-09-01' },
  { id: 'c1', market: 'Combo #1 — 3 markets', position: 'Multi-position', stake: 103, odds: 0, status: 'open', date: '2025-09-11', isCombo: true, comboLegs: 3 },
]

export const INITIAL_WALLET: WalletEntry[] = [
  { id: 'w1', type: 'deposit', amount: 5000, description: 'M-PESA Deposit — 0712 345 678', date: 'Sep 1', status: 'completed', sign: '+' },
  { id: 'w2', type: 'bet', amount: 500, description: 'BTC > $150k — YES position', date: 'Sep 10', status: 'completed', sign: '-' },
  { id: 'w3', type: 'win', amount: 1100, description: 'AFCON 2025 — Morocco (WIN)', date: 'Aug 20', status: 'completed', sign: '+' },
  { id: 'w4', type: 'win', amount: 616, description: 'Premier League — Arsenal (WIN)', date: 'May 26', status: 'completed', sign: '+' },
  { id: 'w5', type: 'bet', amount: 1000, description: 'GPT-5 before July 2025 — YES', date: 'Sep 1', status: 'completed', sign: '-' },
  { id: 'w6', type: 'combo', amount: 103, description: 'Combo #1 — 3 positions (3 KES base + KES 100)', date: 'Sep 11', status: 'completed', sign: '-' },
  { id: 'w7', type: 'seed', amount: 149, description: 'Market seed — "Will M-PESA hit 1T?"', date: 'Aug 5', status: 'completed', sign: '-' },
]

export const TOP_MOVERS = [
  { question: 'GPT-5 before July 2025?', change: '+14%', yes: 67 },
  { question: 'BTC > $150k 2025?', change: '+9%', yes: 54 },
  { question: 'Ruto full term 2027?', change: '-6%', yes: 72 },
  { question: 'TikTok US ban 2025?', change: '+11%', yes: 41 },
  { question: 'SOL > $500?', change: '+5%', yes: 38 },
]

export const RECENT_BETS = [
  { user: 'Njeri K.', action: 'YES', market: 'GPT-5 before July 2025', amount: 'KES 5,000' },
  { user: 'Ochieng M.', action: 'NO', market: 'ETH flips BTC', amount: 'KES 12,000' },
  { user: 'Wanjiru A.', action: 'YES', market: 'BTC > $150k', amount: 'KES 3,200' },
  { user: 'Kamau B.', action: 'Arsenal', market: 'Who wins PL?', amount: 'KES 8,500' },
  { user: 'Adhiambo L.', action: 'Morocco', market: 'AFCON 2025', amount: 'KES 1,800' },
]
