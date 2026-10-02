import { useState } from 'react'
import { X, Smartphone, ListChecks, Target, Zap, ShieldCheck, MessageCircle } from 'lucide-react'
import type { InfoTab } from './types'

const BV_DK = '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.20) inset'
const BV_IN = '0 1px 3px rgba(21,43,67,0.10) inset, 0 1px 0 rgba(255,255,255,0.40)'
const NAVY = '#152B43'
const ORANGE = '#E15B36'
const SKY = '#DCE7EF'
const WARM = '#FAF9F6'
const MINERAL = '#F2F0EA'
const HEAD = { fontFamily: 'Barlow Condensed, sans-serif' }

const TABS: { id: InfoTab; label: string }[] = [
  { id: 'how', label: 'How It Works' },
  { id: 'responsible', label: 'Responsible Trading' },
  { id: 'terms', label: 'Terms & Privacy' },
  { id: 'support', label: 'Support' },
]

const STEPS = [
  { Icon: Smartphone, title: 'Deposit KES via M-Pesa', body: 'Top up from KES 100. Approve the STK push on your phone and your balance updates once payment is confirmed.' },
  { Icon: ListChecks, title: 'Pick a market', body: 'Browse Kenya, sports, politics, crypto and more. Every market shows its rules and official resolution source.' },
  { Icon: Target, title: 'Predict', body: 'Choose an outcome and an amount. You see an estimated payout before you confirm.' },
  { Icon: Zap, title: 'Instant payout', body: 'When the market resolves, winners share the pool (less a 2% fee) straight to their wallet, ready to withdraw to M-Pesa.' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border p-3" style={{ background: WARM, borderRadius: 3, borderColor: `${NAVY}15` }}>
      <div style={{ ...HEAD, color: NAVY }} className="text-sm font-700 uppercase tracking-wider">{title}</div>
      <div className="text-xs leading-relaxed mt-1" style={{ color: `${NAVY}75` }}>{children}</div>
    </div>
  )
}

export function InfoModal({ initialTab = 'how', onClose, onOpenTutorial }: {
  initialTab?: InfoTab | undefined
  onClose: () => void
  onOpenTutorial?: (() => void) | undefined
}) {
  const [tab, setTab] = useState<InfoTab>(initialTab)

  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: `${NAVY}60` }} onClick={onClose}>
      <div className="w-full sm:max-w-lg flex flex-col overflow-hidden" style={{ background: MINERAL, borderRadius: 4, border: `1px solid ${NAVY}18`, boxShadow: '0 24px 64px rgba(21,43,67,0.22)', maxHeight: '90dvh' }} onClick={e => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-3 shrink-0" style={{ background: NAVY, boxShadow: BV_DK }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div style={HEAD} className="text-[10px] uppercase tracking-widest font-600 text-white/40">POLKA<span style={{ color: ORANGE }}>.TRADE</span> · Help</div>
              <div style={HEAD} className="text-xl font-700 text-white mt-0.5">FAQ & Legal</div>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white shrink-0"><X size={20} /></button>
          </div>
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{ ...HEAD, borderRadius: 3, background: tab === t.id ? WARM : 'transparent', color: tab === t.id ? NAVY : 'rgba(255,255,255,0.6)', border: `1px solid ${tab === t.id ? WARM : 'rgba(255,255,255,0.18)'}` }}
                className="px-3 py-1.5 text-xs font-700 uppercase tracking-wider whitespace-nowrap shrink-0"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-2.5 overflow-y-auto">
          {tab === 'how' && (
            <>
              {STEPS.map(({ Icon, title, body }, i) => (
                <div key={title} className="flex gap-3 border p-3" style={{ background: WARM, borderRadius: 3, borderColor: `${NAVY}15` }}>
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center text-white" style={{ background: i === 3 ? '#1F6B45' : NAVY, borderRadius: 3, boxShadow: BV_DK }}><Icon size={18} /></div>
                  <div className="min-w-0">
                    <div style={{ ...HEAD, color: NAVY }} className="text-sm font-700 uppercase tracking-wider">{i + 1}. {title}</div>
                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: `${NAVY}70` }}>{body}</p>
                  </div>
                </div>
              ))}
              {onOpenTutorial && (
                <button onClick={onOpenTutorial} style={{ ...HEAD, borderRadius: 3, background: ORANGE, boxShadow: BV_DK }} className="w-full py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110">
                  Open visual tutorial
                </button>
              )}
            </>
          )}

          {tab === 'responsible' && (
            <>
              <div className="flex items-center gap-2 border p-3" style={{ background: SKY, borderRadius: 3, borderColor: `${NAVY}15`, boxShadow: BV_IN }}>
                <ShieldCheck size={22} style={{ color: NAVY }} className="shrink-0" />
                <div style={{ ...HEAD, color: NAVY }} className="text-lg font-800 uppercase tracking-wider">18+ only</div>
              </div>
              <Section title="Budget discipline">Only trade money you can afford to lose. Set a weekly budget before you start and never chase losses. Predictions are not a source of income.</Section>
              <Section title="Warning signs">Borrowing to trade, hiding activity from family, or trading to escape stress are signs to stop and take a break.</Section>
              <Section title="Self-exclusion">You can ask us to lock your account for 30 days, 6 months or permanently. Contact WhatsApp Support and we will apply it — the lock cannot be reversed early.</Section>
            </>
          )}

          {tab === 'terms' && (
            <>
              <Section title="Market resolution">Each market resolves using the criteria and official source stated on it. If the outcome is unclear, the market is marked disputed and reviewed before any payout.</Section>
              <Section title="Disputes">You can raise a dispute within 24 hours of resolution with proof from an official source. Disputed pools are held until a final decision. Cancelled markets refund every stake.</Section>
              <Section title="Payouts">Payouts are parimutuel: winners share the total pool less a 2% platform fee. Estimates shown before trading are not guaranteed.</Section>
              <Section title="M-Pesa privacy">Your M-Pesa number and transaction references are used only to process deposits and withdrawals. We never share them with other users or third parties for marketing.</Section>
            </>
          )}

          {tab === 'support' && (
            <>
              <Section title="Talk to us">Questions about a deposit, withdrawal or market? Our team replies on WhatsApp.</Section>
              <a href="https://wa.me/254741301508" target="_blank" rel="noopener noreferrer" style={{ ...HEAD, borderRadius: 3, background: '#1F8A4C', boxShadow: BV_DK }} className="w-full py-3 text-sm font-700 uppercase tracking-wider text-white hover:brightness-110 flex items-center justify-center gap-2">
                <MessageCircle size={16} /> WhatsApp Support
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
