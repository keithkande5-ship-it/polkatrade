// ─── Volume formatting ────────────────────────────────────────────────────────

export function formatVolume(v: number): string {
  if (v >= 1_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `KES ${(v / 1_000).toFixed(0)}K`
  return `KES ${v.toLocaleString()}`
}

export function formatKES(v: number): string {
  return `KES ${v.toLocaleString()}`
}

// ─── PalPluss withdrawal fee schedule (KES) ───────────────────────────────────

const WITHDRAWAL_FEE_TIERS: { max: number; fee: number }[] = [
  { max: 499, fee: 12 },
  { max: 999, fee: 18 },
  { max: 1499, fee: 23 },
  { max: 2499, fee: 30 },
  { max: 3499, fee: 33 },
  { max: 4999, fee: 40 },
  { max: 7499, fee: 50 },
  { max: 9999, fee: 55 },
  { max: 14999, fee: 65 },
  { max: 19999, fee: 85 },
  { max: 34999, fee: 110 },
  { max: 49999, fee: 150 },
  { max: 149999, fee: 170 },
  { max: 249999, fee: 200 },
]

export function getWithdrawalFee(amount: number): number {
  if (!Number.isFinite(amount) || amount < 50) return 0
  for (const tier of WITHDRAWAL_FEE_TIERS) {
    if (amount <= tier.max) return tier.fee
  }
  return Math.round(amount * 0.02)
}

// Hide volume/trader count for thin markets
export function shouldHideStats(volume: number, participants: number): boolean {
  return volume < 1_000 || participants < 10
}

// ─── Parimutuel math ──────────────────────────────────────────────────────────
// Platform always profits via 2% fee on every resolved pool.
// Winners receive: (their stake / winning pool) * total pool * 0.98
// This guarantees: platform never owes more than what was collected.

const FEE = 0.02

/**
 * Estimate parimutuel payout for a bet.
 * @param stake      KES bet by user
 * @param oddsPercent Probability of winning (0–100)
 * @returns Expected KES return if this position wins
 */
export function estimatePayout(stake: number, oddsPercent: number): number {
  if (oddsPercent <= 0) return 0
  return (stake * (1 - FEE)) / (oddsPercent / 100)
}

export function estimateProfit(stake: number, oddsPercent: number): number {
  return estimatePayout(stake, oddsPercent) - stake
}

/**
 * Combo checkout math.
 * Each position gets an equal share of the total amount.
 * Estimated total payout assumes all positions win independently.
 */
export function comboMath(numPositions: number, addedAmount: number, positions: { odds: number }[]) {
  const baseAmount = numPositions  // 1 KES per position
  const totalStake = baseAmount + addedAmount
  const perPosition = totalStake / numPositions

  const totalEstimatedReturn = positions.reduce((sum, p) => {
    return sum + estimatePayout(perPosition, p.odds)
  }, 0)

  const platformFee = totalStake * FEE
  const estimatedProfit = totalEstimatedReturn - totalStake

  return {
    baseAmount,
    totalStake,
    perPosition,
    totalEstimatedReturn,
    estimatedProfit,
    platformFee,
  }
}

/**
 * Market creation seed split.
 * The seed is split across every outcome pool in proportion to its starting
 * odds; pools always sum to exactly the seed amount (largest-remainder rounding).
 * Pass a single YES probability for binary markets, or one odds value per outcome.
 */
export function seedSplit(startingOdds: number | number[], numOutcomes = 2, seedAmount = 100) {
  const seed = Math.max(0, Math.round(seedAmount))
  const n = Math.max(2, Array.isArray(startingOdds) ? Math.max(numOutcomes, startingOdds.length) : numOutcomes)
  const weights: number[] = Array.isArray(startingOdds)
    ? startingOdds.slice(0, n)
    : n === 2 ? [startingOdds, 100 - startingOdds] : Array.from({ length: n }, () => 100 / n)
  while (weights.length < n) weights.push(0)
  const safe = weights.map(w => (Number.isFinite(w) && w > 0 ? w : 0))
  const total = safe.reduce((s, w) => s + w, 0)
  const raw = safe.map(w => (total > 0 ? (seed * w) / total : seed / n))
  const pools = raw.map(r => Math.floor(r))
  let remainder = seed - pools.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f)
  for (let k = 0; remainder > 0; k++, remainder--) {
    const idx = order[k % n]!.i
    pools[idx] = (pools[idx] ?? 0) + 1
  }
  return { seed, pools, yesPool: pools[0] ?? 0, noPool: pools[1] ?? 0 }
}
