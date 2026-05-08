'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, Upload, Link2 } from 'lucide-react'

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
  { id: 1, label: 'About You',        desc: 'Background & contact info' },
  { id: 2, label: 'The Builds',       desc: '3 required + 1 optional' },
  { id: 3, label: 'Submission Check', desc: 'Confirm all links' },
  { id: 4, label: 'References',       desc: '2 references + endorsement' },
  { id: 5, label: 'Sign & Submit',    desc: 'Acknowledgments & signature' },
]

// ─── Progress helper ──────────────────────────────────────────────────────────

function calcProgress(form: FormData): number {
  const keys = Object.keys(form) as (keyof FormData)[]
  const filled = keys.filter(k => {
    const v = form[k]
    return typeof v === 'boolean' ? v : Boolean(v && String(v).trim())
  }).length
  return Math.round((filled / keys.length) * 100)
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box = { sm: 'w-7 h-7 text-sm rounded-lg', md: 'w-9 h-9 text-base rounded-xl', lg: 'w-12 h-12 text-2xl rounded-2xl' }[size]
  const main = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' }[size]
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${box} bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0`}>
        <span className="font-black text-blue-300 leading-none">α</span>
      </div>
      <div className="leading-tight">
        <div className={`font-black text-white uppercase tracking-wider ${main}`}>Alpha World</div>
        <div className="text-xs font-bold text-white/40 uppercase tracking-widest">School</div>
      </div>
    </div>
  )
}

// ─── Field components ─────────────────────────────────────────────────────────

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
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all text-sm"
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
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all resize-none text-sm"
      />
    </div>
  )
}

// ─── Video Input ──────────────────────────────────────────────────────────────

function VideoInput({ label, name, value, onValueChange, placeholder, required }: {
  label: string; name: string; value: string
  onValueChange: (name: string, val: string) => void
  placeholder?: string; required?: boolean
}) {
  const [mode, setMode] = useState<'link' | 'upload'>('link')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadError(null)
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage
      .from('video-submissions').upload(fileName, file, { upsert: true })
    if (error) { setUploadError('Upload failed. Try pasting a link instead.'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('video-submissions').getPublicUrl(data.path)
    onValueChange(name, urlData.publicUrl)
    setUploading(false)
  }

  const isUploaded = value && value.includes('supabase')

  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      <div className="flex gap-1 mb-2">
        {(['link', 'upload'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              mode === m ? 'bg-blue-500/15 text-blue-300 border-blue-400/30' : 'text-white/30 border-white/10 hover:border-white/20 hover:text-white/50'
            }`}>
            {m === 'link' ? <><Link2 className="w-3 h-3" /> Paste Link</> : <><Upload className="w-3 h-3" /> Upload File</>}
          </button>
        ))}
      </div>
      {mode === 'link' ? (
        <div>
          <input type="text" name={name} value={value} onChange={e => onValueChange(name, e.target.value)}
            placeholder={placeholder || 'YouTube, Loom, Zoom, Google Drive…'}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all text-sm"
          />
          <p className="text-xs text-white/20 mt-1">Accepted: YouTube · Loom · Zoom · Google Drive · Vimeo · Dropbox</p>
        </div>
      ) : (
        <div>
          <label className={`flex flex-col items-center justify-center gap-2 w-full border border-dashed rounded-lg px-4 py-6 cursor-pointer transition-all ${
            uploading ? 'border-blue-400/30 bg-blue-500/5' : isUploaded ? 'border-emerald-400/30 bg-emerald-500/5' : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
          }`}>
            <input type="file" accept="video/*" className="sr-only" onChange={handleFileChange} disabled={uploading} />
            {uploading
              ? <><div className="w-5 h-5 border-2 border-blue-400/50 border-t-blue-400 rounded-full animate-spin" /><span className="text-xs text-blue-300 font-medium">Uploading…</span></>
              : isUploaded
              ? <><CheckCircle className="w-5 h-5 text-emerald-400" /><span className="text-xs text-emerald-300 font-medium">Video uploaded ✓</span></>
              : <><Upload className="w-5 h-5 text-white/25" /><span className="text-xs text-white/40 font-medium">Click to select video file</span><span className="text-xs text-white/20">MP4, MOV, WebM · up to 500 MB</span></>
            }
          </label>
          {uploadError && <p className="text-xs text-rose-400 mt-1">{uploadError}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Build card (accordion) ───────────────────────────────────────────────────

function BuildCard({ number, title, meta, optional, filled, children }: {
  number: string; title: string; meta?: [string, string][]
  optional?: boolean; filled?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3.5 bg-white/[0.04] hover:bg-white/[0.07] flex items-center gap-3 text-left transition-colors"
      >
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${
          filled ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
          optional ? 'border-white/15 text-white/25' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
        }`}>
          {filled ? '✓' : number}
        </span>
        <div className="flex-1">
          {optional && <span className="text-xs font-bold text-white/25 uppercase tracking-wider">Optional · </span>}
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white/25 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />}
      </button>
      {open && (
        <>
          {meta && (
            <div className="grid grid-cols-3 border-t border-white/8">
              {meta.map(([k, v]) => (
                <div key={k} className="px-4 py-2.5 border-r last:border-r-0 border-white/8">
                  <div className="text-xs text-white/25 uppercase tracking-wider mb-0.5">{k}</div>
                  <div className="text-xs text-white/50">{v}</div>
                </div>
              ))}
            </div>
          )}
          <div className="p-5 space-y-4 border-t border-white/8">{children}</div>
        </>
      )}
    </div>
  )
}

// ─── Inline examples (Build 2) ────────────────────────────────────────────────

const constraints = [
  { id: 'conflict', label: 'Conflict by Week 5', color: 'amber' as const, examples: [
    { title: 'The Sunday Council', detail: "Every Sunday at 6pm, the cohort sits in a circle for 30 minutes. Each person gets 90 seconds to name one thing they appreciated about another cohort member, and one thing that's grating on them." },
    { title: 'The Repair Protocol', detail: 'Cohort agrees in week 1 to a written 4-step protocol. When something happens, say "I need a Repair." Within 24 hours, sit with a guide for 20 minutes using a specific 4-question template.' },
  ]},
  { id: 'energy', label: 'Energy Drop at Mid-Rotation', color: 'emerald' as const, examples: [
    { title: 'Friday Bring-Your-Best', detail: 'Every Friday afternoon, one cohort member leads a 30-minute recharge activity. Rotates so every kid gets two slots per rotation.' },
    { title: 'The Midpoint Reset Day', detail: 'Built into the calendar at the exact midpoint of each rotation. Morning: solo journaling. Afternoon: cohort names one behavior to recommit to.' },
  ]},
  { id: 'cultural', label: 'Cultural Missteps', color: 'blue' as const, examples: [
    { title: 'The What-We-Got-Wrong Debrief', detail: "Friday evenings in the local language, co-facilitated by the local guide. Each cohort member shares one cultural moment where they messed up." },
    { title: 'The Cultural Compass', detail: "A 60-minute pre-arrival workshop covering 20 specific cultural norms, then role-playing 10 hard scenarios." },
  ]},
  { id: 'homesick', label: 'Someone Wants to Go Home (Week 10)', color: 'rose' as const, examples: [
    { title: 'Buddy-Up Pairs', detail: "Every cohort member is paired with one peer they're responsible for. Daily 5-minute check-ins, weekly 30-minute deeper conversation." },
    { title: 'The Sunday Letter Home', detail: 'Every Sunday at 4pm, every cohort member writes a letter or records a voice memo to someone back home.' },
  ]},
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
      <button className="w-full flex items-center justify-between px-5 py-3 bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-left" onClick={() => setOpen(o => !o)}>
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

// ─── Acknowledgments ──────────────────────────────────────────────────────────

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

// ─── Draft helpers ────────────────────────────────────────────────────────────

const DRAFT_KEY = 'aws_guide_draft_id'

function getDraftId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(DRAFT_KEY)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DRAFT_KEY, id) }
  return id
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplicationForm() {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalSteps = STEPS.length

  useEffect(() => {
    const id = localStorage.getItem(DRAFT_KEY)
    if (!id) return
    supabase.from('guide_applications').select('*').eq('id', id).eq('status', 'draft').single()
      .then(({ data }) => {
        if (!data) return
        const { id: _id, created_at: _ca, updated_at: _ua, status: _s, admin_notes: _an, draft_step, ...fields } = data
        setForm(f => ({ ...f, ...fields }))
        if (draft_step) setStep(draft_step)
        setStarted(true)
      })
  }, [])

  const saveDraft = useCallback((formData: FormData, currentStep: number) => {
    const id = getDraftId()
    setSaveState('saving')
    supabase.from('guide_applications')
      .upsert({ id, ...formData, status: 'draft', draft_step: currentStep }, { onConflict: 'id' })
      .then(() => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000) })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const updated = { ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }
    setForm(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(updated, step), 1500)
  }

  const handleVideoValue = (name: string, val: string) => {
    const updated = { ...form, [name]: val }
    setForm(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(updated, step), 1500)
  }

  const handleStepChange = (newStep: number) => {
    setStep(newStep)
    saveDraft(form, newStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const allAcksChecked = [1,2,3,4,5,6,7,8].every(n => form[`ack_${n}` as keyof FormData])

  const handleSubmit = async () => {
    if (!allAcksChecked) { setError('Please check all acknowledgments before submitting.'); return }
    setSubmitting(true); setError(null)
    const id = getDraftId()
    const { error: dbError } = await supabase.from('guide_applications')
      .upsert({ id, ...form, status: 'submitted', draft_step: totalSteps }, { onConflict: 'id' })
    if (dbError) { setError('Something went wrong. Please try again.'); setSubmitting(false); return }
    localStorage.removeItem(DRAFT_KEY)
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
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">You&rsquo;re In The Pool.</h2>
          <p className="text-white/40 text-sm">Our team will review carefully. You&apos;ll hear from us when decisions are made.</p>
        </div>
      </div>
    )
  }

  // ── Landing ──
  if (!started) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <Logo />
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Inaugural Cohort · 2026–2027</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-4">
            Guide<br/>Application
          </h1>
          <p className="text-white/40 text-sm md:text-base max-w-lg mb-3 leading-relaxed">
            This is not a year off. This is the hardest job Alpha has ever asked anyone to do — and the most rewarding year of your career.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-8 text-white/30 text-xs">
            {['38 Weeks', '3 Continents', '20 Students', 'Kenya · Ecuador · USA'].map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-white/15" />}{s}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 mb-8 w-full max-w-xs text-left">
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
            <button onClick={() => setStarted(true)}
              className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-wider text-sm rounded-full transition-colors shadow-lg shadow-blue-500/20">
              Apply Now <ArrowRight className="w-4 h-4" />
            </button>
            <a href="https://world.alpha.school" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3 text-white/45 hover:text-white font-bold uppercase tracking-wider text-sm rounded-full border border-white/15 hover:border-white/30 transition-colors">
              Explore the Program
            </a>
          </div>
        </div>

        <div className="border-t border-white/8 px-6 py-8 flex flex-wrap justify-center gap-3">
          {[['20', 'Students Selected'], ['3', 'Continents'], ['1', 'School Year']].map(([n, label]) => (
            <div key={label} className="flex flex-col items-center gap-1 px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/10 min-w-[110px]">
              <span className="text-2xl font-black text-blue-400">{n}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/25">{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Form ──
  const progress = calcProgress(form)

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">

      {/* Top bar */}
      <header className="border-b border-white/8 sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            {saveState === 'saving' && <span className="text-xs text-white/25 animate-pulse">Saving…</span>}
            {saveState === 'saved' && <span className="text-xs text-emerald-400/70">Saved ✓</span>}
            <span className="text-xs text-white/40 font-bold tabular-nums">{progress}%</span>
            <span className="text-xs text-white/25 uppercase tracking-wider">Section {step}/{totalSteps}</span>
          </div>
        </div>
        {/* Progress bar — fills based on fields completed */}
        <div className="h-1.5 bg-white/[0.07]">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex gap-8">

        {/* Left sidebar */}
        <aside className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0 pt-1">
          <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-3 px-3">{totalSteps} Sections</p>
          {STEPS.map(s => {
            const done = s.id < step
            const active = s.id === step
            return (
              <button key={s.id} onClick={() => handleStepChange(s.id)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  active ? 'bg-blue-500/12 border border-blue-400/20' : 'hover:bg-white/[0.04]'
                }`}>
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

          {/* Mobile steps */}
          <div className="flex md:hidden items-center gap-1.5 mb-6 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleStepChange(s.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border flex-shrink-0 transition-all ${
                    s.id === step ? 'bg-blue-500 border-blue-400 text-white' :
                    s.id < step  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
                    'border-white/12 text-white/20'
                  }`}>{s.id < step ? '✓' : s.id}</button>
                {i < STEPS.length - 1 && <span className="text-white/15 text-xs">›</span>}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 1 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">About You</h1>
                <p className="text-white/35 text-sm mt-1">Basic info. Write &quot;N/A&quot; if a field doesn&apos;t apply.</p>
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
              <Textarea label="Languages Spoken" name="languages_spoken" value={form.languages_spoken} onChange={handleChange} placeholder="English (native), Spanish (conversational)..." hint="Note proficiency level for each" />
              <Textarea label="Prior International Travel" name="prior_international_travel" value={form.prior_international_travel} onChange={handleChange} placeholder="Kenya (3 weeks, community dev), Ecuador (1 month, teaching)..." rows={3} />
              <Textarea label="Developing-World Living Experience" name="developing_world_experience" value={form.developing_world_experience} onChange={handleChange} placeholder="Yes — 6 weeks in rural Guatemala..." hint="2+ weeks in a developing-world setting? Describe" rows={3} />
              <Textarea label="Health Considerations" name="health_considerations" value={form.health_considerations} onChange={handleChange} placeholder="Anything relevant to extended international travel..." rows={2} />
              <Textarea label="Personal or Family Obligations" name="family_obligations" value={form.family_obligations} onChange={handleChange} placeholder="Partner, children, caregiving responsibilities..." rows={2} />
              <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleChange} placeholder="Name, relationship, phone" />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 2 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">The Builds</h1>
                <p className="text-white/35 text-sm mt-1">Three required, one optional. Click each to expand.</p>
              </div>

              <BuildCard number="1" title="The Workshop Sprint" filled={Boolean(form.build1_link)}
                meta={[['Testing', 'Life skills design'], ['Time', '2 hours max'], ['Deliverable', 'Slides / doc']]}>
                <p className="text-white/45 text-sm leading-relaxed">
                  Design a 90-minute kickoff workshop for your cohort — anchored in one of: <span className="text-white/70 font-medium">Food · Water · Empowerment · Education · Healthcare · Culture · Community</span>.
                </p>
                <Input label="Build 1 Link or File Name" name="build1_link" value={form.build1_link} onChange={handleChange} placeholder="https://docs.google.com/... or Smith_Jane_Build1.pdf" />
              </BuildCard>

              <BuildCard number="2" title="The Cohort Experience" filled={Boolean(form.build2_design_link && form.build2_video_link)}
                meta={[['Testing', 'Design instinct'], ['Time', '1.5–2 hours'], ['Deliverable', 'Doc + 3-min video']]}>
                <div className="text-white/45 text-sm space-y-2">
                  <p>Design something that prevents a cohort from breaking. Pick one constraint:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {['Conflict by week 5', 'Energy drop at mid-rotation', 'Cultural missteps', 'Someone wants to go home (week 10)'].map(c => (
                      <div key={c} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-white/45">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">·</span>{c}
                      </div>
                    ))}
                  </div>
                </div>
                <ExamplesInline />
                <Input label="Design Doc Link" name="build2_design_link" value={form.build2_design_link} onChange={handleChange} placeholder="One-pager, plan, or visual flow" />
                <VideoInput label="3-Minute Video" name="build2_video_link" value={form.build2_video_link} onValueChange={handleVideoValue} required />
              </BuildCard>

              <BuildCard number="3" title="The Video" filled={Boolean(form.build3_video_link)}
                meta={[['Testing', 'Self-awareness, honesty'], ['Time', '20 min'], ['Deliverable', '90 sec – 2 min']]}>
                <p className="text-white/45 text-sm leading-relaxed">
                  Talk to us. Phone quality fine. Don&apos;t script. <span className="text-white/65">(1) What are you most excited about?</span> <span className="text-white/65">(2) What do you understand your role to be?</span>
                </p>
                <VideoInput label="Video" name="build3_video_link" value={form.build3_video_link} onValueChange={handleVideoValue} required />
              </BuildCard>

              <BuildCard number="4" title="Language Tape" optional filled={Boolean(form.build4_language_link)}>
                <p className="text-white/45 text-sm leading-relaxed">
                  Speak a language other than English — especially Swahili, Spanish, or relevant to Kenya or Ecuador. Anything natural. ≤60 seconds.
                </p>
                <VideoInput label="Language Video (optional)" name="build4_language_link" value={form.build4_language_link} onValueChange={handleVideoValue} />
              </BuildCard>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 3 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Submission Check</h1>
                <p className="text-white/35 text-sm mt-1">Confirm every build is linked. Click &ldquo;Fix&rdquo; to jump back.</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Build 1 — Workshop Sprint', value: form.build1_link, required: true },
                  { label: 'Build 2 — Design doc', value: form.build2_design_link, required: true },
                  { label: 'Build 2 — 3-min video', value: form.build2_video_link, required: true },
                  { label: 'Build 3 — The Video', value: form.build3_video_link, required: true },
                  { label: 'Build 4 — Language Tape', value: form.build4_language_link, required: false },
                ].map(({ label, value, required }) => (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${value ? 'bg-emerald-500/8 border-emerald-500/15' : required ? 'bg-rose-500/8 border-rose-500/15' : 'bg-white/[0.02] border-white/8'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black border ${value ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : required ? 'border-rose-400/30 text-rose-400' : 'border-white/10 text-white/20'}`}>
                      {value ? '✓' : required ? '!' : '–'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-wide ${value ? 'text-emerald-300' : required ? 'text-rose-300' : 'text-white/20'}`}>{label}</div>
                      {value ? <div className="text-xs text-white/20 truncate mt-0.5">{value}</div>
                        : <div className={`text-xs mt-0.5 ${required ? 'text-rose-400/60' : 'text-white/15'}`}>{required ? 'Missing' : 'Optional'}</div>}
                    </div>
                    {!value && required && (
                      <button onClick={() => handleStepChange(2)} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider border border-blue-400/20 px-3 py-1 rounded-full flex-shrink-0 transition-colors">Fix</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 4 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">References</h1>
                <p className="text-white/35 text-sm mt-1">Two internal Alpha references. One must be your direct manager or Head of School.</p>
              </div>
              {([
                { n: 1, fields: ['reference1_name', 'reference1_role', 'reference1_relationship', 'reference1_phone', 'reference1_email'] },
                { n: 2, fields: ['reference2_name', 'reference2_role', 'reference2_relationship', 'reference2_phone', 'reference2_email'] },
              ] as { n: number; fields: (keyof FormData)[] }[]).map(({ n, fields }) => (
                <div key={n} className="bg-white/[0.03] rounded-xl border border-white/8 p-5 space-y-4">
                  <p className="text-xs font-black text-white/25 uppercase tracking-widest">Reference {n}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[['Name', fields[0]], ['Role', fields[1]], ['Relationship', fields[2]], ['Phone', fields[3]], ['Email', fields[4]]].map(([label, fieldName]) => (
                      <Input key={String(fieldName)} label={String(label)} name={String(fieldName)} value={form[fieldName as keyof FormData] as string} onChange={handleChange} type={String(label) === 'Email' ? 'email' : 'text'} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-blue-500/8 rounded-xl border border-blue-400/12 p-5 space-y-4">
                <div>
                  <p className="text-xs font-black text-blue-300 uppercase tracking-widest">Manager / HoS Endorsement</p>
                  <p className="text-xs text-white/25 mt-1">To be completed by the candidate&apos;s direct manager or Head of School — not by the candidate.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-2">Has this guide had your verbal support to apply?</label>
                  <div className="flex flex-wrap gap-2">
                    {['Yes', 'No', 'Conversation pending'].map(opt => (
                      <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-xs font-bold uppercase tracking-wide transition-all ${form.manager_endorsement_status === opt ? 'border-blue-400/40 bg-blue-500/15 text-blue-300' : 'border-white/10 text-white/25 hover:border-white/20'}`}>
                        <input type="radio" name="manager_endorsement_status" value={opt} checked={form.manager_endorsement_status === opt} onChange={handleChange} className="sr-only" />{opt}
                      </label>
                    ))}
                  </div>
                </div>
                <Textarea label="Endorsement Statement (150 words minimum)" name="manager_endorsement_text" value={form.manager_endorsement_text} onChange={handleChange} placeholder="Is this guide ready — physically, emotionally, and as a representative of Alpha? Why or why not?" rows={5} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Endorser Name" name="endorser_name" value={form.endorser_name} onChange={handleChange} />
                  <Input label="Endorser Role" name="endorser_role" value={form.endorser_role} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 5 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Acknowledge & Sign</h1>
                <p className="text-white/35 text-sm mt-1">Check each line. Each one is something you are actually agreeing to.</p>
              </div>
              <div className="space-y-2">
                {acknowledgments.map((text, i) => {
                  const key = `ack_${i + 1}` as keyof FormData
                  return (
                    <label key={i} className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${form[key] ? 'border-blue-400/20 bg-blue-500/8' : 'border-white/8 bg-white/[0.02] hover:border-white/12'}`}>
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
              onClick={() => step === 1 ? setStarted(false) : handleStepChange(step - 1)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white/25 hover:text-white/55 transition-colors rounded-full border border-transparent hover:border-white/8"
            >
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Home' : 'Back'}
            </button>
            {step < totalSteps ? (
              <button onClick={() => handleStepChange(step + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting…' : <><span>Submit</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
