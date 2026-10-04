export type CategoryId =
  | 'All' | 'Sports' | 'Politics' | 'Crypto' | 'Entertainment'
  | 'Kenya' | 'Global' | 'Business' | 'Science'
  | 'Twitter' | 'TikTok' | 'Instagram'
  | (string & {}) // custom categories

export type Outcome = { label: string; odds: number; color: string }

export type Market = {
  id: number
  question: string
  category: CategoryId
  yesOdds: number
  noOdds: number
  outcomes?: Outcome[] | undefined
  volume: number       // KES integer
  endsAt: string
  isLive: boolean
  isResolved?: boolean | undefined
  winner?: string | undefined      // resolved winner label
  trending?: boolean | undefined
  participants: number
  description: string
  seedPool?: number | undefined    // creator seed (149 KES splits YES/NO)
}

export type ComboPosition = {
  marketId: number
  marketQuestion: string
  position: string
  odds: number         // 0–100 probability
  customAmount?: number | undefined // if set from market detail
  isNew?: boolean | undefined      // for flash animation
}

export type PortfolioTrade = {
  id: string
  marketId?: number | undefined
  market: string
  position: string
  stake: number
  odds: number
  status: 'open' | 'won' | 'lost' | 'resolved'
  payout?: number | undefined
  date: string
  isCombo?: boolean | undefined
  comboLegs?: number | undefined
}

export type WalletEntry = {
  id: string
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'seed' | 'combo' | 'loss'
  amount: number
  description: string
  date: string
  status: 'completed' | 'pending'
  sign: '+' | '-'
}

export type View =
  | 'markets' | 'portfolio' | 'leaderboard' | 'wallet'
  | 'profile' | 'account' | 'settings' | 'notifications' | 'language'

export type CustomCategory = {
  id: string
  label: string
  emoji: string
}

export type InfoTab = 'how' | 'responsible' | 'terms' | 'support'

export type PolkaProfile = {
  name: string
  email: string
  phone: string
  joined: string
  verified: boolean
  oddsFormat: 'percent' | 'multiplier'
  signedIn: boolean
}

export type PolkaSettings = {
  confirmTrade: boolean
  autoAddToMultiSlip: boolean
  leaderboardPublic: boolean
}
