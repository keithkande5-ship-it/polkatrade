import stepRegister from '@/assets/tutorial/step-register.jpg'
import stepBrowse from '@/assets/tutorial/step-browse.jpg'
import stepTrade from '@/assets/tutorial/step-trade.jpg'
import stepCombo from '@/assets/tutorial/step-combo.jpg'
import stepWithdraw from '@/assets/tutorial/step-withdraw.jpg'

const NAVY = '#152B43'
const ORANGE = '#E15B36'
const WARM = '#FAF9F6'
const SKY = '#DCE7EF'
const BV_DK = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'

const STEPS = [
  {
    img: stepRegister,
    title: 'Create your account',
    body: 'Register with your phone number in under a minute. You can browse every market without an account, but you need one to place a prediction or move money.',
  },
  {
    img: stepBrowse,
    title: 'Browse the markets',
    body: 'Each market is a question about the future. The percentage is the crowd’s current estimate that the answer is YES. Use the category pills to narrow things down.',
  },
  {
    img: stepTrade,
    title: 'Place a prediction',
    body: 'Pick an outcome, choose an amount (99, 199, 999 or 9,999 KES), and confirm. Payouts are parimutuel — winners share the final pool, so the figure shown is an estimate, never a guarantee.',
  },
  {
    img: stepCombo,
    title: 'Group several predictions',
    body: 'A combo simply groups several independent predictions into one checkout. It is not a parlay — each selection still settles on its own market and result.',
  },
  {
    img: stepWithdraw,
    title: 'Cash out to M-PESA',
    body: 'Winnings land in your Polka balance. Open Wallet & Ledger, tap Withdraw, enter an amount and your M-PESA number, and the payout is queued in your ledger.',
  },
]

export function Tutorial({ onClose, onRegister, onBrowse }: {
  onClose: () => void
  onRegister: () => void
  onBrowse: () => void
}) {
  return (
    <div className="fixed inset-0 z-[95] flex items-stretch justify-center" style={{ background: `${NAVY}F0` }}>
      <div className="w-full sm:max-w-2xl h-full flex flex-col overflow-hidden" style={{ background: WARM }}>

        {/* CTA bar — top */}
        <div className="shrink-0 px-4 py-3 space-y-2.5" style={{ background: NAVY, boxShadow: BV_DK }}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-[10px] uppercase tracking-widest font-600 text-white/40">How Polka works</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif' }} className="text-lg sm:text-xl font-700 text-white leading-tight">Predict what happens next in Kenya</div>
            </div>
            <button onClick={onClose} aria-label="Close tutorial" className="text-white/45 hover:text-white text-2xl w-8 h-8 flex items-center justify-center shrink-0">×</button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRegister}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#2A7B6F', boxShadow: BV_DK }}
              className="flex-1 py-2.5 text-sm font-800 uppercase tracking-wider text-white hover:brightness-110 active:scale-[0.99] transition-all"
            >
              Register account
            </button>
            <button
              onClick={onBrowse}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#F7D000', color: '#6B21A8', boxShadow: BV_DK }}
              className="flex-1 py-2.5 text-sm font-800 uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all"
            >
              Browse markets
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto">
          {STEPS.map((s, i) => (
            <div key={s.title} className="border-b" style={{ background: i % 2 === 0 ? WARM : SKY, borderColor: `${NAVY}12` }}>
              <img
                src={s.img}
                alt={s.title}
                loading="lazy"
                width={1024}
                height={640}
                className="w-full h-auto block"
              />
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span
                    style={{ background: ORANGE, borderRadius: 2, fontFamily: 'Geist Mono, monospace' }}
                    className="w-5 h-5 flex items-center justify-center text-[11px] font-700 text-white shrink-0"
                  >
                    {i + 1}
                  </span>
                  <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', color: NAVY }} className="text-base sm:text-lg font-700 leading-tight">{s.title}</h3>
                </div>
                <p className="text-[13px] sm:text-sm leading-relaxed mt-1.5" style={{ color: `${NAVY}80` }}>{s.body}</p>
              </div>
            </div>
          ))}

          {/* Closing CTA */}
          <div className="px-4 py-5 space-y-2.5" style={{ background: NAVY }}>
            <p className="text-xs text-center" style={{ color: `${WARM}55` }}>Ready to try it? Everything here is a demo — no real money moves.</p>
            <div className="flex gap-2">
              <button
                onClick={onRegister}
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#2A7B6F', boxShadow: BV_DK }}
                className="flex-1 py-2.5 text-sm font-800 uppercase tracking-wider text-white"
              >
                Register account
              </button>
              <button
                onClick={onBrowse}
                style={{ fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 3, background: '#F7D000', color: '#6B21A8', boxShadow: BV_DK }}
                className="flex-1 py-2.5 text-sm font-800 uppercase tracking-wider"
              >
                Browse markets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
