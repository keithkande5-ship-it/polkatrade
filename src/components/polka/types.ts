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
  outcomes?: Outcome[]
  volume: number       // KES integer
  endsAt: string
  isLive: boolean
  isResolved?: boolean
  winner?: string      // resolved winner label
  trending?: boolean
  participants: number
  description: string
  seedPool?: number    // creator seed (149 KES splits YES/NO)
}

export type ComboPosition = {
  marketId: number
  marketQuestion: string
  position: string
  odds: number         // 0–100 probability
  customAmount?: number // if set from market detail
  isNew?: boolean      // for flash animation
}

export type PortfolioTrade = {
  id: string
  marketId?: number
  market: string
  position: string
  stake: number
  odds: number
  status: 'open' | 'won' | 'lost' | 'resolved'
  payout?: number
  date: string
  isCombo?: boolean
  comboLegs?: number
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
