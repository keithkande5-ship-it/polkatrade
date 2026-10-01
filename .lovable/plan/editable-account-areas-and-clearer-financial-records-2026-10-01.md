# Editable account areas and clearer financial records

## What will change

### Profile
- Turn **My Profile** into an editable form for display name, phone number, and email.
- Keep membership date and verification status read-only.
- Use an **Edit profile** action that switches the page into edit mode, with **Save changes** and **Cancel** controls.
- Validate required fields and show a short success notification after saving.

### My Account
- Separate account access controls from public profile information.
- Let the user update login email and phone number through focused edit panels.
- Add a password-change form with current password, new password, confirmation, show/hide controls, and basic validation.
- Make two-factor authentication an interactive on/off setting with a confirmation step.
- Keep KYC status read-only and make **Close account** require an explicit confirmation rather than acting immediately.

### Settings
- Replace the decorative switches with working controls.
- Trading settings: editable default prediction amount, confirm-before-prediction toggle, and automatic multi-prediction add toggle.
- Privacy settings: leaderboard visibility, public profile, and trading-history visibility.
- Security rows that belong to account management will link to **My Account** instead of duplicating forms.
- Saved settings will immediately affect the current demo session where applicable.

### Language
- Make the language choices selectable instead of showing inactive “Soon” labels.
- Show the selected language clearly and save the preference for the current demo session.
- Keep the existing interface text unchanged for now; the selector will be ready for later translation content rather than pretending every page is already translated.

### Portfolio table
- Replace the stacked basic rows with a structured, responsive table.
- Add horizontal filter pills: **All**, **Open**, **Won**, **Lost**, and **Multi-predictions**, each with a count.
- Label columns clearly: **Market**, **Outcome**, **Amount entered**, **Entry odds**, **Status**, **Result / payout**, and **Date**.
- Switching a pill updates the table instantly without leaving the page.
- Keep the balance and performance summary above the table, but improve the labels and preserve the current visual style.
- On mobile, keep the same filters in a horizontally scrollable strip and convert each table row into a clearly labelled compact record so no values are cut off.

### Wallet table
- Replace the basic ledger list with a structured, responsive transaction table.
- Add horizontal filter pills: **All**, **Deposits**, **Withdrawals**, **Predictions**, **Winnings**, and **Pending**, each with a count.
- Label columns clearly: **Transaction**, **Type**, **Amount**, **Status**, and **Date**.
- Use clear positive/negative amount styling and distinct status pills while retaining Deposit and Withdraw actions above the records.
- On mobile, use compact labelled records beneath the horizontally scrollable filter strip.

## Interaction and data behavior
- Profile, account, settings, and language edits will update shared React state so changes appear consistently across these areas during the current session.
- Existing wallet and portfolio records remain intact; only their presentation, labels, filtering, and sorting are changed.
- Empty filter results will show a useful state and a relevant action rather than a blank table.
- Preserve the current Polka logo, colors, typography, desktop structure, and mobile navigation.

## Technical details
- Extend the existing in-memory profile/settings state rather than adding a backend or changing the current prototype model.
- Add local filter state inside the wallet and portfolio views; no page reload is required when pills change.
- Use existing Lucide icon patterns for edit, save, security, transaction, and status actions.
- Keep fixed account facts such as verification status and membership date non-editable.

## Verification
- Test editing, cancelling, saving, validation, password mismatch, two-factor confirmation, account-close confirmation, setting toggles, and language selection.
- Test every wallet and portfolio pill, its count, empty state, and newly added prediction/deposit/withdrawal records.
- Verify the table presentation on desktop and the compact labelled presentation at the current 393 × 852 mobile size.
