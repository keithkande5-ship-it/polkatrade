# Polka discovery, trading, and market-creation upgrade

## Goal
Make the first screen immediately explain Polka, feel actively traded, and keep prediction, combo, account, and market-creation flows understandable for a first-time user—without removing the current skeleton or logo.

## 1. Discovery and promotional banners
- Add a full-width rotating banner above the first market, sized like a wide market card rather than a thin notice.
- Create three polished rectangular image campaigns with built-in subjects and app-focused messaging, including “Welcome to Polka — Kenya’s largest prediction market,” a multi-prediction campaign, and a create-your-own-market campaign.
- Auto-advance, support swipe and arrow/dot navigation, pause while the user interacts, and respect reduced-motion preferences.
- Reveal market rows from left to right as they enter the scrolling feed; animate each row once rather than on every tiny scroll.

## 2. Odds display and live-number motion
- Add a compact `% / decimal` selector immediately left of the signed-in balance. Decimal display uses the live implied probability (`100 ÷ probability`, for example 80% = 1.25x) and updates everywhere odds are shown.
- Increase mobile text, hit areas, and spacing to roughly 125% while reflowing controls to avoid clipping; desktop sizing stays unchanged.
- Build a restrained split-flap/flip transition for changing market odds, volume, trader counts, ticker values, and crypto prices.
- Add floating `+KES …` activity text beside market volume during active scrolling, briefly pausing before the next update. Changes persist while navigating inside the demo session, so returning to a market shows movement from the value previously seen.
- Apply these effects only to market/live-feed data. Balances, entered amounts, ledger values, and calculated outputs will never randomly change.

## 3. Fresh market feed and status clarity
- Add `All`, `Traded`, and `Resolved` before the existing category filters.
- After a confirmed prediction, remove that market from `All` immediately and place it under `Traded`; backfill the feed with a fresh untraded market.
- Keep a resolved market in `All` for five hours after its resolution timestamp, then show it only under `Resolved` and its subject category.
- Add explicit `New`, `Closes today`, `Closed`, `Ended`, and `Resolved` states, plus readable resolution dates, on cards and details.
- Preserve searching and sorting while making all filters predictable.

## 4. Clear prediction and multi-prediction flow
- Rename user-facing “Combo” language to **Multi-prediction** and explain once: it groups several independent predictions into one checkout; it is not a parlay, and each selection settles separately.
- Replace ambiguous labels with **Amount to enter**, **Estimated payout**, **Confirm prediction**, and **Add to multi-prediction**.
- Label payout values as estimates and state that the final parimutuel payout depends on the final winning pool; never present them as guaranteed.
- In market details, default the amount to KES 99 and add quick choices KES 199, 999, and 9,999.
- On mobile, replace the floating bubble/drawer entry with an in-flow “Start a multi-prediction” bar. Once started, outcome taps add directly and a stable checkout bar remains available without covering markets.
- Add clear selection rows in checkout, editable amounts, remove controls, independent estimated payouts, total amount, and a final confirmation.

## 5. Sign-in gates, balance, and wallet
- Start the demo signed out. Show **Sign in** and a green **Register** control; hide balance, deposit, wallet data, profile, and account-only actions.
- Any protected action—confirming a prediction, multi-prediction checkout, creating a market, portfolio/wallet access, deposit, or withdrawal—opens the sign-in/register flow and resumes the intended action after success where practical.
- Keep browsing, searching, market details, How It Works, and FAQ public.
- Finish the ledger with Deposit and Withdraw actions; withdrawals create a simulated pending M-PESA ledger entry and reduce available demo balance only after valid confirmation.
- Confirmed single and multi-predictions update the demo portfolio, wallet, and Traded filter for the current browser session.

## 6. Crypto and market creation
- Add market-type choices before the form: **Yes / No**, **Multiple outcomes**, **Custom outcomes**, and **Crypto price**.
- For Crypto, load a curated CoinGecko coin list with current KES/USD price, 24-hour change, and selection states. Handle loading, offline, empty, and rate-limit states without blocking other market types.
- Let the creator choose a coin, comparison direction, target price, and resolution date. Show the selected live price in review.
- Add outcome editors for multiple/custom markets with validation that probabilities are complete and total 100% where applicable.
- Collect separate **Resolves YES if**, **Resolves NO if**, and **Sources** fields; display all three in market details.
- Show live crypto price on crypto market cards without increasing row height excessively, and add a compact price-history chart in crypto market details.

## 7. Navigation, education, icons, and themes
- Add dedicated How It Works and FAQ pages linked from the footer and menu, written for someone who has never used a prediction market.
- Replace emoji UI markers and category symbols with consistent Lucide icons; retain the actual Polka logo and necessary social brand marks.
- Add a light/dark toggle to the three-bar menu. Convert the current palette to shared semantic theme values so cards, dialogs, tables, banners, and charts remain readable in both modes.
- Preserve the current compact bookmaker-inspired visual language, supplied logo, splash screen, sidebar, right activity rail, and desktop layout.

## Technical details
- Keep account state, trades, balances, feed history, withdrawals, and live market movement as an in-memory interactive demo; they reset after refresh.
- CoinGecko prices are the only real external live data in this pass. Market activity movement is clearly demo market activity, not fabricated account funds or guaranteed payouts.
- Split the large app file into focused display, market, account, and utility modules where needed, without changing visible behavior outside this request.
- Extend market records with status timestamps, resolution criteria, sources, crypto metadata, and demo activity fields.
- Add individual route metadata for the main page, How It Works, and FAQ.

## Verification
- Check desktop and mobile layouts, including a narrow phone with the larger mobile sizing.
- Verify signed-out gating, sign-in/register, single prediction, multi-prediction checkout, traded/resolved filtering, deposit, withdrawal, theme switching, and navigation.
- Verify banner rotation/swiping, reveal animation, changing-number effects, and reduced-motion behavior.
- Verify CoinGecko success and failure states, crypto creation, card price display, and detail chart.
