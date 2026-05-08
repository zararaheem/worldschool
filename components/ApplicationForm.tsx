'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, Users, Globe, Calendar, MapPin } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────

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
  { id: 1, label: 'About You',        desc: 'Background & contact info' },
  { id: 2, label: 'The Builds',       desc: '3 required + 1 optional' },
  { id: 3, label: 'Submission Check', desc: 'Confirm all links' },
  { id: 4, label: 'References',       desc: '2 references + endorsement' },
  { id: 5, label: 'Sign & Submit',    desc: 'Acknowledgments & signature' },
]

// ─── Field components ────────────────────────────────────────────────────────

function Input({ label, name, value, onChange, required, placeholder, type = 'text', hint }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; type?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-white/30 mb-1.5">{hint}</p>}
      <input
        type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all"
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
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-white/30 mb-1.5">{hint}</p>}
      <textarea
        name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all"
      />
    </div>
  )
}

// ─── Inline examples (Build 2) ────────────────────────────────────────────────

const constraints = [
  {
    id: 'conflict', label: 'Conflict by Week 5', color: 'amber' as const,
    examples: [
      { title: 'The Sunday Council', detail: "Every Sunday at 6pm, the cohort sits in a circle for 30 minutes. Each person gets 90 seconds to name one thing they appreciated about another cohort member." },
      { title: 'The Repair Protocol', detail: 'Cohort agrees in week 1 to a written 4-step protocol. When something happens, say "I need a Repair." Within 24 hours, sit with a guide for 20 minutes using the protocol.' },
    ],
  },
  {
    id: 'energy', label: 'Energy Drop at Mid-Rotation', color: 'emerald' as const,
    examples: [
      { title: 'Friday Bring-Your-Best', detail: 'Every Friday afternoon, one cohort member leads a 30-minute recharge activity. Rotates so every kid gets two slots per rotation.' },
      { title: 'The Midpoint Reset Day', detail: 'Built into the calendar at the exact midpoint of each rotation. Morning: solo journaling. Afternoon: cohort names one behavior to recommit to.' },
    ],
  },
  {
    id: 'cultural', label: 'Cultural Missteps', color: 'blue' as const,
    examples: [
      { title: 'The What-We-Got-Wrong Debrief', detail: "Friday evenings in the local language, co-facilitated by the local guide. Each cohort member shares one cultural moment where they learned." },
      { title: 'The Cultural Compass', detail: "A 60-minute pre-arrival workshop covering 20 specific cultural norms, then role-playing 10 hard scenarios. By naming the likely misstep ahead of time, we build competence." },
    ],
  },
  {
    id: 'homesick', label: 'Someone Wants to Go Home (Week 10)', color: 'rose' as const,
    examples: [
      { title: 'Buddy-Up Pairs', detail: "Every cohort member is paired with one peer they're responsible for. Daily 5-minute check-ins, weekly 30-minute deeper conversation on Sundays." },
      { title: 'The Sunday Letter Home', detail: 'Every Sunday at 4pm, every cohort member writes a letter or records a voice memo to someone back home. Then each shares one sentence with the cohort.' },
    ],
  },
]

const dotColor = { amber: 'bg-amber-400', emerald: 'bg-emerald-400', blue: 'bg-blue-400', rose: 'bg-rose-400' }
const labelColor = { amber: 'text-amber-300 border-amber-400/20 bg-amber-400/10', emerald: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10', blue: 'text-blue-300 border-blue-400/20 bg-blue-400/10', rose: 'text-rose-300 border-rose-400/20 bg-rose-400/10' }

function ExampleItem({ title, detail }: { title: string; detail: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/8 rounded-lg overflow-hidden">
      <button className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors" onClick={() => setOpen(o => !o)}>
        <span className="text-sm font-semibold text-white/60">{title}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-white/25 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />}
      </button>
      {open && <div className="px-4 pb-3"><p className="text-white/45 text-sm leading-relaxed">{detail}</p></div>}
    </div>
  )
}

