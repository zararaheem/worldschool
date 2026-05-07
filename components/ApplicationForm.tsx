'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle, AlertCircle, X, BookOpen,
  ChevronDown, ChevronRight, ArrowRight, ArrowLeft,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  full_name: string; email: string; phone: string; role_at_alpha: string
  campus: string; years_at_alpha: string; direct_manager: string; head_of_school: string
  languages_spoken: string; prior_international_travel: string
  developing_world_experience: string; health_considerations: string
  family_obligations: string; emergency_contact: string
  build1_link: string; build2_design_link: string; build2_video_link: string
  build3_video_link: string; build4_language_link: string
  reference1_name: string; reference1_role: string; reference1_relationship: string
  reference1_phone: string; reference1_email: string
  reference2_name: string; reference2_role: string; reference2_relationship: string
  reference2_phone: string; reference2_email: string
  manager_endorsement_status: string; manager_endorsement_text: string
  endorser_name: string; endorser_role: string
  ack_1: boolean; ack_2: boolean; ack_3: boolean; ack_4: boolean
  ack_5: boolean; ack_6: boolean; ack_7: boolean; ack_8: boolean
  applicant_name: string
}

const initialForm: FormData = {
  full_name: '', email: '', phone: '', role_at_alpha: '', campus: '', years_at_alpha: '',
  direct_manager: '', head_of_school: '', languages_spoken: '', prior_international_travel: '',
  developing_world_experience: '', health_considerations: '', family_obligations: '', emergency_contact: '',
  build1_link: '', build2_design_link: '', build2_video_link: '', build3_video_link: '', build4_language_link: '',
  reference1_name: '', reference1_role: '', reference1_relationship: '', reference1_phone: '', reference1_email: '',
  reference2_name: '', reference2_role: '', reference2_relationship: '', reference2_phone: '', reference2_email: '',
  manager_endorsement_status: '', manager_endorsement_text: '', endorser_name: '', endorser_role: '',
  ack_1: false, ack_2: false, ack_3: false, ack_4: false,
  ack_5: false, ack_6: false, ack_7: false, ack_8: false,
  applicant_name: '',
}

const STEPS = [
  { id: 1, label: 'About You' },
  { id: 2, label: 'The Builds' },
  { id: 3, label: 'Submission Check' },
  { id: 4, label: 'References' },
  { id: 5, label: 'Sign & Submit' },
]

// ─── Shared field components ──────────────────────────────────────────────────

function Input({ label, name, value, onChange, required, placeholder, type = 'text', hint }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; type?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-blue-600 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-white/40 mb-1.5">{hint}</p>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
      />
    </div>
  )
}

function Textarea({ label, name, value, onChange, required, placeholder, rows = 3, hint }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  required?: boolean; placeholder?: string; rows?: number; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-blue-600 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none text-sm"
      />
    </div>
  )
}

// ─── Examples Modal ───────────────────────────────────────────────────────────

