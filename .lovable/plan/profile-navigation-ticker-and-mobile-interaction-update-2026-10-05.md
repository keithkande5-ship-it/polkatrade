# Profile, navigation, ticker, and mobile interaction update

## What will change
- Add a persisted profile photo picker with preview, removal, and initials fallback across profile, menu, and header.
- Give market detail links the requested compact green arrow treatment.
- Synchronize tab and market state with readable query URLs, including initial restore and browser back/forward handling.
- Replace number flips with a vertical rolling ticker while keeping all odds calculations unchanged.
- Increase mobile readability and touch sizing, then prioritize the question and trade controls in market details.
- Make auto-add-to-slip and leaderboard privacy settings affect outcome clicks, leaderboard identity, and activity identity immediately.

## Technical details
- Extend existing profile validation and typing without renaming any localStorage keys.
- Use `history.pushState`, `popstate`, and a shared slug helper; no new routes or packages.
- Use CSS media queries under 640px and React transitions that respect existing data and interaction flows.
- Keep all edits within the four requested files.

## Verification
- Check type safety and the preview build.
- Test desktop and phone layouts, photo persistence, clean URL restoration/back navigation, auto-add behavior, and privacy masking.