function ExamplesInline() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-black text-white/50 uppercase tracking-widest">Worked Examples</span>
        <span className="flex items-center gap-1.5 text-xs text-white/25">
          {open ? 'Hide' : 'See what strong looks like'}
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>
      {open && (
        <div className="px-5 py-4 space-y-4 border-t border-white/8">
          {constraints.map(c => (
            <div key={c.id}>
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mb-2 ${labelColor[c.color]}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor[c.color]}`} />
                {c.label}
              </div>
              <div className="space-y-1.5">
                {c.examples.map(ex => <ExampleItem key={ex.title} {...ex} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Build card ──────────────────────────────────────────────────────────

function BuildCard({ number, title, meta, optional, children }: {
  number: string; title: string; meta?: [string, string][]; optional?: boolean; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="px-5 py-3.5 bg-white/[0.04] border-b border-white/8 flex items-center gap-3">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${optional ? 'border border-white/15 text-white/25' : 'bg-blue-500/20 border border-blue-400/30 text-blue-300'}`}>
          {number}
        </span>
        <div>
          {optional && <span className="text-xs font-bold text-white/25 uppercase tracking-wider">Optional · </span>}
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
      </div>
      {meta && (
        <div className="grid grid-cols-3 border-b border-white/8">
          {meta.map(([k, v]) => (
            <div key={k} className="px-4 py-2.5 border-r last:border-r-0 border-white/8">
              <div className="text-xs text-white/25 uppercase tracking-wider mb-0.5">{k}</div>
              <div className="text-xs text-white/50">{v}</div>
            </div>
          ))}
        </div>
      )}
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── Acknowledgments ─────────────────────────────────────────────────────────

const acknowledgments = [
  'I understand this is a job. It is not a vacation.',
  'I understand I will be the primary 24/7 caretaker for 5–7 students for multiple weeks at a time, including travel time and re-entry weeks.',
  'I understand I will be away from my home, family, and routines for two extended international rotations and one U.S.-based rotation.',
  "I understand I am responsible for upholding Alpha's three commitments in environments where our normal systems are not available.",
  'I understand I will hold both students AND myself to a high physical, mental, emotional, and academic standard for the full year.',
  'I understand that when something goes wrong — medical, emotional, logistical — I am the first responder.',
  'I understand that I represent Alpha to communities, parents, and partners who have trusted us with their kids and their land.',
  'My direct manager and Head of School are aware that I am applying.',
]

// ─── Logo ────────────────────────────────────────────────────────────

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const mainText = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'
  const subText = size === 'lg' ? 'text-sm' : 'text-xs'
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size === 'lg' ? '48' : size === 'sm' ? '24' : '32'}
        height={size === 'lg' ? '48' : size === 'sm' ? '24' : '32'}
        viewBox="0 0 2793.08 1060.44"
        className="object-contain"
      >
        <path d="M568.05,118.7l141.02-77.83-59.86,185.66,107.9,111.72,15.28,73.59,159.91,83.28,3.75,61.63-100.47,64.53-161.96-30.78-61.98,56.6,58.3,308.28-187.08-165.57,57.38,271.84-190.69-200.38-28.8-89.65-92.41,204.48-44.79-197.55,19.32-99.06-132.53,89.79,57.24-174.98,39.41-48.61-124.32,39.62,96.65-162.74,73.02-52.22-131.39,5.73,167.05-114.34,130.55-40.61,63.68-128.92L585.11-1.3l-17.05,120.28v-.28ZM238.83,352.69l158.21-40.68,182.76,31.63,62.27-11.82-257.84-94.88-128.92,40.12-116.75,80.02,100.26-4.39ZM558.15,367.27l-284.93,84.55-130.76,150.99-41.04,125.38,107.97-73.45,99.69-121.7,174.77-66.44,74.29-99.06v-.28ZM191.35,520.88l72.45-83.63,279.49-83-145.54-25.12-153.96,39.62-91.98,65.66-72.38,121.7,111.94-35.38v.14ZM363.99,628.85l90.5-49.53,22.64-91.98-157.93,59.72-96.3,117.6-22.15,113.7,32.9,145.26c44.44-97.71,88.38-195.85,130.33-294.77ZM453.93,598.71l-76.84,42.03-46.06,107.76,33.33,103.66,147.38,155.17-50.59-239.51-7.08-169.11h-.14ZM593.95,357.93l37.36,34.95,106.13,14.15-66.79-63.68-76.7,14.58ZM766.1,427.41l-142.29-18.61-44.65-41.75-82.43,110.17-22.5,91.98,182.34-94.88,214.11,81.44-16.84-49.53,26.18-19.32-113.92-59.29v-.21ZM668.53,572.46l109.81-33.89-120.71-45.92-187.36,97.22,7.08,158.63,191.18-176.04ZM875.49,575.78l-77.83-25.75-94.03,29.08,128.63,24.48,43.23-27.81ZM916.17,505.52l-19.67-10.26-22.93,16.98,17.97,53.21,27.17-17.48-2.55-42.45ZM680.27,75.89l-115.12,63.68-10.12,70.76,197.34,187.5-10.68-51.51-111.37-115.33,49.95-155.1ZM597.13,661.05l-115.19,106.13,162.74,144.06-47.27-249.98-.28-.21ZM638.24,312.86l-100.9-96.09,26.11-183.96-108.47,71.39-59.15,119.29,242.41,89.37Z" fill="white" fillRule="evenodd"/>
        <path d="M1338.37,726.14h63.68l-142.5-227.76c-4.11-7.37-10.12-13.5-17.4-17.77-7.28-4.27-15.56-6.52-24-6.52s-16.72,2.25-24,6.52c-7.28,4.27-13.28,10.41-17.39,17.77l-143.14,227.76h63.26l35.02-56.6h170.66l35.8,56.6ZM1217.23,529.79l59.65,97.29h-119.29l59.65-97.29ZM1678,726.14v-47.05h-146.46c-34.67,0-44.08-11.18-44.08-39.76v-159.77h-54.62v161.96c0,62.19,21.23,84.91,94.03,84.91l151.13-.28ZM1896.84,655.38c71.96,0,92.56-16.27,92.56-75.21v-21.23c0-58.23-22.09-79.53-92.56-79.53h-197.41v246.73h54.91v-70.76h142.5ZM1934.42,578.26c0,26.04-9.34,32.9-38.28,32.9h-141.79v-84.27h141.01c29.64,0,38.99,7.57,38.99,34.39v16.98h.07ZM2335.89,726.14v-246.58h-54.63v100.47h-180.71v-100.47h-54.97v246.58h54.97v-98.35h180.71v98.35h54.63ZM2686.69,726.14h63.68l-142.5-227.76c-4.11-7.37-10.11-13.5-17.4-17.77-7.27-4.27-15.56-6.52-24-6.52s-16.71,2.25-24,6.52c-7.27,4.27-13.27,10.41-17.38,17.77l-143.14,227.76h63.25l35.02-56.6h170.66l35.8,56.6ZM2565.55,529.79l59.66,97.29h-119.3l59.64-97.29Z" fill="white" fillRule="evenodd"/>
      </svg>
      <div className="leading-tight">
        <div className={`font-black text-white uppercase tracking-wider ${mainText}`}>Alpha World</div>
        <div className={`font-bold text-white/40 uppercase tracking-widest ${subText}`}>School</div>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ApplicationForm() {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = STEPS.length

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  const allAcksChecked = [1,2,3,4,5,6,7,8].every(n => form[`ack_${n}` as keyof FormData])

  const handleSubmit = async () => {
    if (!allAcksChecked) { setError('Please check all acknowledgments before submitting.'); return }
    setSubmitting(true); setError(null)
    const { error: dbError } = await supabase.from('guide_applications').insert([form])
    if (dbError) { setError('Something went wrong. Please try again or email apply@alphaworldschool.com.'); setSubmitting(false); return }
    setSubmitted(true); setSubmitting(false)
  }

  // ── Success ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Logo size="lg" />
          <div className="mt-8 w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Application Received</p>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-3">You&rsquo;re In The Pool.</h2>
          <p className="text-white/40 text-sm">Our team will review carefully. You&apos;ll hear from us when decisions are made.</p>
        </div>
      </div>
    )
  }

  // ── Landing ──
  if (!started) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        <nav className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <Logo />
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider px-4 py-1.5 rounded-full border border-white/10">For Students</span>
            <span className="text-xs font-bold text-white/25 uppercase tracking-wider px-4 py-1.5">For Parents</span>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-5">Inaugural Cohort · 2026–2027</p>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-none mb-5">
            Guide<br/>Application
          </h1>
          <p className="text-white/40 text-base md:text-lg max-w-lg mb-3 leading-relaxed">
            This is not a year off. This is the hardest job Alpha has ever asked anyone to do — and the most rewarding year of your career.
          </p>

          {/* Stats with icons */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 w-full max-w-2xl">
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-sm font-bold text-white">20 Students</span>
              <span className="text-xs text-white/30">Selected</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col items-center gap-2">
              <Globe className="w-8 h-8 text-emerald-400" />
              <span className="text-sm font-bold text-white">3 Continents</span>
              <span className="text-xs text-white/30">Kenya · Ecuador · USA</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col items-center gap-2">
              <Calendar className="w-8 h-8 text-amber-400" />
              <span className="text-sm font-bold text-white">1 School Year</span>
              <span className="text-xs text-white/30">38 Weeks</span>
            </div>
          </div>

          {/* Section preview */}
          <div className="flex flex-col gap-2 mb-10 w-full max-w-xs text-left">
            <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-1 text-center">{totalSteps} Sections</p>
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/8">
                <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center text-xs text-white/25 font-bold flex-shrink-0">{i + 1}</span>
                <div>
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wide">{s.label}</span>
                  <span className="text-xs text-white/20 ml-2">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setStarted(true)}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-wider text-sm rounded-full transition-colors shadow-lg shadow-blue-500/20"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </button>
            <a href="https://world.alpha.school" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 text-white/45 hover:text-white font-bold uppercase tracking-wider text-sm rounded-full border border-white/15 hover:border-white/30 transition-colors"
            >
              Explore the Program
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">

      {/* Top bar */}
      <header className="border-b border-white/8 sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs text-white/25 font-medium uppercase tracking-wider">Section {step} of {totalSteps}</span>
        </div>
        <div className="h-0.5 bg-white/5">
          <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex gap-8">

        {/* Left sidebar */}
        <aside className="hidden md:flex flex-col gap-1 w-56 flex-shrink-0 pt-1">
          <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-3 px-3">{totalSteps} Sections</p>
          {STEPS.map(s => {
            const done = s.id < step
            const active = s.id === step
            return (
              <button
                key={s.id}
                onClick={() => done && setStep(s.id)}
                disabled={!done && !active}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  active ? 'bg-blue-500/12 border border-blue-400/20' :
                  done   ? 'hover:bg-white/[0.04] cursor-pointer' :
                  'cursor-default'
                }`}
              >
                <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border transition-all ${
                  active ? 'bg-blue-500 border-blue-400 text-white' :
                  done   ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
                  'border-white/12 text-white/20'
                }`}>
                  {done ? '✓' : s.id}
                </span>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-blue-300' : done ? 'text-white/50' : 'text-white/20'}`}>{s.label}</div>
                  <div className={`text-xs mt-0.5 ${active ? 'text-white/30' : 'text-white/15'}`}>{s.desc}</div>
                </div>
              </button>
            )
          })}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Mobile step dots */}
          <div className="flex md:hidden items-center gap-1.5 mb-6 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black border flex-shrink-0 ${
                  s.id === step ? 'bg-blue-500 border-blue-400 text-white' :
                  s.id < step  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
                  'border-white/12 text-white/20'
                }`}>{s.id < step ? '✓' : s.id}</span>
                {i < STEPS.length - 1 && <span className="text-white/12 text-xs">›</span>}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 1 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">About You</h1>
                <p className="text-white/35 text-sm mt-1.5">Basic info. Write &quot;N/A&quot; if a field doesn&apos;t apply.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Jane Smith" />
                <Input label="Email" name="email" value={form.email} onChange={handleChange} required placeholder="jane@alpha.school" type="email" />
                <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                <Input label="Role at Alpha" name="role_at_alpha" value={form.role_at_alpha} onChange={handleChange} required placeholder="e.g. Guide, Academic Coach" />
                <Input label="Campus" name="campus" value={form.campus} onChange={handleChange} placeholder="e.g. Austin, NYC" />
                <Input label="Years at Alpha" name="years_at_alpha" value={form.years_at_alpha} onChange={handleChange} placeholder="e.g. 2 years" />
                <Input label="Direct Manager" name="direct_manager" value={form.direct_manager} onChange={handleChange} placeholder="Manager's name" />
                <Input label="Head of School" name="head_of_school" value={form.head_of_school} onChange={handleChange} placeholder="Head of School's name" />
              </div>
              <Textarea label="Languages Spoken" name="languages_spoken" value={form.languages_spoken} onChange={handleChange} placeholder="English (native), Spanish (conversational)..." />
              <Textarea label="Prior International Travel" name="prior_international_travel" value={form.prior_international_travel} onChange={handleChange} placeholder="Kenya (3 weeks, community dev)..." />
              <Textarea label="Developing-World Living Experience" name="developing_world_experience" value={form.developing_world_experience} onChange={handleChange} placeholder="Yes — 6 weeks in rural..." />
              <Textarea label="Health Considerations" name="health_considerations" value={form.health_considerations} onChange={handleChange} placeholder="Anything relevant to extended international travel..." />
              <Textarea label="Personal or Family Obligations" name="family_obligations" value={form.family_obligations} onChange={handleChange} placeholder="Partner, children, caregiving responsibilities..." />
              <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleChange} placeholder="Name, relationship, phone" />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 2 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">The Builds</h1>
                <p className="text-white/35 text-sm mt-1.5">Three required, one optional. Submit each to the Drive folder from your invitation email.</p>
              </div>

              <BuildCard number="1" title="The Workshop Sprint"
                meta={[['Testing', 'Life skills design, AI fluency'], ['Time', '2 hours max'], ['Deliverable', 'Slides / Notion / one-pager']]}>
                <p className="text-white/45 text-sm leading-relaxed">
                  Design a real 90-minute kickoff workshop for your cohort of 5–7 students — anchored in one of: <span className="text-white/70 font-medium">Food · Water · Empowerment · Education</span>.
                </p>
                <Input label="Build 1 Link or File Name" name="build1_link" value={form.build1_link} onChange={handleChange} placeholder="https://docs.google.com/... or Smith_Jane_Build1.pdf" />
              </BuildCard>

              <BuildCard number="2" title="The Cohort Experience"
                meta={[['Testing', 'Design instinct, cultural humility'], ['Time', '1.5–2 hours'], ['Deliverable', 'Design doc + 3-min video']]}>
                <div className="text-white/45 text-sm space-y-3">
                  <p>Design something that prevents a cohort from breaking. Pick one constraint:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['Conflict by week 5', 'Energy drop at mid-rotation', 'Cultural missteps', 'Someone wants to go home (week 10)'].map(c => (
                      <div key={c} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-white/45">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">·</span>{c}
                      </div>
                    ))}
                  </div>
                </div>
                <ExamplesInline />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Design Doc Link" name="build2_design_link" value={form.build2_design_link} onChange={handleChange} placeholder="https://docs.google.com/document/..." />
                  <Input label="3-Minute Video Link" name="build2_video_link" value={form.build2_video_link} onChange={handleChange} placeholder="https://youtube.com/... or Loom link" />
                </div>
              </BuildCard>

              <BuildCard number="3" title="The Video"
                meta={[['Testing', 'Self-awareness, honesty'], ['Time', '20 min'], ['Deliverable', '90 sec – 2 min video']]}>
                <p className="text-white/45 text-sm leading-relaxed">
                  Talk to us. Phone quality fine. Don&apos;t script. <span className="text-white/65">(1) What are you most excited about?</span> <span className="text-white/65">(2) What do you understand about this job that others might not?</span>
                </p>
                <Input label="Video Link" name="build3_video_link" value={form.build3_video_link} onChange={handleChange} placeholder="https://youtube.com/... or Loom link" />
              </BuildCard>

              <BuildCard number="4" title="Language Tape" optional>
                <p className="text-white/45 text-sm leading-relaxed">
                  Speak a language other than English — especially Swahili, Spanish, or any language relevant to Kenya or Ecuador? Talk to us in it. Anything natural. ≤60 seconds.
                </p>
                <Input label="Language Video Link (optional)" name="build4_language_link" value={form.build4_language_link} onChange={handleChange} placeholder="https://youtube.com/... or Loom link" />
              </BuildCard>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 3 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Submission Check</h1>
                <p className="text-white/35 text-sm mt-1.5">Confirm every build is linked. Go back to fix anything missing.</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Build 1 — Workshop Sprint', value: form.build1_link, required: true },
                  { label: 'Build 2 — Cohort Experience (design doc)', value: form.build2_design_link, required: true },
                  { label: 'Build 2 — Cohort Experience (3-min video)', value: form.build2_video_link, required: true },
                  { label: 'Build 3 — The Video', value: form.build3_video_link, required: true },
                  { label: 'Build 4 — Language Tape', value: form.build4_language_link, required: false },
                ].map(({ label, value, required }) => (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${value ? 'bg-emerald-500/8 border-emerald-500/15' : required ? 'bg-rose-500/8 border-rose-500/15' : 'bg-white/[0.02] border-white/8'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black border ${value ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : required ? 'bg-rose-500/20 border-rose-400/30 text-rose-400' : 'border-white/15 text-white/25'}`}>
                      {value ? '✓' : required ? '!' : '–'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-wide ${value ? 'text-emerald-300' : required ? 'text-rose-300' : 'text-white/20'}`}>{label}</div>
                      {value
                        ? <div className="text-xs text-white/20 truncate mt-0.5"><a href={value} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 underline">{value}</a></div>
                        : <div className={`text-xs mt-0.5 ${required ? 'text-rose-400/60' : 'text-white/15'}`}>{required ? 'Missing — go back and add a link' : 'Optional'}</div>
                      }
                    </div>
                    {!value && required && (
                      <button onClick={() => setStep(2)} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider border border-blue-400/20 px-3 py-1 rounded-full flex-shrink-0">
                        Fix
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 4 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">References</h1>
                <p className="text-white/35 text-sm mt-1.5">Two internal Alpha references. One must be your direct manager or Head of School.</p>
              </div>
              {([
                { n: 1, fields: ['reference1_name', 'reference1_role', 'reference1_relationship', 'reference1_phone', 'reference1_email'] },
                { n: 2, fields: ['reference2_name', 'reference2_role', 'reference2_relationship', 'reference2_phone', 'reference2_email'] },
              ] as { n: number; fields: (keyof FormData)[] }[]).map(({ n, fields }) => (
                <div key={n} className="bg-white/[0.03] rounded-xl border border-white/8 p-5 space-y-4">
                  <p className="text-xs font-black text-white/25 uppercase tracking-widest">Reference {n}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[['Name', fields[0]], ['Role', fields[1]], ['Relationship to You', fields[2]], ['Phone', fields[3]], ['Email', fields[4]]].map(([label, fieldName]) => (
                      <Input key={String(fieldName)} label={String(label)} name={String(fieldName)} value={form[fieldName as keyof FormData] as string} onChange={handleChange} type={String(label) === 'Email' ? 'email' : 'text'} />
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-blue-500/8 rounded-xl border border-blue-400/12 p-5 space-y-4">
                <div>
                  <p className="text-xs font-black text-blue-300 uppercase tracking-widest">Manager / Head of School Endorsement</p>
                  <p className="text-xs text-white/25 mt-1">To be completed by the candidate&apos;s direct manager or Head of School — not by the candidate.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-2.5">Has this guide had your verbal support to apply?</label>
                  <div className="flex flex-wrap gap-2">
                    {['Yes', 'No', 'Conversation pending'].map(opt => (
                      <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-xs font-bold uppercase tracking-wide transition-all ${form.manager_endorsement_status === opt ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' : 'border-white/15 text-white/25 hover:border-white/30'}`}>
                        <input type="radio" name="manager_endorsement_status" value={opt} checked={form.manager_endorsement_status === opt} onChange={handleChange} className="sr-only" />{opt}
                      </label>
                    ))}
                  </div>
                </div>
                <Textarea label="Endorsement Statement (150 words minimum)" name="manager_endorsement_text" value={form.manager_endorsement_text} onChange={handleChange} placeholder="Is this guide ready for this commitment? Why?" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Endorser Name" name="endorser_name" value={form.endorser_name} onChange={handleChange} />
                  <Input label="Endorser Role" name="endorser_role" value={form.endorser_role} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 5 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Acknowledge & Sign</h1>
                <p className="text-white/35 text-sm mt-1.5">Check each line. Each one is something you are actually agreeing to.</p>
              </div>
              <div className="space-y-2">
                {acknowledgments.map((text, i) => {
                  const key = `ack_${i + 1}` as keyof FormData
                  return (
                    <label key={i} className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${form[key] ? 'border-blue-400/20 bg-blue-500/8' : 'border-white/8 bg-white/[0.02] hover:border-white/15'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${form[key] ? 'bg-blue-500 border-blue-400' : 'border-white/20'}`}>
                        {form[key] && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <input type="checkbox" name={key} checked={form[key] as boolean} onChange={handleChange} className="sr-only" />
                      <span className="text-sm text-white/50 leading-relaxed">{text}</span>
                    </label>
                  )
                })}
              </div>
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                <p className="text-white/20 text-sm mb-4 italic">I am submitting this application of my own volition. I have read everything in this packet.</p>
                <Input label="Full Name (Signature)" name="applicant_name" value={form.applicant_name} onChange={handleChange} required placeholder="Type your full legal name" />
              </div>
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-5 border-t border-white/8">
            <button
              onClick={() => step === 1 ? setStarted(false) : setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white/25 hover:text-white/55 transition-colors rounded-full border border-transparent hover:border-white/15"
            >
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Home' : 'Back'}
            </button>
            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting…' : <><span>Submit</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
