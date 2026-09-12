// ─── Volume formatting ────────────────────────────────────────────────────────

export function formatVolume(v: number): string {
  if (v >= 1_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `KES ${(v / 1_000).toFixed(0)}K`
  return `KES ${v.toLocaleString()}`
}

export function formatKES(v: number): string {
  return `KES ${v.toLocaleString()}`
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
 * 149 KES is split across YES/NO pools according to creator's starting odds.
 */
export function seedSplit(startingOdds: number) {
  const seed = 149
  const yesPool = Math.round(seed * (startingOdds / 100))
  const noPool = seed - yesPool
  return { seed, yesPool, noPool }
}