const constraints = [
  {
    id: 'conflict', label: 'Conflict by Week 5', color: 'amber',
    examples: [
      { title: 'The Sunday Council', summary: 'Weekly structured circle where friction gets surfaced before it festers.', detail: `Every Sunday at 6pm, the cohort sits in a circle for 30 minutes. Each person gets 90 seconds to name one thing they appreciated about another cohort member that week, and one thing that's grating on them. Guide facilitates the first three weeks, then a rotating cohort member runs it. By week 5, friction gets surfaced in real-time before it festers into factions.` },
      { title: 'The Repair Protocol', summary: 'A laminated 4-step conflict resolution process the whole cohort commits to in week 1.', detail: `Cohort agrees in week 1 to a written 4-step protocol for handling friction. When something happens, the protocol says you say "I need a Repair." Within 24 hours, the two students sit with a guide for 20 minutes using a specific 4-question template. No avoidance, no triangulating. The protocol is laminated and lives on the wall of every common space all year.` },
    ],
  },
  {
    id: 'energy', label: 'Energy Drop at Mid-Rotation', color: 'green',
    examples: [
      { title: 'Friday Bring-Your-Best', summary: 'Rotating student-led recharge sessions that distribute ownership and spotlight.', detail: `Every Friday afternoon, one cohort member designs and leads a 30-minute recharge activity for the group. Rotates so every kid gets two slots per rotation. Solves energy AND distributes leadership ownership AND gives every kid a recurring moment in the spotlight.` },
      { title: 'The Midpoint Reset Day', summary: "A structured retreat day built into the calendar at each rotation's exact midpoint.", detail: `Built into the calendar at the exact midpoint of each rotation. Morning is solo journaling, afternoon is a cohort conversation where everyone names one behavior they want to recommit to and one they want to drop, evening is a shared meal with a gratitude rotation.` },
    ],
  },
  {
    id: 'cultural', label: 'Cultural Missteps', color: 'blue',
    examples: [
      { title: 'The What-We-Got-Wrong Debrief', summary: 'Friday evening sessions co-facilitated by local guides.', detail: `Friday evenings in the local language (with the local guide co-facilitating). Each cohort member shares one cultural moment from the week where they felt unsure or knew they messed up. The local guide normalizes the mistake and teaches the next-level cultural understanding. Transforms shame into curriculum.` },
      { title: 'The Cultural Compass', summary: 'A pre-arrival workshop covering 20 cultural norms through scenario role-play.', detail: `A 60-minute pre-arrival workshop the day before each rotation begins. Covers 20 specific cultural norms, then role-plays 10 hard scenarios. By naming the misstep ahead of time, when it happens it's predicted, not catastrophic.` },
    ],
  },
  {
    id: 'homesick', label: 'Someone Wants to Go Home (Week 10)', color: 'rose',
    examples: [
      { title: 'Buddy-Up Pairs', summary: 'Peer accountability pairs with daily check-ins who rotate every rotation.', detail: `Every cohort member is paired with one specific peer they're responsible for. Daily 5-minute check-ins built into the schedule, weekly 30-minute deeper conversation on Sundays. Pairs rotate every rotation. When someone starts to spiral, their buddy notices it the day it starts.` },
      { title: 'The Sunday Letter Home', summary: 'Weekly letters/voice memos home that channel homesickness into connection.', detail: `Every Sunday at 4pm, every cohort member writes a letter or records a voice memo to someone back home. Then each shares one sentence from theirs with the cohort. Channels homesickness into connection rather than avoidance.` },
    ],
  },
]

