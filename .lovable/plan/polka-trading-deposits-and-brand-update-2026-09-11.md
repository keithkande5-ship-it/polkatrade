# Polka trading, deposits, and brand update

## What will change
- Replace the existing text branding with the supplied Polka logo in the header, footer, sign-in area, and browser icon.
- Add a short branded splash screen when the site first opens, with restrained anticipation animation before revealing the market board.
- Move the Place Prediction panel above the Overview and Activity tabs in market details.
- Add `+100`, `+1,000`, and `+10,000` quick-add controls, plus a prominent green expected outcome amount before confirmation.
- Make confirmation create an open position and show it immediately in both the selected market and Portfolio.
- Allow adding more money only to the same chosen outcome for an existing market; disable switching to the opposite outcome until resolution.
- Complete sign-in interactions so a successful sign-in replaces the Sign In control with a yellow Deposit pill.
- Add a dedicated M-Pesa deposit view with phone number, amount presets/custom amount, confirmation state, and a simulated wallet balance update.
- Preserve the existing market list, styling, create-market flow, leaderboard, terms, and current layout.

## Technical details
- Keep this frontend-only: sign-in, wallet deposits, and positions are simulated in React state and reset on page refresh.
- Reuse the current single-screen navigation pattern by adding `deposits` as an app view rather than restructuring the project.
- Store each position by market ID with its selected outcome, total committed amount, expected outcome value, and resolution date.
- Derive the favicon from the supplied logo and store the main logo through the project asset system.
- Verify the full flow at mobile and desktop sizes: splash → sign in → deposit → market trade → portfolio → add to same position.