const colorMap: Record<string, { badge: string; border: string; dot: string; title: string }> = {
  amber: { badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20', border: 'border-amber-500/20', dot: 'bg-amber-400', title: 'text-amber-300' },
  green: { badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', border: 'border-emerald-500/20', dot: 'bg-emerald-400', title: 'text-emerald-300' },
  blue:  { badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',   border: 'border-blue-500/20',   dot: 'bg-blue-400',   title: 'text-blue-300'   },
  rose:  { badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',   border: 'border-rose-500/20',   dot: 'bg-rose-400',   title: 'text-rose-300'   },
}

function ExampleCard({ title, summary, detail, color }: { title: string; summary: string; detail: string; color: string }) {
  const [open, setOpen] = useState(false)
  const c = colorMap[color]
  return (
    <div className="mb-6 pb-4 border-b border-gray-200">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{number}</span>
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{title}</h2>
      </div>
      {subtitle && <p className="text-gray-500 text-sm ml-10">{subtitle}</p>}
    </div>
  )
}

function ConstraintSection({ constraint }: { constraint: typeof constraints[0] }) {
  const [open, setOpen] = useState(false)
  const c = colorMap[constraint.color]
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Build {number}</span>
        </div>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="text-gray-400 uppercase tracking-wider mb-1 font-medium">Testing</div>
            <div className="text-gray-700">{testing}</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="text-gray-400 uppercase tracking-wider mb-1 font-medium">Time</div>
            <div className="text-gray-700">{time}</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="text-gray-400 uppercase tracking-wider mb-1 font-medium">Deliverable</div>
            <div className="text-gray-700">{deliverable}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Build card ───────────────────────────────────────────────────────────────

function BuildCard({ number, title, testing, time, deliverable, optional, children }: {
  number: string; title: string; testing?: string; time?: string; deliverable?: string
  optional?: boolean; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
      <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex items-center gap-3">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${optional ? 'border-white/20 text-white/30' : 'border-blue-400/40 bg-blue-500/10 text-blue-300'}`}>
          {number}
        </span>
        <div>
          {optional && <span className="text-xs font-bold text-white/30 uppercase tracking-wider block">Optional</span>}
          <h3 className="font-bold text-white text-sm">{title}</h3>
        </div>
      </div>
      {testing && (
        <div className="grid grid-cols-3 gap-0 border-b border-white/10">
          {[['Testing', testing], ['Time', time!], ['Deliverable', deliverable!]].map(([k, v]) => (
            <div key={k} className="px-4 py-3 border-r last:border-r-0 border-white/10">
              <div className="text-xs text-white/30 uppercase tracking-wider mb-0.5 font-medium">{k}</div>
              <div className="text-xs text-white/60">{v}</div>
            </div>
          ))}
        </div>
      )}
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── Acknowledgment text ──────────────────────────────────────────────────────

const acknowledgments = [
  'I understand this is a job. It is not a vacation.',
  'I understand I will be the primary 24/7 caretaker for 5–7 students for multiple weeks at a time, including travel time and re-entry weeks.',
  'I understand I will be away from my home, family, and routines for two extended international rotations and one U.S.-based rotation.',
  "I understand I am responsible for upholding Alpha's three commitments — students love school, learn 2x in 2 hours, and learn life skills — in environments where the systems and tools we use at home are not available.",
  'I understand I will hold both students AND myself to a high physical, mental, emotional, and academic standard for the full year.',
  'I understand that when something goes wrong — medical, emotional, logistical — I am the first responder until the medical lead or local guide is on the scene.',
  'I understand that I represent Alpha to communities, parents, and partners who have trusted us with their kids and their land.',
  'My direct manager and Head of School are aware that I am applying.',
]

// ─── Logo SVG (matching world.alpha.school geometric mark) ────────────────────

function AlphaLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,2 38,32 2,32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <line x1="20" y1="2" x2="20" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <line x1="2" y1="32" x2="38" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <line x1="20" y1="2" x2="8" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
      <line x1="20" y1="2" x2="32" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
      <circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplicationForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(false)

  const totalSteps = STEPS.length
  const progress = ((step - 1) / (totalSteps - 1)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const allAcksChecked = [1,2,3,4,5,6,7,8].every(n => form[`ack_${n}` as keyof FormData])

  const handleSubmit = async () => {
    if (!allAcksChecked) { setError('Please check all acknowledgments before submitting.'); return }
    setSubmitting(true)
    setError(null)
    const { error: dbError } = await supabase.from('guide_applications').insert([form])
    if (dbError) { setError('Something went wrong. Please try again or email apply@alphaworldschool.com.'); setSubmitting(false); return }
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted</h2>
        <p className="text-gray-700 text-lg mb-3">
          We have your application on file. Our team will review it carefully.
        </p>
        <p className="text-gray-400">
          You'll hear from us when decisions are made. In the meantime, keep being the person who applied.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-10 space-y-12">

      {/* SECTION 1 */}
      <section>
        <SectionHeader number="1" title="About You" subtitle='Basic info. If a field does not apply, write "N/A."' />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Jane Smith" />
          <Input label="Email" name="email" value={form.email} onChange={handleChange} required placeholder="jane@alpha.school" type="email" />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
          <Input label="Current Role at Alpha" name="role_at_alpha" value={form.role_at_alpha} onChange={handleChange} required placeholder="e.g. Guide, Academic Coach" />
          <Input label="Campus" name="campus" value={form.campus} onChange={handleChange} placeholder="e.g. Austin, NYC" />
          <Input label="Years at Alpha" name="years_at_alpha" value={form.years_at_alpha} onChange={handleChange} placeholder="e.g. 2 years" />
          <Input label="Direct Manager" name="direct_manager" value={form.direct_manager} onChange={handleChange} placeholder="Name of direct manager" />
          <Input label="Head of School" name="head_of_school" value={form.head_of_school} onChange={handleChange} placeholder="Name of Head of School" />
        </div>
        <div className="mt-5 space-y-5">
          <Textarea
            label="Languages Spoken"
            name="languages_spoken"
            value={form.languages_spoken}
            onChange={handleChange}
            placeholder="English (native), Spanish (conversational), Swahili (basic)"
            hint="Note proficiency: conversational, fluent, or native"
          />
          <Textarea
            label="Prior International Travel"
            name="prior_international_travel"
            value={form.prior_international_travel}
            onChange={handleChange}
            placeholder="Kenya (3 weeks, community development), Ecuador (1 month, volunteer teaching)..."
            hint="List countries, length of stay, and purpose"
            rows={3}
          />
          <Textarea
            label="Developing-World Living Experience"
            name="developing_world_experience"
            value={form.developing_world_experience}
            onChange={handleChange}
            placeholder="Yes — spent 6 weeks in rural Guatemala building water systems with a local NGO..."
            hint="Have you spent 2+ weeks living in a developing-world setting? Y/N — describe"
            rows={3}
          />
          <Textarea
            label="Health Considerations"
            name="health_considerations"
            value={form.health_considerations}
            onChange={handleChange}
            placeholder="Any current health considerations relevant to extended international travel..."
            rows={2}
          />
          <Textarea
            label="Personal or Family Obligations"
            name="family_obligations"
            value={form.family_obligations}
            onChange={handleChange}
            placeholder="Partner, children, caregiving responsibilities — please be specific so we can plan with you, not around you..."
            hint="Relevant to a 38-week commitment"
            rows={3}
          />
          <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleChange} placeholder="Name, relationship, phone number" />
        </div>
      </section>

      {/* SECTION 2 */}
      <section>
        <SectionHeader number="2" title="The Builds" subtitle="Three required Builds. One optional fourth. Submit each to the shared Drive folder from your invitation email." />

        <BuildCard
          number="1"
          title="The Workshop Sprint"
          testing="Life skills design, project orientation, taste, AI fluency"
          time="2 hours max"
          deliverable="Workshop artifact (slides / Notion / one-pager)"
        >
          <p className="text-gray-500 text-sm leading-relaxed">
            Design and produce a real 90-minute kickoff workshop for your cohort of 5–7 students — anchored in one of: <span className="text-gray-900">Food · Water · Empowerment · Education · Healthcare · Culture & Conservation · Community</span>. The workshop should launch a real project that continues building over the rotation, with a real output the community actually uses.
          </p>
          <Input
            label="Build 1 Link or File Name"
            name="build1_link"
            value={form.build1_link}
            onChange={handleChange}
            placeholder="https://docs.google.com/... or Smith_Jane_Build1.pdf"
          />
        </BuildCard>

        <BuildCard
          number="2"
          title="The Cohort Experience"
          testing="Anticipating breaking points, design instinct, cultural humility, cohort resilience"
          time="1.5–2 hours"
          deliverable="Two links: experience design + 3-min walkthrough video"
        >
          <div className="text-gray-500 text-sm leading-relaxed space-y-2">
            <p>Design something that prevents a cohort from breaking. Pick one design constraint:</p>
            <ul className="space-y-1 ml-4">
              {['Assume your cohort has conflict by week 5.', 'Assume energy drops by mid-rotation.', 'Assume cultural missteps happen.', 'Assume someone wants to go home by week 10.'].map(c => (
                <li key={c} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">·</span> {c}
                </li>
              ))}
            </ul>
            <p className="text-blue-500 text-xs mt-2">See the Examples tab for worked examples of what strong submissions look like.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <Input label="Build 2 — Design Doc Link" name="build2_design_link" value={form.build2_design_link} onChange={handleChange} placeholder="Link to one-pager, plan, or visual flow" />
            <Input label="Build 2 — 3-Minute Video Link" name="build2_video_link" value={form.build2_video_link} onChange={handleChange} placeholder="YouTube, Loom, or Drive link" />
          </div>
        </BuildCard>

        <BuildCard
          number="3"
          title="The Video"
          testing="Self-awareness, honesty, mindset"
          time="20 minutes"
          deliverable="One 90-second to 2-minute video"
        >
          <p className="text-gray-500 text-sm leading-relaxed">
            Talk to us. 90 seconds to 2 minutes. Phone-quality is fine. Don't script. Don't read. Two questions: <span className="text-gray-900">(1) What are you most excited about for this year?</span> <span className="text-gray-900">(2) What do you understand your role to be on this trip?</span> Be specific — not what you hope it will be, what you actually believe it is.
          </p>
          <Input label="Build 3 — Video Link" name="build3_video_link" value={form.build3_video_link} onChange={handleChange} placeholder="YouTube, Loom, or Drive link" />
        </BuildCard>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Build 4 · Optional</span>
            </div>
            <h3 className="font-bold text-gray-700">Language Tape</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-gray-500 text-sm leading-relaxed">
              If you speak a language other than English — especially Swahili, Spanish, or any language relevant to Kenya or Ecuador — talk to us in it. Tell us about your morning, your last vacation, your favorite food. Anything natural. ≤60 seconds.
            </p>
            <Input label="Build 4 — Language Video Link (Optional)" name="build4_language_link" value={form.build4_language_link} onChange={handleChange} placeholder="YouTube, Loom, or Drive link (optional)" />
          </div>
          <span className="text-xs text-white/30 font-medium uppercase tracking-wider">Step {step} of {totalSteps}</span>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* SECTION 3 — Submission Tracker */}
      <section>
        <SectionHeader number="3" title="Submission Tracker" subtitle="Confirm your builds are ready. Paste links above in Section 2." />
        <div className="space-y-2">
          {[
            { key: 'build1', label: 'Build 1 — Workshop Sprint', value: form.build1_link },
            { key: 'build2d', label: 'Build 2 — Cohort Experience (design)', value: form.build2_design_link },
            { key: 'build2v', label: 'Build 2 — Cohort Experience (video)', value: form.build2_video_link },
            { key: 'build3', label: 'Build 3 — The Video', value: form.build3_video_link },
            { key: 'build4', label: 'Build 4 — Language Tape (optional)', value: form.build4_language_link },
          ].map(({ key, label, value }) => (
            <div key={key} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${value ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${value ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
              {value && <span className="text-xs text-gray-400 ml-auto truncate max-w-[40%]">{value}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 */}
      <section>
        <SectionHeader number="4" title="References & Endorsement" subtitle="Two internal Alpha references. One must be your direct manager or Head of School." />
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Reference 1</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Jane Smith" />
              <Input label="Email" name="email" value={form.email} onChange={handleChange} required placeholder="jane@alpha.school" type="email" />
              <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
              <Input label="Current Role at Alpha" name="role_at_alpha" value={form.role_at_alpha} onChange={handleChange} required placeholder="e.g. Guide, Academic Coach" />
              <Input label="Campus" name="campus" value={form.campus} onChange={handleChange} placeholder="e.g. Austin, NYC" />
              <Input label="Years at Alpha" name="years_at_alpha" value={form.years_at_alpha} onChange={handleChange} placeholder="e.g. 2 years" />
              <Input label="Direct Manager" name="direct_manager" value={form.direct_manager} onChange={handleChange} placeholder="Name of direct manager" />
              <Input label="Head of School" name="head_of_school" value={form.head_of_school} onChange={handleChange} placeholder="Name of Head of School" />
            </div>
            <Textarea label="Languages Spoken" name="languages_spoken" value={form.languages_spoken} onChange={handleChange} placeholder="English (native), Spanish (conversational), Swahili (basic)" hint="Note proficiency: conversational, fluent, or native" />
            <Textarea label="Prior International Travel" name="prior_international_travel" value={form.prior_international_travel} onChange={handleChange} placeholder="Kenya (3 weeks, community development), Ecuador (1 month, volunteer teaching)..." hint="List countries, length of stay, and purpose" rows={3} />
            <Textarea label="Developing-World Living Experience" name="developing_world_experience" value={form.developing_world_experience} onChange={handleChange} placeholder="Yes — spent 6 weeks in rural Guatemala..." hint="Have you spent 2+ weeks living in a developing-world setting? Y/N — describe" rows={3} />
            <Textarea label="Health Considerations" name="health_considerations" value={form.health_considerations} onChange={handleChange} placeholder="Any current health considerations relevant to extended international travel..." rows={2} />
            <Textarea label="Personal or Family Obligations" name="family_obligations" value={form.family_obligations} onChange={handleChange} placeholder="Partner, children, caregiving responsibilities..." hint="Relevant to a 38-week commitment" rows={3} />
            <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleChange} placeholder="Name, relationship, phone number" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Reference 2</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Name" name="reference2_name" value={form.reference2_name} onChange={handleChange} />
              <Input label="Role" name="reference2_role" value={form.reference2_role} onChange={handleChange} />
              <Input label="Relationship to You" name="reference2_relationship" value={form.reference2_relationship} onChange={handleChange} />
              <Input label="Phone" name="reference2_phone" value={form.reference2_phone} onChange={handleChange} />
              <Input label="Email" name="reference2_email" value={form.reference2_email} onChange={handleChange} type="email" />
            </div>
          </div>
        )}

        {/* STEP 4 — References */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Step 4 of 5</p>
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">References</h1>
              <p className="text-white/40 text-sm mt-2">Two internal Alpha references. One must be your direct manager or Head of School.</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Reference 1</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name" name="reference1_name" value={form.reference1_name} onChange={handleChange} />
                <Input label="Role" name="reference1_role" value={form.reference1_role} onChange={handleChange} />
                <Input label="Relationship to You" name="reference1_relationship" value={form.reference1_relationship} onChange={handleChange} />
                <Input label="Phone" name="reference1_phone" value={form.reference1_phone} onChange={handleChange} />
                <Input label="Email" name="reference1_email" value={form.reference1_email} onChange={handleChange} type="email" />
              </div>
            </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="font-semibold text-blue-700 mb-1 text-sm">Manager / Head of School Endorsement</h3>
            <p className="text-gray-500 text-xs mb-4">To be filled out by the candidate's direct manager or Head of School — <em>not</em> by the candidate.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Has this guide had your verbal support to apply?</label>
                <div className="flex gap-4">
                  {['Yes', 'No', 'Conversation pending'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="manager_endorsement_status"
                        value={opt}
                        checked={form.manager_endorsement_status === opt}
                        onChange={handleChange}
                        className="accent-blue-600"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <Textarea label="Endorsement Statement (150 words minimum)" name="manager_endorsement_text" value={form.manager_endorsement_text} onChange={handleChange} placeholder="In your judgment, is this guide ready for the demands of this role — physically, emotionally, and as a representative of Alpha to families, students, and partner communities? Why or why not?" rows={5} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Endorser Printed Name" name="endorser_name" value={form.endorser_name} onChange={handleChange} />
                <Input label="Endorser Role" name="endorser_role" value={form.endorser_role} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 */}
      <section>
        <SectionHeader number="5" title="Acknowledgments & Signature" subtitle="Initial each line. Each one is a real thing you are agreeing to." />
        <div className="space-y-3 mb-6">
          {acknowledgments.map((text, i) => {
            const key = `ack_${i + 1}` as keyof FormData
            return (
              <label key={i} className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${form[key] ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                <input
                  type="checkbox"
                  name={key}
                  checked={form[key] as boolean}
                  onChange={handleChange}
                  className="mt-0.5 accent-blue-600 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
              </label>
            )
          })}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-gray-500 text-sm mb-4 italic">
            I am submitting this application of my own volition. I have read everything in this packet. I understand what I am signing up for.
          </p>
          <Input
            label="Full Name (Signature)"
            name="applicant_name"
            value={form.applicant_name}
            onChange={handleChange}
            required
            placeholder="Type your full legal name"
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-rose-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors uppercase tracking-wider"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </section>
    </form>
  )
}
